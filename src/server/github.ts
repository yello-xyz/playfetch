import { App } from 'octokit'
import { deserializePromptVersion, serializePromptVersion } from './serialize'
import { getProviderCredentials } from './datastore/providers'
import { getExportablePromptsFromProject, importPromptToProject, updatePromptSourcePath } from './datastore/prompts'
import { ensureProjectAccess } from './datastore/projects'
import { PromptVersionsAreEqual } from '../common/versionsEqual'
import { getTrustedVersion } from './datastore/versions'
import { RawPromptVersion } from '@/types'

const isYamlFile = (file: any) => file.type === 'file' && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))

const loadGitHubConfigForProject = async (userID: number, projectID: number) => {
  await ensureProjectAccess(userID, projectID)
  const { apiKey: installationID, environment } = await getProviderCredentials([projectID], 'github')

  const app = await new App({
    appId: process.env.GITHUB_APP_ID ?? '',
    privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  }).getInstallationOctokit(Number(installationID))

  const branchSegments = (environment ?? '').split(':')
  const pathSegments = branchSegments[0].split('/')
  const owner = pathSegments[0]
  const repo = pathSegments[1]
  const path = pathSegments.slice(2).join('/')
  const branch = branchSegments[1] as string | undefined

  return { app, owner, repo, path, branch }
}

const loadPromptVersionForPath = async (app: any, owner: string, repo: string, path: string, files?: any) => {
  if (!files || (Array.isArray(files.data) ? files.data.map((f: { path: string }) => f.path) : []).includes(path)) {
    const contents = await app.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path })
    if (!Array.isArray(contents.data) && contents.data.type === 'file') {
      const promptContents = Buffer.from(contents.data.content, 'base64').toString('utf8')
      return [deserializePromptVersion(promptContents), contents.data.sha] as const
    }
  }

  return [null, null] as const
}

export default async function importPromptsToProject(userID: number, projectID: number) {
  const { app, owner, repo, path } = await loadGitHubConfigForProject(userID, projectID)

  const files = await app.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path })

  for (const file of (Array.isArray(files.data) ? files.data : []).filter(isYamlFile)) {
    const [promptVersion] = await loadPromptVersionForPath(app, owner, repo, file.path)
    if (promptVersion) {
      await importPromptToProject(userID, projectID, file.name, promptVersion.prompts, promptVersion.config)
    }
  }
}

export async function exportPromptsFromProject(
  userID: number,
  projectID: number,
  versionID?: number,
  fileName?: string
) {
  const { app, owner, repo, path, branch } = await loadGitHubConfigForProject(userID, projectID)

  let exportablePrompts: Awaited<ReturnType<typeof getExportablePromptsFromProject>>
  if (versionID && fileName) {
    const version = (await getTrustedVersion(versionID)) as RawPromptVersion
    exportablePrompts = [{ prompts: version.prompts, config: version.config, sourcePath: fileName }]
    await updatePromptSourcePath(version.parentID, fileName)
  } else {
    exportablePrompts = await getExportablePromptsFromProject(projectID)
  }

  const files = await app.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path })

  for (const exportablePrompt of exportablePrompts) {
    const filePath = path.length > 0 ? `${path}/${exportablePrompt.sourcePath}` : exportablePrompt.sourcePath
    const [promptVersion, fileHash] = await loadPromptVersionForPath(app, owner, repo, filePath, files)
    if (!promptVersion || !PromptVersionsAreEqual(promptVersion, exportablePrompt)) {
      const content = Buffer.from(serializePromptVersion(exportablePrompt)).toString('base64')
      await app.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: filePath,
        branch,
        sha: fileHash,
        message: `Update ${exportablePrompt.sourcePath}`,
        content,
      })
    }
  }
}
