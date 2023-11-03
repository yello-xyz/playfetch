import { CreateCodeContextWithInputs, runCodeInContext } from '@/src/server/evaluationEngine/codeEngine'

const testRunCode = (testDescription: string, code: string, inputs: Record<string, string>, output: string) =>
  test(testDescription, async () => {
    const context = CreateCodeContextWithInputs(inputs)
    const result = await runCodeInContext(code, context)
    expect(result.output).toBe(output)
  })

testRunCode('Empty code yields undefined', '', {}, 'undefined')
testRunCode('Can return string', 'return "hello world"', {}, 'hello world')
testRunCode('Can expand variable', 'return {{x}}', { x: 'hello world' }, 'hello world')
testRunCode('Redundant quotes around variable are stripped', 'return "{{x}}"', { x: 'hello world' }, 'hello world')
testRunCode('Can escape variable expansion', 'return "{\\{x}}"', { x: 'hello world' }, '{{x}}')
testRunCode('Can add quotes around expanded variable', 'return `"${{{x}}}"`', { x: 'hello world' }, '"hello world"')
