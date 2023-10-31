import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import { ChainItemWithInputs, PromptConfig, Prompts } from '@/types'
import { DefaultConfig } from '@/src/common/defaultConfig'
import { ExtractUnboundChainInputs } from '@/components/chains/chainNodeOutput'

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

const configWithFunctionsSupport: PromptConfig = { ...DefaultConfig, model: 'gpt-4' }

const buildPrompt = (main: string, system?: string, functions?: string): Prompts => ({ main, system, functions })

const testExtractPromptVariables = (
  testDescription: string,
  expectedVariables: string[],
  prompts: Prompts,
  includingDynamic = true
) =>
  test(`Test ${testDescription}`, () => {
    expect(ExtractPromptVariables(prompts, configWithFunctionsSupport, includingDynamic)).toStrictEqual(
      expectedVariables
    )
  })

testExtractPromptVariables('empty prompts', [], buildPrompt(''))
testExtractPromptVariables('main prompt', ['hello'], buildPrompt('{{hello}}'))
testExtractPromptVariables('system prompt', ['hello', 'world'], buildPrompt('{{hello}}', '{{world}}'))
testExtractPromptVariables('functions prompt', ['hello', 'world'], buildPrompt('{{hello}}', '', '{{world}}'))
testExtractPromptVariables('include dynamic', ['hello_world'], buildPrompt('', '', '[{ "name": "hello_world" }]'))
testExtractPromptVariables('exclude dynamic', [], buildPrompt('', '', '[{ "name": "hello_world" }]'), false)

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
  ['world'],
  ['', '', 'hello', '', '', 'world', 'hello', 'world'],
  ['', 'hello', '', 'world', '', '', '', ''],
  [0, 0, 0, 1, 4, 0, 1, 3],
  [0, 3, 0, 3, 0, 0, 0, 0]
)
