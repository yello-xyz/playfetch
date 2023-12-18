import { App } from 'octokit'
import { deserializePromptVersion, serializePromptVersion } from './serialize'
import { getProviderCredentials } from './datastore/providers'
import { getExportablePromptsFromProject, importPromptToProject } from './datastore/prompts'
import { ensureProjectAccess } from './datastore/projects'
import { PromptVersionsAreEqual } from '../common/versionsEqual'

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
  const { app, owner, repo } = await loadGitHubConfigForProject(userID, projectID)

  const exportablePrompts = await getExportablePromptsFromProject(projectID)

  for (const exportablePrompt of exportablePrompts) {
    const contents = await app.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path: exportablePrompt.sourcePath,
    })
    if (!Array.isArray(contents.data) && contents.data.type === 'file') {
      const promptContents = Buffer.from(contents.data.content, 'base64').toString('utf8')
      const promptVersion = deserializePromptVersion(promptContents)
      if (!PromptVersionsAreEqual(promptVersion, exportablePrompt)) {
        const content = Buffer.from(serializePromptVersion(exportablePrompt)).toString('base64')
        await app.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: exportablePrompt.sourcePath,
          sha: contents.data.sha,
          message: 'Export prompts',
          committer: { name: 'PlayFetch', email: 'github@playfetch.ai' },
          content,
        })
      }
    }
  }
}
