import {SdkConfig} from "./types/types";
import 'dotenv/config';

export class Gentoro {
    constructor(public config: SdkConfig) {
        this.config = config;

        let key = config.apiKey
        if (key == null) {
            const defaultKey = process.env.GENTORO_API_KEY;
            if (defaultKey == null)
                throw new Error('The api_key client option must be set either by passing api_key to the SDK or by setting the GENTORO_API_KEY environment variable')
            key = defaultKey
        }
    }
}
