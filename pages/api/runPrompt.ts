import { saveRun } from '@/server/datastore'
import openai from '@/server/openai'
import anthropic from '@/server/anthropic'
import vertexai from '@/server/vertexai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { RunConfig } from '@/types'

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

async function runPrompt(req: NextApiRequest, res: NextApiResponse) {
  const config: RunConfig = req.body.config
  const resolvedPrompt = Object.entries(config.inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    req.body.prompt
  )
  
  const { output, cost } = await getPredictor(config.provider)(resolvedPrompt, config.temperature, config.maxTokens)
  if (output?.length) {
    await saveRun(req.session.user!.id, req.body.promptID, req.body.versionID, output, config, cost)
  }
  res.json({})
}

export default withLoggedInSessionRoute(runPrompt)
