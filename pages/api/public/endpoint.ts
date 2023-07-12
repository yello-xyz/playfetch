import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { PromptInputs, Version } from '@/types'
import { runPromptConfigs } from '../runChain'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)

  if (projectURLPath && endpointName) {
    const apiKey = req.headers['x-api-key'] as string
    const flavor = req.headers['x-environment'] as string | undefined

    if (apiKey && (await checkProject(projectURLPath, apiKey))) {
      const endpoint = await getEndpointFromPath(endpointName, projectURLPath, flavor)
      if (endpoint) {
        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)
        let lastOutput: string | undefined = undefined
        await runPromptConfigs(
          endpoint.userID,
          endpoint.chain,
          inputs,
          true,
          async (version: Version, { output, cost, attempts, cacheHit }) => {
            lastOutput = output
            await updateUsage(endpoint.id, version.promptID, cost, cacheHit, attempts, !output?.length)
          }
        )
        return res.json({ output : lastOutput })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
