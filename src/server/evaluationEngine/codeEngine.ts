import { PromptInputs } from '@/types'
import { ExtractVariables, ToCamelCase } from '@/src/common/formatting'
import Isolated from 'isolated-vm'

const codeToCamelCase = (code: string) =>
  ExtractVariables(code).reduce(
    (code, variable) =>
      code
        .replaceAll(`"{{${variable}}}"`, ToCamelCase(variable))
        .replaceAll(`'{{${variable}}}'`, ToCamelCase(variable))
        .replaceAll(`{{${variable}}}`, ToCamelCase(variable)),
    code
  )

const stringify = (result: any) => (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))

const AugmentCodeContext = (context: Isolated.Context, variable: string | undefined, value: any) =>
  variable ? context.global.setSync(ToCamelCase(variable), value, { copy: true }) : undefined

export const CreateCodeContextWithInputs = (inputs: PromptInputs) => {
  const isolated = new Isolated.Isolate({ memoryLimit: 8 })
  const context = isolated.createContextSync()
  Object.entries(inputs).forEach(([variable, value]) => AugmentCodeContext(context, variable, value))
  return context
}

const codeResponseAttributes = { cost: 0, attempts: 1, functionInterrupt: undefined }
type CodeResponse = typeof codeResponseAttributes &
  (
    | { result: any; output: string; error: undefined; failed: false }
    | { result: undefined; output: undefined; error: string; failed: true }
  )

export const runCodeInContext = async (code: string, context: Isolated.Context): Promise<CodeResponse> => {
  try {
    const functionCode = `(() => { ${codeToCamelCase(code)} })()`
    const result = await context.eval(functionCode, { timeout: 1000, copy: true })
    const output = stringify(result)
    return { result, output, error: undefined, failed: false, ...codeResponseAttributes }
  } catch (error: any) {
    return { result: undefined, output: undefined, error: error.message, failed: true, ...codeResponseAttributes }
  }
}