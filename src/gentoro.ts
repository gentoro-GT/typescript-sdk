import {
    GetToolsRequest,
    GetToolsResponse,
    GetToolsResponseSchema,
    Message,
    SdkConfig,
    ToolDef,
    Request,
    KeyValuePair,
    RunToolsRequest,
    AuthenticationScope,
    RunToolsResponse,
    RunToolsResponseSchema,
    ExecResult,
    Providers,
    ToolCall,
    ExecResulType,
    ExecOutput,
    ExecError,
    SdkError,
    SdkEventType,
    SdkEventHandler,
    AuthRequest,
    SdkAuthenticationEventInfo,
    GetAuthStatusRequest,
    GetAuthStatusResponse,
    GetAuthStatusResponseSchema,
    AuthenticationStatus,
    AuthStatusError, AuthRequests, Authentication,
} from "./types/types";
import {Transport} from "./transport";
import OpenAI from "openai";
import {
    ChatCompletionMessageToolCall, ChatCompletionTool,
} from "openai/resources/chat/completions";
import {ChatCompletionContentPartText, ChatCompletionToolMessageParam} from "openai/src/resources/chat/completions";

export class Gentoro {
    private _transport: Transport;
    private _metadata: KeyValuePair[] = [];
    private _eventListeners: Map<SdkEventType, SdkEventHandler[]> = new Map<SdkEventType, SdkEventHandler[]>();
    private _authRequestIntervalCheckerId: NodeJS.Timeout | null = null;
    private _authModUri: string;
    private _authentication: Authentication;
    constructor(readonly config: SdkConfig, metadata: KeyValuePair[] = [] ) {
        this._transport = new Transport(config);
        if (config.apiKey == null) {
            throw new Error('The api_key client option must be set either by passing api_key to the SDK or by setting the GENTORO_API_KEY environment variable')
        }

        if ( (config.authModBaseUrl || null) === null) {
            throw new Error('Authentication module base URL is required, in case one or more tools requires authentication');
        } else {
            this._authModUri = config.authModBaseUrl as string;
        }

        this._authentication = config.authentication ?? {
            scope: AuthenticationScope.ApiKey,
        };

        this._metadata.push(...metadata);
    }

    metadata = ( key:string, value: string | null ): Gentoro => {
        this._metadata.push({key: key, value: value});
        return this;
    }

    getTools = (bridgeUid: string, messages: Message[] = [] ): Promise<ToolDef[] | ChatCompletionTool []> => {
        return new Promise<ToolDef[] | ChatCompletionTool []>((resolve, reject) => {
            const requestContent:GetToolsRequest = {
                messages: messages,
                metadata: this._metadata,
            };

            const request: Request<GetToolsRequest> = {
                uri: '/bornio/v1/inference/'+bridgeUid+'/retrievetools',
                content: requestContent,
            };

            this._transport.sendRequest<GetToolsRequest, GetToolsResponse>(request, GetToolsResponseSchema)
                .then((result) => {
                    resolve(this.asProviderTools(result.content.tools));
                }).catch((error) => {
                    reject(error);
                });
        });
    }

    private asProviderTools = (_tools: ToolDef[]): ToolDef[] | ChatCompletionTool [] => {
        return _tools.map( (_tool) => {
            switch (this.config.provider) {
                case Providers.Openai:
                    return {
                        type: 'function',
                        function: {
                            name: _tool.definition.name,
                            description: _tool.definition.description,
                            parameters: {
                                type: "object",
                                properties: _tool.definition.parameters.properties.reduce((acc, val) =>
                                    Object.assign(acc, {[val.name]: { type: val.type, description: val.description }}), {}),
                                required: _tool.definition.parameters.required,
                            },
                        }
                    } as ChatCompletionTool;
                default:
                    return _tool;
            }
        }) as ToolDef[] | ChatCompletionTool[];
    }

    runToolNatively = (bridgeUid: string, toolName: string, params: object ): Promise<ExecResult> => {
        return new Promise<ExecResult>((resolve, reject) => {
            const requestContent:ToolCall = {
                id: 'native',
                type: 'function',
                details: {
                    name: toolName,
                    arguments: params != null ? JSON.stringify(params) : '{}',
                },
            };
            this.runTools(bridgeUid, null, [requestContent])
                .then((result: ExecResult[]) => {
                    resolve(result[0]);
                }).catch((error) => {
                    reject(error);
                });

        });
    }

