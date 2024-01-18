import {
  Project,
  PromptConfig,
  PromptInputs,
  ActiveProject,
  ModelProvider,
  ActiveWorkspace,
  Workspace,
  ChainItemWithInputs,
  ActiveChain,
  ActivePrompt,
  Comment,
  Prompts,
  Analytics,
  AvailableProvider,
  QueryProvider,
  PendingWorkspace,
  PendingProject,
  OnboardingResponse,
  RunRating,
  CostUsage,
  Run,
  SourceControlProvider,
  ActiveTable,
} from '@/types'
import ClientRoute from '../common/clientRoute'
import { BuildActiveChain, BuildActivePrompt, BuildActiveTable } from '../common/activeItem'
import Progress from 'nprogress'
import { LayoutConfig } from '../common/userPresets'

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
    window.open(ClientRoute.Home, '_self')
  }
  return Promise.resolve(null)
}

export async function postToAPI(
  apiPath: string,
  apiCall: string,
  body: Record<string, any>,
  responseType: ResponseType,
  signal?: AbortSignal
) {
  Progress.start()
  return fetch(`${apiPath}/${apiCall}`, {
    method: 'POST',
    headers: {
      ...(responseType === 'json' ? { accept: 'application/json' } : undefined),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })
    .then(response => parseResponse(response, responseType))
    .finally(() => Progress.done())
}

const post = (apiCall: Function, json: any = {}, responseType: ResponseType = 'json', signal?: AbortSignal) => {
  return postToAPI('/api', apiCall.name, json, responseType, signal)
}

const api = {
  getWorkspaces: function (): Promise<[Workspace[], PendingWorkspace[]]> {
    return post(this.getWorkspaces)
  },
  getWorkspace: function (workspaceID: number): Promise<ActiveWorkspace> {
    return post(this.getWorkspace, { workspaceID })
  },
  getSharedProjects: function (): Promise<[Project[], PendingProject[]]> {
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
  respondToInvite: function (objectID: number, accept: boolean) {
    return post(this.respondToInvite, { objectID, accept })
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
  revokeProjectAccess: function (projectID: number, memberID?: number) {
    return post(this.revokeProjectAccess, { projectID, memberID })
  },
  toggleProjectOwnership: function (projectID: number, memberID: number, isOwner: boolean) {
    return post(this.toggleProjectOwnership, { projectID, memberID, isOwner })
  },
  deleteProject: function (projectID: number) {
    return post(this.deleteProject, { projectID })
  },
  getPrompt: function (promptID: number, activeProject: ActiveProject): Promise<ActivePrompt> {
    return post(this.getPrompt, { promptID }).then(BuildActivePrompt(activeProject))
  },
  addPrompt: function (projectID: number): Promise<number> {
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
  suggestPrompt: function (promptID: number, versionID: number, currentVersionID: number) {
    return post(this.suggestPrompt, { promptID, versionID, currentVersionID })
  },
  runVersion: function (
    versionID: number,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number,
    autoRespond?: boolean,
    maxResponses?: number,
    signal?: AbortSignal
  ): Promise<StreamReader> {
    return post(
      this.runVersion,
      { versionID, inputs, dynamicInputs, continuationID, autoRespond, maxResponses },
      'stream',
      signal
    )
  },
  getIntermediateRuns: function (parentRunID: number, continuationID?: number): Promise<Run[]> {
    return post(this.getIntermediateRuns, { parentRunID, continuationID })
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
  getTable: function (tableID: number): Promise<ActiveTable> {
    return post(this.getTable, { tableID }).then(BuildActiveTable)
  },
  addTable: function (projectID: number): Promise<number> {
    return post(this.addTable, { projectID })
  },
  renameTable: function (tableID: number, name: string) {
    return post(this.renameTable, { tableID, name })
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
  getAnalytics: function (projectID: number, dayRange = 30): Promise<Analytics> {
    return post(this.getAnalytics, { projectID, dayRange })
  },
  getCostUsage: function (scopeID: number): Promise<CostUsage> {
    return post(this.getCostUsage, { scopeID })
  },
  updateBudget: function (scopeID: number, limit?: number, threshold?: number) {
    return post(this.updateBudget, { scopeID, limit, threshold })
  },
  addComment: function (
    versionID: number,
    text: string,
    replyTo?: number,
    quote?: string,
    runID?: number,
    itemIndex?: number,
    startIndex?: number
  ): Promise<Comment> {
    return post(this.addComment, { versionID, text, replyTo, quote, runID, itemIndex, startIndex })
  },
  toggleVersionLabel: function (
    versionID: number,
    projectID: number,
    label: string,
    checked: boolean,
    replyTo?: number
  ) {
    return post(this.toggleVersionLabel, { versionID, projectID, label, checked, replyTo })
  },
  toggleRunLabel: function (runID: number, projectID: number, label: string, checked: boolean, replyTo?: number) {
    return post(this.toggleRunLabel, { runID, projectID, label, checked, replyTo })
  },
  toggleRunRating: function (runID: number, projectID: number, rating: RunRating, reason?: string, replyTo?: number) {
    return post(this.toggleRunRating, { runID, projectID, rating, reason, replyTo })
  },
  updateInputValues: function (parentID: number, name: string, values: string[]) {
    return post(this.updateInputValues, { parentID, name, values })
  },
  deleteVersion: function (versionID: number) {
    return post(this.deleteVersion, { versionID })
  },
  updateDefaultPromptConfig: function (defaultPromptConfig: Partial<PromptConfig>) {
    return post(this.updateDefaultPromptConfig, { defaultPromptConfig })
  },
  updateLayoutConfig: function (layoutConfig: Partial<LayoutConfig>) {
    return post(this.updateLayoutConfig, { layoutConfig })
  },
  getAvailableProviders: function (projectID: number): Promise<AvailableProvider[]> {
    return post(this.getAvailableProviders, { projectID })
  },
  getScopedProviders: function (projectID?: number): Promise<AvailableProvider[]> {
    return post(this.getScopedProviders, { projectID })
  },
  updateProviderKey: function (
    scopeID: number,
    provider: ModelProvider | QueryProvider | SourceControlProvider,
    apiKey: string | null,
    environment?: string
  ) {
    return post(this.updateProviderKey, { scopeID, provider, apiKey, environment })
  },
  importPrompts: function (projectID: number) {
    return post(this.importPrompts, { projectID })
  },
  exportPrompts: function (projectID: number) {
    return post(this.exportPrompts, { projectID })
  },
  exportPrompt: function (projectID: number, versionID: number, fileName: string) {
    return post(this.exportPrompts, { projectID, versionID, fileName })
  },
  updateProviderModel: function (
    scopeID: number,
    provider: ModelProvider,
    modelID: string,
    name: string,
    description: string,
    enabled: boolean
  ) {
    return post(this.updateProviderModel, { scopeID, provider, modelID, name, description, enabled })
  },
  logOut: function () {
    return post(this.logOut)
  },
  completeOnboarding: function (response: OnboardingResponse) {
    return post(this.completeOnboarding, { response })
  },
}

export default api
