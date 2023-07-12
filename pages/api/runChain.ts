import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import {
  PromptInputs,
  User,
  Run,
  RunConfig,
  PromptConfig,
  ModelProvider,
  OpenAILanguageModel,
  GoogleLanguageModel,
  AnthropicLanguageModel,
  Version,
} from '@/types'
import openai from '@/src/server/openai'
import anthropic from '@/src/server/anthropic'
import vertexai from '@/src/server/vertexai'
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'
import { RunSeparator } from '@/src/common/runSeparator'
import { getVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'

const hashValue = (object: any, seed = 0) => {
  const str = JSON.stringify(object)
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

type PredictionResponse = { output: string | undefined; cost: number }
type RunResponse = PredictionResponse & { attempts: number; cacheHit: boolean }

const promptToCamelCase = (prompt: string) =>
  ExtractPromptVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    prompt
  )

export const runPromptConfigs = async (
  userID: number,
  configs: RunConfig[],
  inputs: PromptInputs,
  useCamelCase: boolean,
  callback: (version: Version, response: RunResponse & { output: string }) => Promise<any>,
  streamChunks?: (chunk: string) => void
) => {
  for (const runConfig of configs) {
    const version = await getVersion(runConfig.versionID)
    const prompt = useCamelCase ? promptToCamelCase(version.prompt) : version.prompt
    const runResponse = await runPromptWithConfig(userID, prompt, version.config, inputs, false, streamChunks)
    const output = runResponse.output
    if (!output?.length) {
      break
    }
    if (runConfig.output) {
      const variable = useCamelCase ? ToCamelCase(runConfig.output) : runConfig.output
      inputs[variable] = output
    }
    await callback(version, { ...runResponse, output })
    streamChunks?.(RunSeparator)
  }
}

const runPromptWithConfig = async (
  userID: number,
  prompt: string,
  config: PromptConfig,
  inputs: PromptInputs,
  useCache: boolean,
  streamChunks?: (chunk: string) => void
): Promise<RunResponse> => {
  const resolvedPrompt = Object.entries(inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    prompt
  )

  const cacheKey = hashValue({
    provider: config.provider,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    prompt: resolvedPrompt,
  })

  const cachedValue = useCache ? await getCachedValue(cacheKey) : undefined
  if (cachedValue) {
    return { output: cachedValue, cost: 0, attempts: 1, cacheHit: true }
  }

  const getAPIKey = async (provider: ModelProvider) => {
    switch (provider) {
      default:
      case 'google':
        return null
      case 'openai':
      case 'anthropic':
        return getProviderKey(userID, provider)
    }
  }

  const getPredictor = (provider: ModelProvider, apiKey: string) => {
    switch (provider) {
      default:
      case 'google':
        return vertexai(config.model as GoogleLanguageModel)
      case 'openai':
        return openai(apiKey, userID, config.model as OpenAILanguageModel)
      case 'anthropic':
        return anthropic(apiKey, config.model as AnthropicLanguageModel)
    }
  }

  const apiKey = await getAPIKey(config.provider)
  const predictor = getPredictor(config.provider, apiKey ?? '')

  let result: PredictionResponse = { output: undefined, cost: 0 }
  let attempts = 0
  const maxAttempts = 3
  while (++attempts <= maxAttempts) {
    result = await predictor(resolvedPrompt, config.temperature, config.maxTokens, streamChunks)
    if (result.output?.length) {
      break
    }
  }

  if (useCache && result.output?.length) {
    await cacheValue(cacheKey, result.output)
  }

  if (result.cost > 0) {
    await incrementProviderCostForUser(userID, config.provider, result.cost)
  }

  return { ...result, attempts, cacheHit: false }
}

async function runChain(req: NextApiRequest, res: NextApiResponse<Run[]>, user: User) {
  const configs: RunConfig[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  const runs: Run[] = []
  for (const inputs of multipleInputs) {
    await runPromptConfigs(
      user.id,
      configs,
      inputs,
      false,
      async (version, { output, cost }) =>
        runs.push(await saveRun(user.id, version.promptID, version.id, inputs, output, cost)),
      chunk => res.write(chunk)
    )
  }

  res.end()
}

export default withLoggedInUserRoute(runChain)
