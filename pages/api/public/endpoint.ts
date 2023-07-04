import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { getEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { Endpoint, PromptInputs, RunConfig, Version } from '@/types'
import { getChain } from '@/src/server/datastore/chains'
import { getVersionWithoutRuns } from '@/src/server/datastore/versions'

async function runSingleEndpoint(endpointID: number, runConfig: RunConfig, useCache: boolean, inputs: PromptInputs) {
  const prompt = ExtractPromptVariables(runConfig.prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    runConfig.prompt
  )
  const { output, cost, attempts, cacheHit } = await runPromptWithConfig(prompt, runConfig.config, inputs, useCache)
  await updateUsage(endpointID, runConfig.promptID, cost, cacheHit, attempts, !output?.length)
  return output
}

const loadConfigs = async (endpoint: Endpoint, projectID: number) => {
  const configFromVersion = (version: Version) => ({
    promptID: version.promptID,
    versionID: version.id,
    prompt: version.prompt,
    config: version.config,
  })
  
  const configFromEndpoint = (endpoint: Endpoint) => ({
    promptID: endpoint.promptID,
    versionID: endpoint.versionID,
    prompt: endpoint.prompt,
    config: endpoint.config,
  })
  
  if (endpoint.promptID === projectID) {
    const chain = await getChain(endpoint.versionID)
    return chain.map(item => ({
      getConfig: () => getVersionWithoutRuns(item.versionID).then(configFromVersion),
      mappedOutput: item.output,
    }))
  } else {
    return [{ getConfig: () => Promise.resolve(configFromEndpoint(endpoint)), mappedOutput: undefined }]
  }
}

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)

  if (projectURLPath && endpointName) {
    const apiKey = req.headers['x-api-key'] as string
    const flavor = req.headers['x-environment'] as string | undefined

    const projectID = apiKey ? await checkProject(projectURLPath, apiKey) : undefined
    if (projectID) {
      const endpoint = await getEndpointFromPath(endpointName, projectURLPath, flavor)
      if (endpoint) {
        const inputs = typeof req.body === 'string' ? {} : req.body as PromptInputs
        let output: string | undefined = undefined
        for (const { getConfig, mappedOutput } of await loadConfigs(endpoint, projectID)) {
          const runConfig = await getConfig()
          // TODO endpoint usage will seem off if we log multiple runs against the same endpoint
          output = await runSingleEndpoint(endpoint.id, runConfig, endpoint.useCache, inputs)
          if (!output?.length) {
            break
          }
          if (mappedOutput) {
            inputs[mappedOutput] = output
          }
        }
        return res.json({ output })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
