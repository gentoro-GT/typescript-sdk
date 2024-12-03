# Toolhouse TypeScript SDK

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

When initializing the SDK, set the access token as follows:

```ts
const gentoro = new Gentoro({
  apiKey: process.env['GENTORO_API_KEY']
});
```

The `apiKey` is the only mandatory parameter and represents the API key required to authenticate with the tool provider.

## Configuration Options

In addition to the `apiKey`, you can configure the following options:

- `provider`: Specifies the provider, such as 'openai', 'anthropic', or 'vercel'. Defaults to 'openai'.
- `baseUrl`: Optionally specify the base URL for API requests.
- `timeoutMs`: The timeout for API requests, in milliseconds.
- `metadata`: Additional metadata to include with requests.

Example:

```ts
const gentoro = new Gentoro({
  apiKey: process.env['GENTORO_API_KEY'],
  provider: 'anthropic',
  timeoutMs: 10000,
  metadata: { customField: 'value' }
});
```

## Usage

Here's a basic example demonstrating how to authenticate and retrieve available tools:

```ts
import { Toolhouse } from '@toolhouseai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const gentoro = new Gentoro({
        apiKey: process.env['GENTORO_API_KEY']
    });
  
    // Watch for authentication request
    // Gentoro SDK will trigger this method, for each authenticaton requested by the Server.
    // Note that is only done once per session.
    gentoro.addAuthenticationEventListiner(GentoroAuthenticationEventType.REQUEST, (authRequest: GentoroAuthRequest) => {
        // Implement your external authentication logic here
        // Call resolve method to pass authentication data to the SDK
        authRequest.resolve({...});
    });
    
    const chatCompletion = await client.chat.completions.create({
        messages,
        tools
    });

    const openAiMessage = await gentoro.runTools(chatCompletion) as OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    const newMessages = [...messages, ...openAiMessage]




    const tools = await gentoro.runTools(messages);
  console.log(tools);
}

main();
```

## Services

### Methods

#### getTools()

Fetches tools from a specific bridge (Bridge UIDs are captured from Gentoro's Studio).

```ts
const tools = await gentoro.getTools({
    bridge: process.env['BRIDGE_UID'],
});
console.log(tools);
```

#### runTools()

Executes tools based on the provider and provided content.

```ts
const tools = await gentoro.getTools({bridge: process.env['BRIDGE_UID']});
const chatCompletion = await client.chat.completions.create({
  messages,
  model: 'gpt-3.5-turbo',
  tools.asOpenAI(),
});

const openAiMessage = await gentoro.runTools(chatCompletion);
console.log(openAiMessage);
```

### Accessor Methods

#### metadata

Retrieve or set the metadata used in tool requests.

```ts
console.log(gentoro.metadata);
toolhouse.metadata = { sessionId: 'newValue' };
```

#### provider

Retrieve or set the provider for tool requests.

```ts
console.log(gentoro.provider);
toolhouse.provider = 'anthropic';
```

## Error Handling

Wrap API calls in try-catch blocks to handle potential errors:

```ts
try {
  const tools = await gentoro.getTools({...});
} catch (error) {
  console.error(error);
}
```

## License

This SDK is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for more details.
