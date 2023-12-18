import { App } from 'octokit'
import { deserializePromptVersion } from './serialize'
import { getProviderCredentials } from './datastore/providers'
import { getExportablePromptsFromProject, importPromptToProject } from './datastore/prompts'
import { ensureProjectAccess } from './datastore/projects'

const isYamlFile = (file: any) => file.type === 'file' && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))

const loadGitHubConfigForProject = async (userID: number, projectID: number) => {
  await ensureProjectAccess(userID, projectID)
  const { apiKey: installationID, environment } = await getProviderCredentials([projectID], 'github')

  const app = await new App({
    appId: process.env.GITHUB_APP_ID ?? '',
    privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  }).getInstallationOctokit(Number(installationID))

  const pathSegments = (environment ?? '').split('/')
  const owner = pathSegments[0]
  const repo = pathSegments[1]
  const path = pathSegments.slice(2).join('/')

  return { app, owner, repo, path }
}

export default async function importPromptsToProject(userID: number, projectID: number) {
  const { app, owner, repo, path } = await loadGitHubConfigForProject(userID, projectID)

  const files = await app.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path })

  for (const file of (Array.isArray(files.data) ? files.data : []).filter(isYamlFile)) {
    const contents = await app.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path: file.path,
    })
    if (!Array.isArray(contents.data) && contents.data.type === 'file') {
      const promptContents = Buffer.from(contents.data.content, 'base64').toString('utf8')
      const promptVersion = deserializePromptVersion(promptContents)
      await importPromptToProject(userID, projectID, file.path, promptVersion.prompts, promptVersion.config)
    }
  }
}

export async function exportPromptsFromProject(userID: number, projectID: number) {
  const { app, owner, repo, path } = await loadGitHubConfigForProject(userID, projectID)

  const versions = await getExportablePromptsFromProject(projectID)
  console.log(versions)
}
