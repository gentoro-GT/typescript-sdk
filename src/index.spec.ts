import {describe, expect, test} from '@jest/globals';
import {Gentoro} from "./index";
import {ExecResult, ExecResultSchema, Providers, SdkConfig, SdkEventType} from "./types/types";
import {Value} from "@sinclair/typebox/value";

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

        // attempt to create the SDK passing the api key, should succeed
        const config:SdkConfig = {};
        const gentoro = new Gentoro(config);
        expect(gentoro).not.toBeNull();
    });

    test('Retrieve tools', (done) => {
        // attempt to create the SDK without passing the api key
        const config:SdkConfig = {
            apiKey: 'e1dfca45887c25cfd325ac0575fefcd4ad9e49b14acab2524d66c7937e97cb7b',
            baseUrl: 'http://localhost:8082',
            provider: Providers.Openai,
        };
        const gentoro = new Gentoro(config);
        gentoro.getTools('1czQqh6mGQG4KCkLYCITNU')
            .then((tools) => {
                expect(tools).not.toBeNull();
                expect(tools.length).toBeGreaterThan(0);
                done();
            }).catch((error) => {
                done(error);
            })
    });

    test('Run tools', (done) => {
        // attempt to create the SDK without passing the api key
        const config:SdkConfig = {
            apiKey: 'e1dfca45887c25cfd325ac0575fefcd4ad9e49b14acab2524d66c7937e97cb7b',
            baseUrl: 'http://localhost:8082',
            provider: Providers.Gentoro,
        };
        const gentoro = new Gentoro(config);
        gentoro.addSdkEventListener(SdkEventType.AUTHENTICATION_REQUEST, (event) => {``
            gentoro.handleAuthenticationRequest(event.eventInfo, {
                open: (url, target  ) => {
                    console.log('Opening URL: ', url);
                },
            } as Window);
        });

        gentoro.runTools('1czQqh6mGQG4KCkLYCITNU', [], [{
            id: '1',
            type: 'function',
            details: {
                name: 'clickup_remove_tag',
                arguments: '{team_id: "123", space_name: "test", tag_name: "test"}',
            }
        }]).then((execResults) => {
            expect(execResults).not.toBeNull();
            expect(execResults.length).toBeGreaterThan(0);
            expect(Value.Check(ExecResultSchema, execResults)).toBeTruthy()
            const _result:ExecResult = Value.Parse(ExecResultSchema, execResults[0]);
            expect(_result.toolCallId).toBe('1');
            done();
        }).catch((error) => {
            done(error);
        })
    });
});
