import {Type, type Static} from '@sinclair/typebox'
export enum Providers {
    Openai = 'openai',
    Anthropic = 'anthropic',
    OpenaiAssistants = 'openai_assistants',
    Vercel = 'vercel',
    Gentoro = 'gentoro',
}

export type ProviderTypes = keyof Providers;

export enum AuthenticationScope {
    Metadata = 'metadata',
    ApiKey = 'api_key'
}

export type ScopeForMetadata = Static<typeof ScopeForMetadataSchema> & BaseObject;
export const ScopeForMetadataSchema = Type.Object({
    keyName: Type.String(),
});

export type Authentication = Static<typeof AuthenticationSchema> & BaseObject;
export const AuthenticationSchema = Type.Object({
    scope: Type.Enum(AuthenticationScope),
    metadata: Type.Optional(ScopeForMetadataSchema),
});

export interface SdkConfig {
    baseUrl?: string;
    authModBaseUrl?: string;
    timeoutMs?: number;
    apiKey?: string;
    provider?: Providers;
    authentication?: Authentication;
}

export type BaseObject = {};

export interface Request <T extends BaseObject> {
    uri: string,
    content: T,
}

export interface Response<T extends BaseObject> {
    content: T,
}

export type Message = Static<typeof MessageSchema> & BaseObject;
export const MessageSchema = Type.Object({
    role: Type.String(),
    content: Type.String(),
});

export type Context = Static<typeof ContextSchema> & BaseObject;
export const ContextSchema = Type.Object({
    bridgeUid: Type.String(),
    messages: Type.Optional(Type.Array(MessageSchema)),
});

export type KeyValuePair = Static<typeof KeyValuePairSchema> & BaseObject;
export const KeyValuePairSchema = Type.Object({
    key: Type.String(),
    value: Type.String(),
});

export type GetToolsRequest = Static<typeof GetToolsRequestSchema> & BaseObject;
export const GetToolsRequestSchema = Type.Object({
    context: ContextSchema,
    metadata: Type.Array(KeyValuePairSchema),
});

export type FunctionParameter = Static<typeof FunctionParameterSchema> & BaseObject;
export const FunctionParameterSchema = Type.Object({
    name: Type.String(),
    type: Type.String(),
    description: Type.String(),
});

export type FunctionParameterCollection = Static<typeof FunctionParameterCollectionSchema> & BaseObject;
export const FunctionParameterCollectionSchema = Type.Object({
    properties: Type.Array(FunctionParameterSchema),
    required: Type.Array(Type.String()),
});

export type Function = Static<typeof FunctionSchema> & BaseObject;
export const FunctionSchema = Type.Object({
    name: Type.String(),
    description: Type.String(),
    parameters: FunctionParameterCollectionSchema,
});

export type ToolDef = Static<typeof ToolDefSchema> & BaseObject;
export const ToolDefSchema = Type.Object({
    type: Type.String(),
    definition: FunctionSchema,
});

export type GetToolsResponse = Static<typeof GetToolsResponseSchema> & BaseObject;
export const GetToolsResponseSchema = Type.Object({
    tools: Type.Array(ToolDefSchema),
});

export type TextContent = Static<typeof AuthenticationDataSchema> & BaseObject;
export const TextContentSchema = Type.Object({
    text: Type.String()
});

export type NumberContent = Static<typeof AuthenticationDataSchema> & BaseObject;
export const NumberContentSchema = Type.Object({
    number: Type.Number()
});

export type BoolContent = Static<typeof AuthenticationDataSchema> & BaseObject;
export const BoolContentSchema = Type.Object({
    flag: Type.Boolean()
});

export enum DataType {
    String = 'string',
    Number = 'number',
    Object = 'object',
    Boolean = 'boolean',
    Array = 'array'
}
export type DataValue = Static<typeof DataValueSchema> & BaseObject;
export const DataValueSchema = Type.Object({
    fieldName: Type.String(),
    dataType: Type.Enum(DataType),
    value: Type.Union([TextContentSchema, NumberContentSchema, BoolContentSchema])
});

export type ArrayContent = Static<typeof AuthenticationDataSchema> & BaseObject;
export const ArrayContentSchema = Type.Object({
    entries: Type.Array(DataValueSchema)
});

export type ObjectContent = Static<typeof AuthenticationDataSchema> & BaseObject;
export const ObjectContentSchema = Type.Object({
    object: DataValueSchema
});

export type AuthenticationData = Static<typeof AuthenticationDataSchema> & BaseObject;
export const AuthenticationDataSchema = Type.Object({
    type: Type.String(),
    connectionUid: Type.String(),
    toolCallId: Type.String(),
    requestUid: Type.String(),
    requestSecret: Type.String(),
    values: Type.Array(DataValueSchema),
});

export type FunctionCall = Static<typeof FunctionCallSchema> & BaseObject;
export const FunctionCallSchema = Type.Object({
    name: Type.String(),
    arguments: Type.String(),
});

export type ToolCall = Static<typeof ToolCallSchema> & BaseObject;
export const ToolCallSchema = Type.Object({
    id: Type.String(),
    type: Type.String(),
    details: FunctionCallSchema,
});

export type RunToolsRequest = Static<typeof RunToolsRequestSchema> & BaseObject;
export const RunToolsRequestSchema = Type.Object({
    context: ContextSchema,
    authentication: AuthenticationSchema,
    metadata: Type.Array(KeyValuePairSchema),
    toolCalls: Type.Array(ToolCallSchema),
});

