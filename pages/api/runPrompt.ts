import { saveRun } from '@/server/datastore'
import openai from '@/server/openai'
import anthropic from '@/server/anthropic'
import vertexai from '@/server/vertexai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

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
  const provider = req.body.provider
  const output = await getPredictor(provider)(req.body.prompt, req.body.temperature, req.body.maxTokens)
  if (output?.length) {
    await saveRun(req.session.user!.id, req.body.promptID, req.body.versionID, output, provider, 0)
  }
  res.json({})
}

export default withLoggedInSessionRoute(runPrompt)
