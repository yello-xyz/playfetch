import { ExtractCodeInterrupts, ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import { ChainItemWithInputs, Prompts } from '@/types'
import { DefaultPromptConfig } from '@/src/common/defaults'
import { ExtractUnboundChainInputs } from '@/src/client/chains/chainItems'

const testExtractVariables = (testDescription: string, expectedVariables: string[], content: string) =>
  test(`Test ${testDescription}`, () => {
    expect(ExtractVariables(content)).toStrictEqual(expectedVariables)
  })

testExtractVariables('empty content', [], '')
testExtractVariables('no variables', [], 'hello world')
testExtractVariables('non variable', [], '}}hello{{')
testExtractVariables('single variable', ['hello'], '{{hello}}')
testExtractVariables('single variable start', ['hello'], '{{hello}} world')
testExtractVariables('single variable end', ['world'], 'hello {{world}}')

const testExtractCodeInterrupts = (testDescription: string, expectedVariables: string[], code: string) =>
  test(`Test ${testDescription}`, () => {
    expect(ExtractCodeInterrupts(code)).toStrictEqual(expectedVariables)
  })

testExtractCodeInterrupts('no code interrupts', [], `return 'Hello World'`)
testExtractCodeInterrupts(
  'single quoted message interrupt',
  ['message'],
  `return PlayFetch.InterruptOnce('How are you?')`
)
testExtractCodeInterrupts(
  'double quoted message interrupt',
  ['message'],
  `return PlayFetch.InterruptOnce("Who are you?")`
)
testExtractCodeInterrupts(
  'deduplicate message interrupts',
  ['message'],
  `Math.random() < 0.5 ? PlayFetch.InterruptOnce('How are you?') : PlayFetch.InterruptOnce("Who are you?")`
)
testExtractCodeInterrupts(
  'single quoted function interrupt',
  ['ask_question'],
  `return PlayFetch.InterruptOnce('ask_question', { question: 'How are you?' })`
)
testExtractCodeInterrupts(
  'double quoted function interrupt',
  ['ask_question'],
  `return PlayFetch.InterruptOnce("ask_question", { question: "Who are you?" })`
)
testExtractCodeInterrupts(
  'deduplicate function interrupts',
  ['ask_question'],
  `Math.random() < 0.5 
    ? PlayFetch.InterruptOnce('ask_question', { question: 'How are you?' })
    : PlayFetch.InterruptOnce("ask_question", { question: "Who are you?" })`
)
testExtractCodeInterrupts(
  'multiple code interrupts with variables',
  ['ask_question', 'message'],
  `return 
  Math.random() < 0.5 
    ? PlayFetch.InterruptOnce('ask_question', { question: {{question}} }) 
    : PlayFetch.InterruptOnce({{reason}})`
)
testExtractCodeInterrupts(
  'fail to detect variable function interrupt',
  [],
  `return PlayFetch.InterruptOnce({{functionName}}, {})`
)
testExtractCodeInterrupts(
  'fail to detect more dynamic code interrupts',
  [],
  `return PlayFetch.InterruptOnce(Math.random() < 0.5 ? 'How are you?' : 'Who are you?')`
)

const buildConfig = (supportsFunctions = true, simpleChat = false) => ({
  ...DefaultPromptConfig,
  model: supportsFunctions ? 'gpt-4' : 'text-bison',
  isChat: simpleChat,
})

const buildPrompt = (main: string, system?: string, functions?: string): Prompts => ({ main, system, functions })
const buildFunctionsPrompt = (functionName: string): Prompts => buildPrompt('', '', `[{"name": "${functionName}"}]`)

const testExtractPromptVariables = (
  testDescription: string,
  expectedVariables: string[],
  prompts: Prompts,
  includingDynamic = true,
  config = buildConfig()
) =>
  test(`Test ${testDescription}`, () => {
    expect(ExtractPromptVariables(prompts, config, includingDynamic)).toStrictEqual(expectedVariables)
  })

testExtractPromptVariables('empty prompts', [], buildPrompt(''))
testExtractPromptVariables('main prompt', ['hello'], buildPrompt('{{hello}}'))
testExtractPromptVariables('system prompt', ['hello', 'world'], buildPrompt('{{hello}}', '{{world}}'))
testExtractPromptVariables('functions prompt', ['hello', 'world'], buildPrompt('{{hello}}', '', '{{world}}'))
testExtractPromptVariables('include dynamic', ['hello_world'], buildFunctionsPrompt('hello_world'))
testExtractPromptVariables('exclude dynamic', [], buildFunctionsPrompt('hello_world'), false)
testExtractPromptVariables(
  'dynamic no functions support',
  [],
  buildPrompt('', '', '[{ "name": "hello_world" }]'),
  true,
  buildConfig(false)
)
testExtractPromptVariables('include simple chat', ['message'], buildPrompt(''), true, buildConfig(false, true))
testExtractPromptVariables('exclude simple chat', [], buildPrompt(''), false, buildConfig(false, true))
testExtractPromptVariables(
  'exclude simple chat if functions supported',
  ['hello_world'],
  buildFunctionsPrompt('hello_world'),
  true,
  buildConfig(true, true)
)
testExtractPromptVariables(
  'include simple chat if functions unsupported',
  ['message'],
  buildFunctionsPrompt('hello_world'),
  true,
  buildConfig(false, true)
)
testExtractPromptVariables(
  'deduplicate variables',
  ['message'],
  buildPrompt('{{message}}'),
  true,
  buildConfig(false, true)
)

const buildChain = (
  inputs: string[],
  outputs: string[],
  branchNumbers: number[] = [],
  branchCounts: number[] = []
): ChainItemWithInputs[] =>
  inputs.map((input, index) => ({
    code: '',
    inputs: input ? [input] : [],
    output: outputs[index],
    branch: branchNumbers[index] ?? 0,
    ...(branchCounts[index] ? { branches: Array.from({ length: branchCounts[index] }, (_, index) => `${index}`) } : {}),
  }))

const testExtractChainVariables = (
  testDescription: string,
  expectedVariables: string[],
  inputs: string[],
  outputs: string[] = [],
  branchNumbers: number[] = [],
  branchCounts: number[] = []
) =>
  test(`Test ${testDescription}`, () => {
    expect(ExtractUnboundChainInputs(buildChain(inputs, outputs, branchNumbers, branchCounts), false)).toStrictEqual(
      expectedVariables
    )
  })

testExtractChainVariables('empty chain', [], [], [])
testExtractChainVariables('single step single chain input', ['hello'], ['hello'])
testExtractChainVariables('multi step single chain input', ['hello'], ['', 'hello'])
testExtractChainVariables('multi step repeated chain input', ['hello'], ['hello', '', 'hello'])
testExtractChainVariables('multi step multi chain input', ['hello', 'world'], ['hello', '', 'world'])
testExtractChainVariables('mapped input', ['world'], ['', 'hello', 'world'], ['hello'])
testExtractChainVariables('mapped too late', ['hello'], ['hello', ''], ['', 'hello'])
testExtractChainVariables('mapped later too', ['hello', 'world'], ['hello', 'world', 'hello'], ['', 'hello'])

testExtractChainVariables(
  'branched chain',
  ['goodbye', 'world'],
  ['', '', 'hello', '', 'goodbye', 'world', 'hello', 'world'],
  ['', 'hello', '', 'world', 'goodbye', '', '', ''],
  [0, 0, 0, 1, 4, 0, 1, 3],
  [0, 3, 0, 3, 0, 0, 0, 0]
)