export enum ExecResulType {
    ExecOutput = 'exec_output',
    Error = 'error',
    AuthRequest = 'auth_request'
}

export type ExecOutput = Static<typeof ExecOutputSchema> & BaseObject;
export const ExecOutputSchema = Type.Object({
    contentType: Type.String(),
    content: Type.String(),
});

export type ExecError = Static<typeof ExecErrorSchema> & BaseObject;
export const ExecErrorSchema = Type.Object({
    code: Type.String(),
    message: Type.String(),
    details: Type.String()
});

export type AuthSchemaField = Static<typeof AuthSchemaFieldSchema> & BaseObject;
export const AuthSchemaFieldSchema = Type.Object({
    name: Type.String(),
    description: Type.String(),
    dataType: Type.Enum(DataType),
    fields: Type.Optional(Type.Any()),
});

export type AuthSchema = Static<typeof AuthSchemaSchema> & BaseObject;
export const AuthSchemaSchema = Type.Object({
    fields: Type.Array(AuthSchemaFieldSchema),
});

export enum AuthenticationType {
    OAuth = 'oauth',
    Basic = 'basic',
    KeyPair = 'keypair',
    Key = 'key',
    ApiKey = 'apikey',
    JWT = 'jwt',
    Unknown = 'unknown'
}
export type AuthRequest = Static<typeof AuthRequestSchema> & BaseObject;
export const AuthRequestSchema = Type.Object({
    connectionUid: Type.String(),
    requestUid: Type.String(),
    requestSecret: Type.String(),
    type: Type.Enum(AuthenticationType),
    settings: Type.Optional(Type.Array(KeyValuePairSchema)),
    schema: Type.Optional(AuthSchemaSchema),
});

export type AuthRequests = Static<typeof AuthRequestsSchema> & BaseObject;
export const AuthRequestsSchema = Type.Object({
    requests: Type.Array(AuthRequestSchema),
});


export type ExecResult = Static<typeof ExecResultSchema> & BaseObject;
export const ExecResultSchema = Type.Object({
    type: Type.Enum(ExecResulType),
    toolCallId: Type.String(),
    toolUid: Type.Optional(Type.String()),
    data: Type.Union([ExecOutputSchema, ExecErrorSchema, AuthRequestsSchema]),
});

export type RunToolsResponse = Static<typeof RunToolsResponseSchema> & BaseObject;
export const RunToolsResponseSchema = Type.Object({
    results: Type.Array(ExecResultSchema),
});

export type SdkError = Static<typeof SdkErrorSchema> & BaseObject & Error;
export const SdkErrorSchema = Type.Object({
    code: Type.String(),
    message: Type.String(),
    details: Type.String(),
});


export enum SdkEventType {
    AUTHENTICATION_REQUEST = 'authentication_request',
}

export enum AuthenticationStatus {
    Requested = 'requested',
    Authenticated = 'authenticated',
    Expired = 'expired',
    Error = 'error',
}

export type SdkAuthenticationEventInfoCallback = Static<typeof SdkAuthenticationEventInfoCallbackSchema> & BaseObject;
export const SdkAuthenticationEventInfoCallbackSchema = Type.Function( [Type.Object({
    abortSignal: Type.Optional(Type.Boolean()),
    result: Type.Optional(Type.Enum(AuthenticationStatus)),
    data: Type.Optional(Type.Union([SdkErrorSchema])),
})], Type.Void() );


export type SdkAuthenticationEventInfo = Static<typeof SdkAuthenticationEventInfoSchema> & BaseObject;
export const SdkAuthenticationEventInfoSchema = Type.Object({
    toolCallId: Type.String(),
    toolUid: Type.String(),
    authRequest: AuthRequestSchema,
    callback: SdkAuthenticationEventInfoCallbackSchema
});

export type SdkEvent = Static<typeof SdkEventSchema> & BaseObject;
export const SdkEventSchema = Type.Object({
    eventType: Type.Enum(SdkEventType),
    sdk: Type.Any(),
    eventInfo: Type.Union([SdkAuthenticationEventInfoSchema]),
});

export type SdkEventHandler = (event: SdkEvent) => void;


export type GetAuthStatusRequest = Static<typeof GetAuthStatusRequestSchema> & BaseObject;
export const GetAuthStatusRequestSchema = Type.Object({
    connectionUid: Type.String(),
    requestUid: Type.String(),
    requestSecret: Type.String(),
});

export type AuthStatusSuccess = Static<typeof AuthStatusSuccessSchema> & BaseObject;
export const AuthStatusSuccessSchema = Type.Object({
    type: Type.Enum(AuthenticationType),
    authenticatedAt: Type.Number(),
});

export type AuthStatusError = Static<typeof AuthStatusErrorSchema> & BaseObject;
export const AuthStatusErrorSchema = Type.Object({
    code: Type.String(),
    message: Type.String(),
    stackTrace: Type.String(),
});

export type GetAuthStatusResponse = Static<typeof GetAuthStatusResponseSchema> & BaseObject;
export const GetAuthStatusResponseSchema = Type.Object({
    result: Type.Enum(AuthenticationStatus),
    info: Type.Optional(Type.Union([AuthStatusErrorSchema, AuthStatusSuccessSchema])),
});
