import { Project, ActivePrompt, PromptConfig, PromptInputs, ActiveProject, RunConfig, ModelProvider } from '@/types'
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
  getPromptForVersion: function (versionID: number): Promise<ActivePrompt> {
    return post(this.getPrompt, { versionID })
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
  toggleFavorite: function (promptID: number, favorite: boolean) {
    return post(this.toggleFavorite, { promptID, favorite })
  },
  deletePrompt: function (promptID: number) {
    return post(this.deletePrompt, { promptID })
  },
  runPrompt: function (config: RunConfig, inputs: PromptInputs[]): Promise<StreamReader> {
    return post(this.runChain, { configs: [config], inputs }, 'stream')
  },
  runChain: function (configs: RunConfig[], inputs: PromptInputs[]): Promise<StreamReader> {
    return post(this.runChain, { configs, inputs }, 'stream')
  },
  checkEndpointName: function (promptID: number, projectURLPath: string, name: string): Promise<boolean> {
    return post(this.checkEndpointName, { promptID, projectURLPath, name })
  },
  publishPrompt: function (
    versionID: number,
    projectID: number,
    promptID: number,
    name: string,
    flavor: string,
    useCache: boolean
  ) {
    const chain = [{ promptID, versionID }]
    return post(this.publishChain, { chain, projectID, promptID, name, flavor, useCache })
  },
  publishChain: function (chain: RunConfig[], projectID: number, name: string, flavor: string, useCache: boolean) {
    return post(this.publishChain, { chain, projectID, promptID: projectID, name, flavor, useCache })
  },
  toggleCache: function (endpointID: number, useCache: boolean) {
    return post(this.toggleCache, { endpointID, useCache })
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
