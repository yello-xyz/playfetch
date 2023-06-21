import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from './runPrompt'
import { getEndpointFromPath } from '@/server/datastore/endpoints'
import { PromptInputs } from '@/types'

async function runTokenizedEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const urlPath = req.body.urlPath
  const projectURLPath = req.body.projectURLPath
  const token = req.body.token
  const inputs = req.body.inputs as PromptInputs

  const endpoint = await getEndpointFromPath(urlPath, projectURLPath, token)
  if (token && endpoint) {
    // TODO log output, cost, failures, etc.
    const { output } = await runPromptWithConfig(endpoint.prompt, endpoint.config, inputs, endpoint.useCache)
    return res.json({ output })
  }

  return res.status(401).json(undefined)
}

export default runTokenizedEndpoint
