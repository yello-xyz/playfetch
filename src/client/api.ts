import {
  Project,
  ActivePrompt,
  PromptConfig,
  PromptInputs,
  ActiveProject,
  RunConfig,
  ModelProvider,
  Endpoint,
  ActiveChain,
  ChainItem,
  CodeConfig,
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
  getProjects: function (): Promise<Project[]> {
    return post(this.getProjects)
  },
  getProject: function (projectID: number): Promise<ActiveProject> {
    return post(this.getProject, { projectID })
  },
  addProject: function (name: string): Promise<number> {
    return post(this.addProject, { name })
  },
  renameProject: function (projectID: number, name: string) {
    return post(this.renameProject, { projectID, name })
  },
  addFlavor: function (projectID: number, flavor: string) {
    return post(this.addFlavor, { projectID, flavor })
  },
  inviteMembers: function (projectID: number, emails: string[]) {
    return post(this.inviteMembers, { projectID, emails })
  },
  leaveProject: function (projectID: number) {
    return post(this.leaveProject, { projectID })
  },
  deleteProject: function (projectID: number) {
    return post(this.deleteProject, { projectID })
  },
  getPrompt: function (promptID: number): Promise<ActivePrompt> {
    return post(this.getPrompt, { promptID })
  },
  addPrompt: function (projectID: number): Promise<number> {
    return post(this.addPrompt, { projectID })
  },
  updatePrompt: function (promptID: number, prompt: string, config: PromptConfig, versionID?: number): Promise<number> {
    return post(this.updatePrompt, { promptID, prompt, config, versionID })
  },
  movePrompt: function (promptID: number, projectID: number) {
    return post(this.movePrompt, { promptID, projectID })
  },
  renamePrompt: function (promptID: number, name: string) {
    return post(this.renamePrompt, { promptID, name })
  },
  toggleFavoritePrompt: function (promptID: number, favorite: boolean) {
    return post(this.toggleFavoritePrompt, { promptID, favorite })
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
  publishPrompt: function (
    versionID: number,
    projectID: number,
    promptID: number,
    name: string,
    flavor: string,
    useCache: boolean,
    useStreaming: boolean
  ) {
    return post(this.publishChain, { projectID, parentID: promptID, versionID, name, flavor, useCache, useStreaming })
  },
  getChain: function (chainID: number): Promise<ActiveChain> {
    return post(this.getChain, { chainID })
  },
  addChain: function (projectID: number): Promise<number> {
    return post(this.addChain, { projectID })
  },
  updateChain: function (chainID: number, items: ChainItem[]): Promise<number> {
    return post(this.updateChain, { chainID, items })
  },
  renameChain: function (chainID: number, name: string) {
    return post(this.renameChain, { chainID, name })
  },
  toggleFavoriteChain: function (chainID: number, favorite: boolean) {
    return post(this.toggleFavoriteChain, { chainID, favorite })
  },
  deleteChain: function (chainID: number) {
    return post(this.deleteChain, { chainID })
  },
  publishChain: function (
    projectID: number,
    chainID: number,
    name: string,
    flavor: string,
    useCache: boolean,
    useStreaming: boolean
  ) {
    return post(this.publishChain, { projectID, parentID: chainID, name, flavor, useCache, useStreaming })
  },
  updateEndpoint: function (endpoint: Endpoint) {
    return post(this.updateEndpoint, {
      endpointID: endpoint.id,
      enabled: endpoint.enabled,
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
  toggleLabel: function (versionID: number, projectID: number, label: string, checked: boolean) {
    return post(this.toggleLabel, { versionID, projectID, label, checked })
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
