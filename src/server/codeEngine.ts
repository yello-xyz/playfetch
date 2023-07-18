import { PromptInputs } from '@/types'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import Isolated from 'isolated-vm'

const codeToCamelCase = (code: string) =>
  ExtractPromptVariables(code).reduce(
    (code, variable) => code.replaceAll(`{{${variable}}}`, ToCamelCase(variable)),
    code
  )

export const AugmentCodeContext = (context: Isolated.Context, variable: string, value: string) =>
  context.global.setSync(ToCamelCase(variable), value)

export const CreateCodeContextWithInputs = (inputs: PromptInputs) => {
  const isolated = new Isolated.Isolate({ memoryLimit: 8 })
  const context = isolated.createContextSync()
  Object.entries(inputs).forEach(([variable, value]) => AugmentCodeContext(context, variable, value))
  return context
}

export const EvaluateCode = async (code: string, context: Isolated.Context, streamChunks?: (chunk: string) => void) => {
  try {
    const result = await context.eval(codeToCamelCase(code), { timeout: 1000 }) ?? ''
    // TODO this needs a bit more thinking, e.g. want to be able to return objects directly
    return typeof result === 'object' ? JSON.stringify(result) : result.toString() as string
  } catch (error: any) {
    streamChunks?.(error.message)
    console.error(error.message)
    return undefined
  }
}