    runTools = (bridgeUid: string,
                messages: Message[] | null,
                result: OpenAI.ChatCompletion | ToolCall[] ): Promise<ExecResult[] | ChatCompletionToolMessageParam [] | null> => {
        return new Promise<ExecResult[] | ChatCompletionToolMessageParam [] | null>((resolve, reject) => {
            const toolExecRequest: ToolCall[] | null = this.asInternalToolCalls(result);
            if( toolExecRequest == null || toolExecRequest.length === 0 ) {
                resolve([]);
                return;
            }

            const requestContent:RunToolsRequest = {
                messages: messages === null ? [] : messages,
                metadata: this._metadata,
                authentication: this._authentication,
                toolCalls: toolExecRequest,
            };

            const request: Request<RunToolsRequest> = {
                uri: '/bornio/v1/inference/'+bridgeUid+'/runtools',
                content: requestContent,
            };

            this._transport.sendRequest<RunToolsRequest, RunToolsResponse>(request, RunToolsResponseSchema)
                .then((_result) => {
                    const authRequests: ExecResult [] = _result.content.results
                        .filter((msg) => msg.type === ExecResulType.AuthRequest)
                    const execErrors: ExecResult [] = _result.content.results
                        .filter((msg) => msg.type === ExecResulType.Error);
                    const execOutputs: ExecResult [] = _result.content.results
                        .filter((msg) => msg.type === ExecResulType.ExecOutput);

                    // check if there was any error during execution.
                    if( execErrors.length > 0 ) {
                        reject( execErrors.map((msg) => {
                            const errorInfo:ExecError = msg.data as ExecError;
                            return {
                                code: errorInfo.code,
                                message: errorInfo.message,
                                details: errorInfo.details,
                            } as SdkError;
                        }) );
                    } else if( authRequests.length > 0 ) {
                        if( !this._eventListeners.has(SdkEventType.AUTHENTICATION_REQUEST)
                            || (this._eventListeners.get(SdkEventType.AUTHENTICATION_REQUEST) || []).length === 0 ) {
                            reject({
                                code: 'AUTHENTICATION_REQUIRED',
                                message: 'Tool execution requires authentication, and no listener is registered to handle it',
                                details: JSON.stringify(authRequests),
                            } as SdkError);
                        }
                        const _flattenAuthRequests: {
                            type: ExecResulType,
                            toolCallId: string,
                            toolUid?: string,
                            authRequest: AuthRequest,
                        }[] = [];
                        authRequests.forEach((msg) => {
                            const _authRequests:AuthRequests = msg.data as AuthRequests;
                            _authRequests.requests.forEach((authRequest) => {
                                _flattenAuthRequests.push({
                                    type: msg.type,
                                    toolCallId: msg.toolCallId,
                                    toolUid: msg.toolUid,
                                    authRequest: authRequest,
                                });
                            });
                        });
                        // iterate through all authentication request, until done.
                        let _pos = 0;
                        const authRequestOrchestrator: () => void = () => {
                            if( _pos < _flattenAuthRequests.length ) {
                                const _authRequest = _flattenAuthRequests[_pos];
                                const _authRequestData:AuthRequest = _authRequest.authRequest;
                                (this._eventListeners.get(SdkEventType.AUTHENTICATION_REQUEST) || []) [0]({
                                    eventType: SdkEventType.AUTHENTICATION_REQUEST,
                                    sdk: this,
                                    eventInfo: {
                                        toolCallId: _authRequest.toolCallId,
                                        toolUid: _authRequest.toolUid,
                                        authRequest: _authRequestData,
                                        callback: ({abortSignal, result, data}): void => {
                                            if( abortSignal ) {
                                                reject({
                                                    code: 'AUTHENTICATION_ABORTED',
                                                    message: 'Authentication request was aborted by the listener',
                                                    details: JSON.stringify(_authRequestData),
                                                } as SdkError);
                                            } else if ( result === AuthenticationStatus.Expired || result === AuthenticationStatus.Error ) {
                                                reject(data);
                                            } else {
                                                _pos++;
                                                authRequestOrchestrator();
                                            }
                                        }
                                    },
                                });
                            } else {
                                this.runTools(bridgeUid, messages, result)
                                    .then((result) => {
                                        resolve(result);
                                    }).catch((error) => {
                                        reject(error);
                                    });
                            }
                        };
                        authRequestOrchestrator();
                    } else {
                        resolve(this.asProviderToolCallResult(execOutputs));
                    }
                }).catch((error) => {
                    reject({
                        code: 'RUNTIME_ERROR',
                        message: error.message,
                        details: JSON.stringify(error),
                    } as SdkError);
                });
        });
    }

