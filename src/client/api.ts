import {
  Project,
  PromptConfig,
  PromptInputs,
  ActiveProject,
  RunConfig,
  ModelProvider,
  Endpoint,
  Chain,
  CodeConfig,
  ActiveWorkspace,
  Workspace,
  Version,
  ChainItemWithInputs,
} from '@/types'
import ClientRoute from '../../components/clientRoute'

export type StreamReader = ReadableStreamDefaultReader<Uint8Array>

type ResponseType = 'json' | 'stream'

async function parseResponse(response: Response, responseType: ResponseType) {
  if (response.ok) {
    switch (responseType) {
      case 'json':
        return response.json()
      case 'stream':
        return response.body?.getReader()
    }
  } else if (response.status === 401) {
    window.location.href = ClientRoute.Home
  }
  return Promise.resolve(null)
}

export async function postToAPI(
  apiPath: string,
  apiCall: string,
  body: Record<string, any>,
  responseType: ResponseType
) {
  return fetch(`${apiPath}/${apiCall}`, {
    method: 'POST',
    headers: {
      ...(responseType === 'json' ? { accept: 'application/json' } : undefined),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(response => parseResponse(response, responseType))
}

const post = (apiCall: Function, json: any = {}, responseType: ResponseType = 'json') => {
  return postToAPI('/api', apiCall.name, json, responseType)
}

const api = {
  getWorkspaces: function (): Promise<Workspace[]> {
    return post(this.getWorkspaces)
  },
  getWorkspace: function (workspaceID: number): Promise<ActiveWorkspace> {
    return post(this.getWorkspace, { workspaceID })
  },
  getSharedProjects: function (): Promise<Project[]> {
    return post(this.getSharedProjects)
  },
  addWorkspace: function (name: string): Promise<number> {
    return post(this.addWorkspace, { name })
  },
  renameWorkspace: function (workspaceID: number, name: string) {
    return post(this.renameWorkspace, { workspaceID, name })
  },
  deleteWorkspace: function (workspaceID: number) {
    return post(this.deleteWorkspace, { workspaceID })
  },
  leaveWorkspace: function (workspaceID: number) {
    return post(this.leaveWorkspace, { workspaceID })
  },
  inviteToWorkspace: function (workspaceID: number, emails: string[]) {
    return post(this.inviteToWorkspace, { workspaceID, emails })
  },
  getProject: function (projectID: number): Promise<ActiveProject> {
    return post(this.getProject, { projectID })
  },
  addProject: function (workspaceID: number): Promise<number> {
    return post(this.addProject, { workspaceID })
  },
  moveProject: function (projectID: number, workspaceID: number) {
    return post(this.moveProject, { projectID, workspaceID })
  },
  renameProject: function (projectID: number, name: string) {
    return post(this.renameProject, { projectID, name })
  },
  toggleFavoriteProject: function (projectID: number, favorite: boolean) {
    return post(this.toggleFavoriteProject, { projectID, favorite })
  },
  addFlavor: function (projectID: number, flavor: string) {
    return post(this.addFlavor, { projectID, flavor })
  },
  inviteToProject: function (projectID: number, emails: string[]) {
    return post(this.inviteToProject, { projectID, emails })
  },
  leaveProject: function (projectID: number) {
    return post(this.leaveProject, { projectID })
  },
  deleteProject: function (projectID: number) {
    return post(this.deleteProject, { projectID })
  },
  getPromptVersions: function (promptID: number): Promise<Version[]> {
    return post(this.getPromptVersions, { promptID })
  },
  addPrompt: function (projectID: number): Promise<number> {
    return post(this.addPrompt, { projectID })
  },
  duplicatePrompt: function (promptID: number, targetProjectID?: number): Promise<number> {
    return post(this.duplicatePrompt, { promptID, targetProjectID })
  },
  updatePrompt: function (promptID: number, prompt: string, config: PromptConfig, versionID?: number): Promise<number> {
    return post(this.updatePrompt, { promptID, prompt, config, versionID })
  },
  renamePrompt: function (promptID: number, name: string) {
    return post(this.renamePrompt, { promptID, name })
  },
  deletePrompt: function (promptID: number) {
    return post(this.deletePrompt, { promptID })
  },
  runPrompt: function (config: RunConfig, inputs: PromptInputs[]): Promise<StreamReader> {
    return post(this.runChain, { configs: [config], inputs }, 'stream')
  },
  runChain: function (configs: (RunConfig | CodeConfig)[], inputs: PromptInputs[]): Promise<StreamReader> {
    return post(this.runChain, { configs, inputs }, 'stream')
  },
  publishEndpoint: function (
    projectID: number,
    parentID: number,
    versionID: number | undefined,
    name: string,
    flavor: string,
    useCache: boolean,
    useStreaming: boolean
  ) {
    return post(this.publishEndpoint, {
      projectID,
      parentID,
      versionID,
      name,
      flavor,
      useCache,
      useStreaming,
    })
  },
  getChain: function (chainID: number): Promise<Chain> {
    return post(this.getChain, { chainID })
  },
  addChain: function (projectID: number): Promise<number> {
    return post(this.addChain, { projectID })
  },
  duplicateChain: function (chainID: number): Promise<number> {
    return post(this.duplicateChain, { chainID })
  },
  updateChain: function (chainID: number, items: ChainItemWithInputs[]): Promise<number> {
    return post(this.updateChain, { chainID, items })
  },
  renameChain: function (chainID: number, name: string) {
    return post(this.renameChain, { chainID, name })
  },
  deleteChain: function (chainID: number) {
    return post(this.deleteChain, { chainID })
  },
  updateEndpoint: function (endpoint: Endpoint) {
    return post(this.updateEndpoint, {
      endpointID: endpoint.id,
      enabled: endpoint.enabled,
      parentID: endpoint.parentID,
      versionID: endpoint.versionID,
      name: endpoint.urlPath,
      flavor: endpoint.flavor,
      useCache: endpoint.useCache,
      useStreaming: endpoint.useStreaming,
    })
  },
  deleteEndpoint: function (endpointID: number) {
    return post(this.deleteEndpoint, { endpointID })
  },
  addComment: function (versionID: number, text: string, quote?: string, runID?: number, startIndex?: number) {
    return post(this.addComment, { versionID, text, quote, runID, startIndex })
  },
  toggleVersionLabel: function (versionID: number, projectID: number, label: string, checked: boolean) {
    return post(this.toggleVersionLabel, { versionID, projectID, label, checked })
  },
  toggleRunLabel: function (runID: number, projectID: number, label: string, checked: boolean) {
    return post(this.toggleRunLabel, { runID, projectID, label, checked })
  },
  updateInputValues: function (projectID: number, name: string, values: string[]) {
    return post(this.updateInputValues, { projectID, name, values })
  },
  deleteVersion: function (versionID: number) {
    return post(this.deleteVersion, { versionID })
  },
  getAvailableProviders: function () {
    return post(this.getAvailableProviders)
  },
  updateProviderKey: function (provider: ModelProvider, apiKey: string | null) {
    return post(this.updateProviderKey, { provider, apiKey })
  },
  logOut: function () {
    return post(this.logOut)
  },
}

export default api
