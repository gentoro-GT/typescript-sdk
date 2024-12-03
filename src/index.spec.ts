import {describe, expect, test} from '@jest/globals';
import {Gentoro} from "./index";
import {SdkConfig} from "./types/types";

describe('Initialize SDK', () => {
    test('Standard constructor', () => {
        const config:SdkConfig = {
            apiKey: 'test',
        };
        const gentoro = new Gentoro(config);
        expect(gentoro).not.toBeNull();
    });

    test('Empty constructor, without environment variables', () => {
        const config:SdkConfig = {
        };
        try {
            new Gentoro(config);
            fail('It should not have come here!')
        } catch (e : unknown) {
            if (e instanceof Error) {
                expect(e.message).toContain('api_key');
            } else {
                fail('Should be a validation error');
            }
        }
    });

    test('Empty constructor, with environment variables', () => {
        // mock dotenv entries
        process.env = {'GENTORO_API_KEY': 'test'};

        // attempt to create the SDK without passing the api key
        const config:SdkConfig = {};
        const gentoro = new Gentoro(config);
        expect(gentoro).not.toBeNull();
    });


});
