import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import {
  PromptInputs,
  User,
  RunConfig,
  PromptConfig,
  ModelProvider,
  OpenAILanguageModel,
  GoogleLanguageModel,
  AnthropicLanguageModel,
  Version,
  CodeConfig,
} from '@/types'
import openai from '@/src/server/openai'
import anthropic from '@/src/server/anthropic'
import vertexai from '@/src/server/vertexai'
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'
import { getVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'

type PredictionResponse = { output: string | undefined; cost: number }
type RunResponse = PredictionResponse & { attempts: number; cacheHit: boolean }

const promptToCamelCase = (prompt: string) =>
  ExtractPromptVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    prompt
  )

const resolvePrompt = (prompt: string, inputs: PromptInputs, useCamelCase: boolean) =>
  Object.entries(inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    useCamelCase ? promptToCamelCase(prompt) : prompt
  )

const postProcess = (inputs: PromptInputs, output: string, config: RunConfig | CodeConfig, useCamelCase: boolean) => {
  if (config.output) {
    const variable = useCamelCase ? ToCamelCase(config.output) : config.output
    inputs[variable] = output
  }
  return output
}

export const runChainConfigs = async (
  userID: number,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  useCache: boolean,
  useCamelCase: boolean,
  callback: (version: Version | null, response: RunResponse & { output: string }) => Promise<any>,
  streamChunks?: (chunk: string) => void
) => {
  let lastOutput = undefined as string | undefined
  let runningContext = ''

  const isRunConfig = (config: RunConfig | CodeConfig): config is RunConfig => 'versionID' in config

  for (const config of configs) {
    if (isRunConfig(config)) {
      const version = await getVersion(config.versionID)
      let prompt = resolvePrompt(version.prompt, inputs, useCamelCase)
      runningContext += prompt
      if (config.includeContext) {
        prompt = runningContext
      }
      const runResponse = await runPromptWithConfig(userID, prompt, version.config, useCache, streamChunks)
      const output = runResponse.output
      if (!output?.length) {
        break
      }
      lastOutput = postProcess(inputs, output, config, useCamelCase)
      runningContext += `\n\n${output}\n\n`
      await callback(version, { ...runResponse, output })
    } else { 
      const code = resolvePrompt(config.code, inputs, useCamelCase)
      const output = code.replace(code, 'output') // TODO run code
      if (!output?.length) {
        break
      }
      streamChunks?.(output)
      lastOutput = postProcess(inputs, output, config, useCamelCase)
      await callback(null, { output, cost: 0, attempts: 1, cacheHit: false })
    }
  }

  return lastOutput
}

const runPromptWithConfig = async (
  userID: number,
  prompt: string,
  config: PromptConfig,
  useCache: boolean,
  streamChunks?: (chunk: string) => void
): Promise<RunResponse> => {
  const cacheKey = {
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    prompt,
  }

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
    result = await predictor(prompt, config.temperature, config.maxTokens, streamChunks)
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

async function runChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const configs: (RunConfig | CodeConfig)[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  let index = 0
  for (const inputs of multipleInputs) {
    await runChainConfigs(
      user.id,
      configs,
      inputs,
      false,
      false,
      (version, { output, cost }) => {
        const createdAt = new Date()
        sendData({ index: index++, timestamp: createdAt.toISOString(), cost })
        return version
          ? saveRun(user.id, version.promptID, version.id, inputs, output, createdAt, cost)
          : Promise.resolve({})
      },
      message => sendData({ index, message })
    )
  }

  res.end()
}

export default withLoggedInUserRoute(runChain)
