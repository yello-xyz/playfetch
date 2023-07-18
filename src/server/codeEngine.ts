import { PromptInputs } from '@/types'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import Isolated from 'isolated-vm'

const codeToCamelCase = (code: string) =>
  ExtractPromptVariables(code).reduce(
    (code, variable) => code.replaceAll(`{{${variable}}}`, ToCamelCase(variable)),
    code
  )

const runCode = async (code: string, inputs: PromptInputs, streamChunks?: (chunk: string) => void) => {
  const isolated = new Isolated.Isolate({ memoryLimit: 8 })
  const context = isolated.createContextSync()
  try {
    Object.entries(inputs).forEach(([variable, value]) => context.global.setSync(ToCamelCase(variable), value))
    const result = await context.eval(codeToCamelCase(code), { timeout: 1000 })
    return result.toString()
  } catch (error: any) {
    streamChunks?.(error.message)
    console.error(error.message)
    return undefined
  }
}

export default runCode
