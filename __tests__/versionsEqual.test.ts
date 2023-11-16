import { DefaultPromptConfig } from '@/src/common/defaultConfig'
import { ChainVersionsAreEqual, PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import { LanguageModel, PromptConfig, Prompts } from '@/types'

const testChainVersionsEqual = (testDescription: string, items: any[], compareItems: any[], expected = true) =>
  test(testDescription, async () => {
    expect(ChainVersionsAreEqual({ items }, { items: compareItems })).toBe(expected)
  })

testChainVersionsEqual('No items equal', [], [])
testChainVersionsEqual('Empty items equal', [{}], [{}])
testChainVersionsEqual('Same amount of empty items equal', [{}, {}], [{}, {}])
testChainVersionsEqual('Different amount of empty items not equal', [{}], [{}, {}], false)
testChainVersionsEqual(
  'Same attributes same order equal',
  [{ code: 'hello', branches: ['world'] }],
  [{ code: 'hello', branches: ['world'] }]
)
testChainVersionsEqual(
  'Same attributes different order equal',
  [{ code: 'hello', branches: ['world'] }],
  [{ branches: ['world'], code: 'hello' }]
)
testChainVersionsEqual(
  'Different attributes not equal',
  [{ code: 'hello', branches: ['world'] }],
  [{ code: 'hello', branches: ['hello'] }],
  false
)
testChainVersionsEqual('Undefined attributes equal', [{ code: 'hello', branches: undefined }], [{ code: 'hello' }])
testChainVersionsEqual(
  'Null attributes not equal',
  [{ code: null, branches: ['hello'] }],
  [{ branches: ['hello'] }],
  false
)

type Version = { prompts: Prompts; config: PromptConfig }

const promptVersion = (main: string, model?: LanguageModel, system?: string, functions?: string): Version => ({
  prompts: { main, system, functions },
  config: { ...DefaultPromptConfig, model: model ?? DefaultPromptConfig.model },
})

const testPromptVersionsEqual = (testDescription: string, version: Version, compareVersion: Version, expected = true) =>
  test(testDescription, async () => {
    expect(PromptVersionsAreEqual(version, compareVersion)).toBe(expected)
  })

testPromptVersionsEqual('Empty prompts equal', promptVersion(''), promptVersion(''))
testPromptVersionsEqual('Same main prompt equal', promptVersion('hello'), promptVersion('hello'))
testPromptVersionsEqual('Different main prompt not equal', promptVersion('hello'), promptVersion('world'), false)
testPromptVersionsEqual('Same model equal', promptVersion('hello', 'text-bison'), promptVersion('hello', 'text-bison'))
testPromptVersionsEqual(
  'Different model not equal',
  promptVersion('hello', 'text-bison'),
  promptVersion('hello', 'chat-bison'),
  false
)
testPromptVersionsEqual(
  'Same system prompt equal',
  promptVersion('hello', 'chat-bison', 'world'),
  promptVersion('hello', 'chat-bison', 'world')
)
testPromptVersionsEqual(
  'Different system prompt not equal',
  promptVersion('hello', 'chat-bison', 'world'),
  promptVersion('hello', 'chat-bison', 'hello'),
  false
)
testPromptVersionsEqual(
  'Unsupported system prompt equal',
  promptVersion('hello', 'text-bison', 'world'),
  promptVersion('hello', 'text-bison', 'hello')
)
testPromptVersionsEqual(
  'Same functions equal',
  promptVersion('hello', 'gpt-4', 'world', 'how are you'),
  promptVersion('hello', 'gpt-4', 'world', 'how are you')
)
testPromptVersionsEqual(
  'Different functions not equal',
  promptVersion('hello', 'gpt-4', 'world', 'how are you'),
  promptVersion('hello', 'gpt-4', 'world', 'doing fine'),
  false
)
testPromptVersionsEqual(
  'Unsupported functions equal',
  promptVersion('hello', 'chat-bison', 'world', 'how are you'),
  promptVersion('hello', 'chat-bison', 'world', 'doing fine')
)
