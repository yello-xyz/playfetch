import { PromptInputs } from '@/types'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import Isolated from 'isolated-vm'

const codeToCamelCase = (code: string) =>
  ExtractPromptVariables(code).reduce(
    (code, variable) => code.replaceAll(`{{${variable}}}`, ToCamelCase(variable)),
    code
  )

const stringify = (result: any) => (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))

const tryParse = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const AugmentCodeContext = (
  context: Isolated.Context,
  variable: string | undefined,
  value: any,
  stringified = false
) =>
  variable
    ? context.global.setSync(ToCamelCase(variable), stringified ? tryParse(value) : value, { copy: true })
    : undefined

export const CreateCodeContextWithInputs = (inputs: PromptInputs) => {
  const isolated = new Isolated.Isolate({ memoryLimit: 8 })
  const context = isolated.createContextSync()
  Object.entries(inputs).forEach(([variable, value]) => AugmentCodeContext(context, variable, value))
  return context
}

type CodeResponseError = { result: undefined; output: undefined; error: any }
type CodeResponse = { result: any; output: string; error: undefined } | CodeResponseError

export const IsCodeResponseError = (response: CodeResponse): response is CodeResponseError => !!response.error

export const EvaluateCode = async (code: string, context: Isolated.Context): Promise<CodeResponse> => {
  try {
    const result = await context.eval(codeToCamelCase(code), { timeout: 1000, copy: true })
    const output = stringify(result)
    return { result, output, error: undefined }
  } catch (error: any) {
    return { result: undefined, output: undefined, error }
  }
}
