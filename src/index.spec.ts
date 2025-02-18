import {describe, expect, test} from '@jest/globals';
import {Gentoro} from "./index";
import {ExecResult, ExecResultSchema, Providers, SdkConfig} from "./types/types";
import {Value} from "@sinclair/typebox/value";

const GENTORO_API_KEY = '52ac27a9a8b3fcd766a22bb765ede09c95fc4c3b8b9e6899e630c6dde69df255';
const VALID_SDK_CONFIG:SdkConfig = {
    apiKey: GENTORO_API_KEY,
    baseUrl: 'http://localhost:8082',
    provider: Providers.Gentoro,
    authModBaseUrl: 'http://localhost:3000',
};

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
        const gentoro = new Gentoro(VALID_SDK_CONFIG);
        gentoro.getTools("YWgJ0EnCKN2WanbrBZRcG")
            .then((tools) => {
                expect(tools).not.toBeNull();
                expect(tools.length).toBeGreaterThan(0);
                done();
            }).catch((error) => {
                done(error);
            })
    });

    test('Run tools', (done) => {
        const gentoro = new Gentoro(VALID_SDK_CONFIG);
        gentoro.runTools("1AOdh4JxSSbOZRfX9wO3cF", [],  [
                {
                    id: 'call_upLJnDnbMAlCjXKoqVVdSTmy',
                    type: 'tool_call',
                    details: {
                        name: 'slack_send_message_to_channel',
                        arguments: '{"channel_name":"oncall-devops","message_text":"**Incident Summary: Application Crashing on Login**\\n\\n**Description:** After a recent deployment, users reported that the application crashes upon entering valid login credentials. The issue was traced to a null pointer exception introduced in the new authentication logic.\\n\\n**Impact:** Users are unable to log in, resulting in service downtime for 100% of active users.\\n\\n**Resolution Steps:** Rolled back to the previous version of the login module and scheduled a hotfix deployment after thorough testing. We will keep you updated on the progress."}'
                    }
                },
                {
                    id: 'call_B3AsH8iaQOIlr14tqjOJ2Sa5',
                    type: 'tool_call',
                    details: {
                        name: 'slack_send_message_to_channel',
                        arguments: '{"channel_name":"oncall-dev","message_text":"**Incident Summary: Application Crashing on Login**\\n\\n**Description:** After a recent deployment, users reported that the application crashes upon entering valid login credentials. The issue was traced to a null pointer exception introduced in the new authentication logic.\\n\\n**Impact:** Users are unable to log in, resulting in service downtime for 100% of active users.\\n\\n**Resolution Steps:** Rolled back to the previous version of the login module and scheduled a hotfix deployment after thorough testing. We will keep you updated on the progress."}'
                    }
                },
                {
                    id: 'call_sZmRecBSdzVoOEFi9PcO4BlF',
                    type: 'tool_call',
                    details: {
                        name: 'slack_send_message_to_channel',
                        arguments: '{"channel_name":"oncall-support","message_text":"**Incident Summary: Application Crashing on Login**\\n\\n**Description:** After a recent deployment, users reported that the application crashes upon entering valid login credentials. The issue was traced to a null pointer exception introduced in the new authentication logic.\\n\\n**Impact:** Users are unable to log in, resulting in service downtime for 100% of active users.\\n\\n**Resolution Steps:** Rolled back to the previous version of the login module and scheduled a hotfix deployment after thorough testing. We will keep you updated on the progress."}'
                    }
                }
            ]
        ).then((execResults) => {
            expect(execResults).not.toBeNull();
            expect(execResults.length).toBeGreaterThan(0);
            expect(Value.Check(ExecResultSchema, execResults[0])).toBeTruthy()
            const _result:ExecResult = Value.Parse(ExecResultSchema, execResults[0]);
            expect(_result.toolCallId).toBe('1');
            done();
        }).catch((error) => {
            done(error);
        })
    });
});
