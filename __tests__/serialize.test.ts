import { DefaultPromptConfig, DefaultPrompts } from '@/src/common/defaultConfig'
import { deserializePromptVersion, serializePromptVersion } from '@/src/server/serialize'
import { PromptConfig, Prompts } from '@/types'

const testSerialize = (testDescription: string, promptVersion: { prompts: Prompts; config: PromptConfig }) =>
  test(testDescription, async () =>
    expect(deserializePromptVersion(serializePromptVersion(promptVersion))).toStrictEqual(promptVersion)
  )

testSerialize('Default prompt', { prompts: DefaultPrompts, config: DefaultPromptConfig })
testSerialize('Prompt with variables', {
  prompts: { main: 'Please tell me a {{contentType}} in {{wordCount}} words' },
  config: DefaultPromptConfig,
})
testSerialize('Prompt with whitespace', {
  prompts: { main: '  \n Please tell me a joke. \n\nUse no\tmore than 10 words \n\n' },
  config: DefaultPromptConfig,
})
testSerialize('System prompt', {
  prompts: {
    ...DefaultPrompts,
    system: `It's very important that you always respond with valid JSON!`,
  },
  config: DefaultPromptConfig,
})
testSerialize('Functions prompt', {
  prompts: {
    ...DefaultPrompts,
    functions: `[{
  "name": "get_current_weather",
  "description": "Get the current weather in a given location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA or London, UK"
      },
      "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
    },
    "required": ["location"]
  }
}]`,
  },
  config: DefaultPromptConfig,
})
testSerialize('Custom config', {
  prompts: DefaultPrompts,
  config: { model: 'gpt-4-turbo', isChat: true, temperature: 0.9, maxTokens: 42, seed: 23, jsonMode: true },
})
