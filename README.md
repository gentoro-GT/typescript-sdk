# Gentoro TypeScript SDK

Welcome to the [Gentoro TypeScript SDK](https://gentoro.com/docs/quickstart/quick-start-typescript) documentation. 
This guide will help you get started with integrating and using the SDK in your project.

## Setup & Configuration

### Supported Language Versions

This SDK is compatible with `TypeScript >= 5.7.2`.

### Installation

To get started with the SDK, we recommend installing it using `npm` or `yarn`:

```bash
npm install @gentoro/sdk
```

or

```bash
yarn add @gentoro/sdk
```

## Authentication

The Gentoro API uses an Access Token for authentication. This token must be provided to authenticate your requests to the API.

To obtain an API Key, register at [Gentoro](https://gentoro.com/).

### Setting the Access Token

When initializing the SDK, provide the configuration as follows:

```ts
const _config:SdkConfig = {
    apiKey: import.meta.env.VITE_GENTORO_API_KEY, // Your Gentoro API Key
    baseUrl: import.meta.env.VITE_GENTORO_BASE_URI, // Base Url where the Gentoro API is hosted
    authModBaseUrl: import.meta.env.VITE_GENTORO_AUTH_MOD_BASE_URI, // Base Url where the Gentoro Auth module UI is hosted
    provider: Providers.Openai, // The provider you want to use
};
const _gentoro:Gentoro = new Gentoro(_config);
```

## Usage

Here's a basic example demonstrating how to authenticate and retrieve available tools:

```ts
import { Gentoro } from '@gentoro/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Initialize the Open AI client
    const _openai = new OpenAI.Client({
        apiKey: process.env['OPENAI_API_KEY'],
    });
    
    // Configure and Initialize Gentoro SDK
    const _config:SdkConfig = {
        apiKey: process.env['GENTORO_API_KEY'], // Your Gentoro API Key
        baseUrl: process.env['GENTORO_BASE_URI'], // Base Url where the Gentoro API is hosted
        authModBaseUrl: process.env['GENTORO_AUTH_MOD_BASE_URI'], // Base Url where the Gentoro Auth module UI is hosted
        provider: Providers.Openai, // The provider you want to use
    };
    const _gentoro:Gentoro = new Gentoro(_config);
    
    // Gather user inference content
    const _messages: ChatCompletionMessageParam[] = [{
        role: 'user',
        content: 'How many e-mails I currently have in my Gmail mailbox?',
    }];

    // Fetch tools from Gentoro.
    // Bridge UIDs are generated and captured at Gentoro's Studio.
    const _tools = await _gentoro.getTools(process.env['GENTORO_BRIDGE_UID'], _messages) as ChatCompletionTool[];

    // Invoke OpenAI API to generate completions, providing context (messages) and available tools
    let _completion:ChatCompletion  = await _client.chat.completions.create({
        messages: _messages,
        model: process.env['OPENAI_MODEL'], //gpt-4o-mini for example
        tools: _tools,
    });

    // Check if OpenAI requested tool_calls, if yes, delegates their execution to Gentoro, and capture the output
    _messages.push(... await _gentoro.runTools(_completion) as OpenAI.Chat.Completions.ChatCompletionMessageParam[])

    // Callback OpenAI with function call generated results
    _completion:ChatCompletion  = await _client.chat.completions.create({
        messages: _messages,
        model: process.env['OPENAI_MODEL'], //gpt-4o-mini for example
        tools: _tools,
    });

    // Print the completion    
    console.log(_completion.choices[0].message.content);
    // You have a total of 10 emails in your Gmail mailbox.
}

main();
```

## Services

### Methods

#### getTools(bridgeUid: string, messages: ChatCompletionMessageParam[]): Promise<ChatCompletionTool[]>

Fetches tools from a specific bridge (Bridge UIDs are captured from Gentoro's Studio).

```ts
const _messages: ChatCompletionMessageParam[] = ...;
const _tools = await _gentoro.getTools(process.env['GENTORO_BRIDGE_UID'], _messages) as ChatCompletionMessageParam[];
```

#### runTools(bridgeUid: string, completion: ChatCompletion): Promise<ChatCompletion>

Analyzes the completion and runs the tools if any are requested.
Returns pre-configured message with the tool_call message, and response.

```ts
const _completion:ChatCompletion  = await _client.chat.completions.create(...);
const _newMessages = await _gentoro.runTools(process.env['GENTORO_BRIDGE_UID'], _completion) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
```

### Providers

A provider defines how SDK should handle and generate content.

```ts
export enum Providers {
    Openai,
    Anthropic,
    OpenaiAssistants,
    Vercel,
    Gentoro
}
```

## License

This SDK is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for more details.
