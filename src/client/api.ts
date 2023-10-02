import {
  Project,
  PromptConfig,
  PromptInputs,
  ActiveProject,
  ModelProvider,
  ActiveWorkspace,
  Workspace,
  ChainItemWithInputs,
  LogEntry,
  ActiveChain,
  ActivePrompt,
  Comment,
  Prompts,
  Usage,
  Analytics,
} from '@/types'
import ClientRoute from './clientRoute'
import { BuildActiveChain, BuildActivePrompt } from '../common/activeItem'
import Progress from 'nprogress'

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
  Progress.start()
  return fetch(`${apiPath}/${apiCall}`, {
    method: 'POST',
    headers: {
      ...(responseType === 'json' ? { accept: 'application/json' } : undefined),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then(response => parseResponse(response, responseType))
    .finally(() => Progress.done())
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
  getPrompt: function (promptID: number, activeProject: ActiveProject): Promise<ActivePrompt> {
    return post(this.getPrompt, { promptID }).then(BuildActivePrompt(activeProject))
  },
  addPrompt: function (projectID: number): Promise<{ promptID: number; versionID: number }> {
    return post(this.addPrompt, { projectID })
  },
  duplicatePrompt: function (promptID: number, targetProjectID?: number): Promise<number> {
    return post(this.duplicatePrompt, { promptID, targetProjectID })
  },
  updatePrompt: function (
    promptID: number,
    prompts: Prompts,
    config: PromptConfig,
    versionID: number,
    previousVersionID: number
  ): Promise<number> {
    return post(this.updatePrompt, { promptID, prompts, config, versionID, previousVersionID })
  },
  renamePrompt: function (promptID: number, name: string) {
    return post(this.renamePrompt, { promptID, name })
  },
  deletePrompt: function (promptID: number) {
    return post(this.deletePrompt, { promptID })
  },
  runVersion: function (versionID: number, inputs: PromptInputs[]): Promise<StreamReader> {
    return post(this.runVersion, { versionID, inputs }, 'stream')
  },
  getChain: function (chainID: number, activeProject: ActiveProject): Promise<ActiveChain> {
    return post(this.getChain, { chainID }).then(BuildActiveChain(activeProject))
  },
  addChain: function (projectID: number): Promise<number> {
    return post(this.addChain, { projectID })
  },
  duplicateChain: function (chainID: number): Promise<number> {
    return post(this.duplicateChain, { chainID })
  },
  updateChain: function (
    chainID: number,
    items: ChainItemWithInputs[],
    versionID: number,
    previousVersionID: number
  ): Promise<number> {
    return post(this.updateChain, { chainID, items, versionID, previousVersionID })
  },
  renameChain: function (chainID: number, name: string) {
    return post(this.renameChain, { chainID, name })
  },
  deleteChain: function (chainID: number) {
    return post(this.deleteChain, { chainID })
  },
  publishEndpoint: function (
    isEnabled: boolean,
    projectID: number,
    parentID: number,
    versionID: number,
    name: string,
    flavor: string,
    useCache: boolean,
    useStreaming: boolean
  ): Promise<number> {
    return post(this.publishEndpoint, {
      isEnabled,
      projectID,
      parentID,
      versionID,
      name,
      flavor,
      useCache,
      useStreaming,
    })
  },
  updateEndpoint: function (
    endpointID: number,
    enabled: boolean,
    parentID: number,
    versionID: number,
    name: string,
    flavor: string,
    useCache: boolean,
    useStreaming: boolean
  ) {
    return post(this.updateEndpoint, {
      endpointID,
      enabled,
      parentID,
      versionID,
      name,
      flavor,
      useCache,
      useStreaming,
    })
  },
  deleteEndpoint: function (endpointID: number) {
    return post(this.deleteEndpoint, { endpointID })
  },
  getAnalytics: function (projectID: number, range = 30): Promise<Analytics> {
    return post(this.getAnalytics, { projectID, range })
  },
  addComment: function (
    versionID: number,
    text: string,
    quote?: string,
    runID?: number,
    itemIndex?: number,
    startIndex?: number
  ): Promise<Comment> {
    return post(this.addComment, { versionID, text, quote, runID, itemIndex, startIndex })
  },
  toggleVersionLabel: function (versionID: number, projectID: number, label: string, checked: boolean) {
    return post(this.toggleVersionLabel, { versionID, projectID, label, checked })
  },
  toggleRunLabel: function (runID: number, projectID: number, label: string, checked: boolean) {
    return post(this.toggleRunLabel, { runID, projectID, label, checked })
  },
  updateInputValues: function (parentID: number, name: string, values: string[]) {
    return post(this.updateInputValues, { parentID, name, values })
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