    private asProviderToolCallResult = (messages: ExecResult[]): ExecResult[] | ChatCompletionToolMessageParam [] | null => {
        return messages.map( (msg) => {
            if( msg.type === ExecResulType.ExecOutput ) {
                const data:ExecOutput = msg.data as ExecOutput;
                switch (this.config.provider) {
                    case Providers.Openai:
                        return {
                            role: "tool",
                            tool_call_id: msg.toolCallId,
                            content: [
                                {
                                    text: data.content,
                                    type: data.contentType,
                                } as ChatCompletionContentPartText
                            ],
                        } as ChatCompletionToolMessageParam;
                    default:
                        return msg;
                }
            } else {
                return null;
            }
        }).filter((msg) => msg != null) as ExecResult[] | ChatCompletionToolMessageParam[];
    }

    private asInternalToolCalls = (messages: any): ToolCall[] | null => {
        switch (this.config.provider) {
            case Providers.Openai:
                const completion:OpenAI.ChatCompletion = messages;
                if ('choices' in completion) {
                    if (completion.choices[0].finish_reason !== 'tool_calls') {
                        return [];
                    }

                    const message = completion.choices[0].message;
                    const tool_calls: ChatCompletionMessageToolCall[] = message.tool_calls as ChatCompletionMessageToolCall[];
                    if (tool_calls == null || tool_calls.length === 0) {
                        return [];
                    }

                    return tool_calls.map((call: ChatCompletionMessageToolCall) => {
                        return {
                            id: call.id,
                            type: call.type,
                            details: {
                                name: call.function.name,
                                arguments: call.function.arguments,
                            },
                        };
                    });

                } else {
                    // no function call requested
                    return [];
                }
            case Providers.Gentoro:
                return messages as ToolCall[];
            default:
                return null;
        }
    }

    addSdkEventListener = (event: SdkEventType, handler: SdkEventHandler): void => {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event)?.push(handler);
    }

    handleAuthenticationRequest = (eventInfo: SdkAuthenticationEventInfo, window: Window ) : void => {
        window.open(`${this._authModUri}/authmod/landing?` +
                `request_uid=${eventInfo.authRequest.requestUid}&` +
                `request_secret=${eventInfo.authRequest.requestSecret}&` +
                `connection_uid=${eventInfo.authRequest.connectionUid}`, '_blank');

        const authRequestChecker = () => {
            const requestContent:GetAuthStatusRequest = {
                connectionUid: eventInfo.authRequest.connectionUid,
                requestUid: eventInfo.authRequest.requestUid,
                requestSecret: eventInfo.authRequest.requestSecret,
            };

            const request: Request<GetAuthStatusRequest> = {
                uri: '/authmod/v1/request/status',
                content: requestContent,
            };

            this._transport.sendRequest<GetAuthStatusRequest, GetAuthStatusResponse>(request, GetAuthStatusResponseSchema)
                .then((_result) => {
                    if( this._authRequestIntervalCheckerId ) {
                        clearTimeout(this._authRequestIntervalCheckerId as NodeJS.Timeout);
                        this._authRequestIntervalCheckerId = null;
                    }
                    this._authRequestIntervalCheckerId = null;
                    if( _result.content.result === AuthenticationStatus.Authenticated ) {
                        eventInfo.callback({result: AuthenticationStatus.Authenticated});
                    } else if( _result.content.result === AuthenticationStatus.Error || _result.content.result === AuthenticationStatus.Expired ) {
                        const _errorInfo:AuthStatusError = _result.content.info as AuthStatusError;
                        eventInfo.callback({
                            result: _result.content.result,
                            data: {
                                code: _errorInfo.code,
                                message: _errorInfo.message,
                                details: _errorInfo.stackTrace,
                            }
                        });
                    } else {
                        this._authRequestIntervalCheckerId = setTimeout(authRequestChecker, 500);
                    }
                }).catch((error) => {
                    console.error(error);
                    this._authRequestIntervalCheckerId = setTimeout(authRequestChecker, 500);
                });
        };

        // start listening for the authentication status
        this._authRequestIntervalCheckerId = setTimeout(authRequestChecker, 500);
    }
}
