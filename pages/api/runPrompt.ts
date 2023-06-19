import { saveRun } from '@/server/datastore/datastore'
import openai from '@/server/openai'
import anthropic from '@/server/anthropic'
import vertexai from '@/server/vertexai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { RunConfig } from '@/types'
import { cacheValue, getCachedValue } from '@/server/datastore/cache'

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

export const runPromptWithConfig = async (prompt: string, config: RunConfig) => {
  const resolvedPrompt = Object.entries(config.inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    prompt
  )

  const getPredictor = (provider: string) => {
    switch (provider) {
      default:
      case 'openai':
        return openai
      case 'anthropic':
        return anthropic
      case 'google':
        return vertexai
    }
  }

  const cacheKey = hashValue({
    provider: config.provider,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    prompt: resolvedPrompt,
  })

  const cachedValue = config.useCache ? await getCachedValue(cacheKey) : undefined
  if (cachedValue) {
    return { output: cachedValue, cost: 0 }
  }

  const result = await getPredictor(config.provider)(resolvedPrompt, config.temperature, config.maxTokens)
  if (config.useCache && result.output?.length) {
    await cacheValue(cacheKey, result.output)
  }

  return result
}

async function runPrompt(req: NextApiRequest, res: NextApiResponse) {
  const config: RunConfig = req.body.config
  const { output, cost } = await runPromptWithConfig(req.body.prompt, config)
  if (output?.length) {
    await saveRun(req.session.user!.id, req.body.promptID, req.body.versionID, output, config, cost)
  }
  res.json({})
}

export default withLoggedInSessionRoute(runPrompt)
