import { IsRawPromptVersion, RawChainVersion, RawPromptVersion } from '@/types'
import { getProviderCredentials } from './datastore/providers'
import { LinearClient } from '@linear/sdk'
import { getTrustedProjectScopedData } from './datastore/prompts'
import { Entity } from './datastore/datastore'
import { ChainRoute, PromptRoute } from '../common/clientRoute'

type Config = [string[], string[]]

export async function createTasksOnAddingVersionLabel(
  userID: number,
  projectID: number,
  version: RawPromptVersion | RawChainVersion,
  label: string
) {
  const { environment } = await getProviderCredentials([projectID], 'linear')
  if (environment) {
    const configs = JSON.parse(environment) as Config[]
    for (const [triggers] of configs) {
      if (triggers.includes(label)) {
        const { apiKey: accessToken } = await getProviderCredentials([userID], 'linear')
        if (accessToken) {
          const isPrompt = IsRawPromptVersion(version)
          const parentData = await getTrustedProjectScopedData(
            [isPrompt ? Entity.PROMPT : Entity.CHAIN],
            version.parentID
          )
          const client = new LinearClient({ accessToken })
          const teams = await client.teams()
          const team = teams.nodes[0]
          if (team?.id) {
            const issue = await client.createIssue({
              teamId: team.id,
              title: `[${label}] ${parentData.name}`,
              description: isPrompt
                ? PromptRoute(projectID, version.parentID)
                : ChainRoute(projectID, version.parentID),
            })
          }
        }
        break
      }
    }
  }
}
