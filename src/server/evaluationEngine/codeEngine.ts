import { PromptInputs } from '@/types'
import { ExtractVariables, ToCamelCase } from '@/src/common/formatting'
import Isolated from 'isolated-vm'
import { EmptyRunResponse, ErrorRunResponse, RunResponse } from './runResponse'

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
  console.log(inputs)
  const isolated = new Isolated.Isolate({ memoryLimit: 8 })
  const context = isolated.createContextSync()
  context.eval(`globalThis.PlayFetch = { 
  InterruptOnce: (name, args = {}) => this[name] ?? { function: { name, arguments: args } } 
}`)
  Object.entries(inputs).forEach(([variable, value]) => AugmentCodeContext(context, variable, value))
  return context
}

export const runCodeInContext = async (code: string, context: Isolated.Context): Promise<RunResponse> => {
  try {
    const functionCode = `(() => { ${codeToCamelCase(code)} })()`
    const result = await context.eval(functionCode, { timeout: 1000, copy: true })
    const output = stringify(result)
    return { ...EmptyRunResponse(), result, output, functionCall: result?.function?.name ?? null }
  } catch (error: any) {
    return ErrorRunResponse(error.message)
  }
}
