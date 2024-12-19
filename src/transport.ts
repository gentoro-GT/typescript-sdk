import {BaseObject, KeyValuePair, Request, Response, SdkConfig} from "./types/types";
import {TSchema} from "@sinclair/typebox/build/cjs/type/schema/schema";
import { Value } from '@sinclair/typebox/value'
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

    private camelCaseToSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
    }

    private serializeToSnakeCase<T>(obj: T): Record<string, any> {
        const result: Record<string, any> = {};

        // Iterate over each property in the object
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const snakeKey = this.camelCaseToSnakeCase(key); // Convert the key to snake_case

                // Check if the property is an object (but not null) or an array
                const value = obj[key as keyof T];
                if (value !== null && typeof value === 'object') {
                    // If it's an object or array, recursively serialize its keys
                    result[snakeKey] = Array.isArray(value)
                        ? value.map(item => this.serializeToSnakeCase(item)) // Serialize each item in the array
                        : this.serializeToSnakeCase(value); // Recursively serialize nested object
                } else {
                    // Otherwise, directly assign the value
                    result[snakeKey] = value;
                }
            }
        }

        return result;
    }

    // Utility function to convert a string to camelCase
    private toCamelCase(str: string | undefined | null): string | null {
        if( str === null || str === undefined) {
            return null;
        } else {
            return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        }
    }

    // Function to recursively convert the keys of a JSON object to camelCase
    private convertKeysToCamelCase(obj: any): any {
        if( obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            // If the object is an array, recursively process each element
            for (let i = 0; i < obj.length; i++) {
                obj[i] = this.convertKeysToCamelCase(obj[i]);
            }
            return obj;
        } else if (typeof obj === 'object') {
            // If the object is a non-null object, recursively convert its keys
            const newObj: Record<string, any> = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if( this.convertKeysToCamelCase(obj[key]) !== null ) {
                        const newKey = this.toCamelCase(key);
                        newObj[newKey] = this.convertKeysToCamelCase(obj[key]);
                    }
                }
            }
            return newObj;
        } else {
            // If it's not an object or array, just return the value
            return obj;
        }
    }

    sendRequest<RequestType extends BaseObject, ResponseType extends BaseObject> (request: Request<RequestType>, schema: TSchema ): Promise<Response<ResponseType>>  {
        return new Promise<Response<ResponseType>>((resolve, reject) => {
            this._client.post(request.uri, this.serializeToSnakeCase(request.content), this.getTransportConfig())
                .then((response) => {
                    try {
                        resolve({
                            content: Value.Parse(schema, this.convertKeysToCamelCase(response.data)),
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
