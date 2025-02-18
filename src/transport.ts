import {BaseObject, Request, Response, SdkConfig} from "./types/types";
import { Value } from '@sinclair/typebox/value'
import { TSchema } from '@sinclair/typebox'
import axios, {AxiosInstance, AxiosRequestConfig, RawAxiosRequestHeaders} from "axios";


export class Transport {
    private _config:SdkConfig;
    private _client:AxiosInstance;

    constructor(config:SdkConfig) {
        this._config = config;
        this._client = axios.create({
            baseURL: config.baseUrl,
        });
    }

    private getTransportConfig(): AxiosRequestConfig {
        return {
            headers: {
                'X-API-Key': this._config.apiKey,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            } as RawAxiosRequestHeaders,
        } as AxiosRequestConfig;
    }

    sendRequest<RequestType extends BaseObject, ResponseType extends BaseObject> (request: Request<RequestType>, schema: TSchema ): Promise<Response<ResponseType>>  {
        return new Promise<Response<ResponseType>>((resolve, reject) => {
            this._client.post(request.uri, request.content, this.getTransportConfig())
                .then((response) => {
                    try {
                        resolve({
                            content: Value.Parse(schema, response.data),
                        })
                    } catch (e:any) {
                        throw new Error(`Failed to parse response: ${e.message}`);
                    }
                }).catch((error) => {
                    reject(error);
                })
        });
    }


}
