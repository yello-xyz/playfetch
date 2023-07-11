import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, Run, RunConfig, PromptConfig, ModelProvider, OpenAILanguageModel } from '@/types'
import openai from '@/src/server/openai'
import anthropic from '@/src/server/anthropic'
import vertexai from '@/src/server/vertexai'
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'

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

export const runPromptWithConfig = async (
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
        return vertexai
      case 'openai':
        return openai(apiKey, userID, config.model as OpenAILanguageModel)
      case 'anthropic':
        return anthropic(apiKey)
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
    for (const runConfig of configs) {
      const streamChunks = (chunk: string) => res.write(`${runs.length}:${chunk}`)
      const { output, cost } = await runPromptWithConfig(
        user.id,
        runConfig.prompt,
        runConfig.config,
        inputs,
        false,
        streamChunks
      )
      if (!output?.length) {
        break
      }
      runs.push(await saveRun(user.id, runConfig.promptID, runConfig.versionID, inputs, output, cost))
      if (runConfig.output) {
        inputs[runConfig.output] = output
      }
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  res.end()
}

export default withLoggedInUserRoute(runChain)
