import { saveRun } from '@/server/datastore'
import openai from '@/server/openai'
import anthropic from '@/server/anthropic'
import vertexai from '@/server/vertexai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { RunConfig } from '@/types'

export const runPromptWithConfig = (prompt: string, config: RunConfig) => {
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

  return getPredictor(config.provider)(resolvedPrompt, config.temperature, config.maxTokens)
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
