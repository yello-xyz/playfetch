import { getProviderCredentials } from './datastore/providers'
import { LinearClient } from '@linear/sdk'
import { ChainRoute, PromptRoute } from '../common/clientRoute'
import { getTrustedPromptOrChainData } from './datastore/chains'
import buildURLForRoute from './routing'
import { getUserForID } from './datastore/users'

type Config = [string[], string[]]

export async function createTasksOnAddingLabel(
  userID: number,
  projectID: number,
  parentID: number,
  label: string,
  isPrompt: boolean
) {
  const { environment } = await getProviderCredentials([projectID], 'linear')
  if (environment) {
    const configs = JSON.parse(environment) as Config[]
    for (const [triggers] of configs) {
      if (triggers.includes(label)) {
        const { apiKey: accessToken } = await getProviderCredentials([userID], 'linear')
        if (accessToken) {
          const parentData = await getTrustedPromptOrChainData(parentID)
          const user = await getUserForID(userID)
          const url = buildURLForRoute(isPrompt ? PromptRoute(projectID, parentID) : ChainRoute(projectID, parentID))
          const client = new LinearClient({ accessToken })
          const teams = await client.teams()
          const team = teams.nodes[0]
          if (team?.id) {
            const issue = await client.createIssue({
              teamId: team.id,
              title: `[${label}] ${parentData.name}`,
              description: `**${user.fullName}** added label **“${label}”** to [${parentData.name}](${url}).`,
            })
            const createdIssue = await issue.issue
            if (issue.success && createdIssue?.id) {
              console.log(`Created issue for ${parentID}`)
            }
          }
        }
        break
      }
    }
  }
}
