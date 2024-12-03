export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
export type ProviderTypes = 'openai' | 'anthropic' | 'openai_assistants' | 'vercel'

export interface SdkConfig {
    baseUrl?: string;
    timeoutMs?: number;
    apiKey?: string;
    provider?: ProviderTypes
}

export enum ContentType {
    Json = 'json',
    Xml = 'xml',
    Pdf = 'pdf',
    Image = 'image',
    File = 'file',
    Binary = 'binary',
    FormUrlEncoded = 'form',
    Text = 'text',
    MultipartFormData = 'multipartFormData',
}
