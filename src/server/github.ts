import { App } from 'octokit'
import { deserializePromptVersion } from './serialize'
import { getProviderCredentials } from './datastore/providers'
import { addPromptForUser } from './datastore/prompts'
import { savePromptVersionForUser } from './datastore/versions'

const isYamlFile = (file: any) => file.type === 'file' && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))

const getAppInstallation = (installationID: string | null) =>
  new App({
    appId: process.env.GITHUB_APP_ID ?? '',
    privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  }).getInstallationOctokit(Number(installationID))

export default async function importPromptsToProject(userID: number, projectID: number) {
  const { apiKey: installationID, environment } = await getProviderCredentials([projectID], 'github')

  const pathSegments = (environment ?? '').split('/')
  const owner = pathSegments[0]
  const repo = pathSegments[1]
  const rootPath = pathSegments.slice(2).join('/')

  const octokit = await getAppInstallation(installationID)

  const files = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path: rootPath })

  for (const file of (Array.isArray(files.data) ? files.data : []).filter(isYamlFile)) {
    const contents = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path: file.path,
    })
    if (!Array.isArray(contents.data) && contents.data.type === 'file') {
      const promptContents = Buffer.from(contents.data.content, 'base64').toString('utf8')
      const promptVersion = deserializePromptVersion(promptContents)

      const { promptID: newPromptID, versionID } = await addPromptForUser(userID, projectID, file.name.split('.')[0])
      await savePromptVersionForUser(userID, newPromptID, promptVersion.prompts, promptVersion.config, versionID)
    }
  }
}
