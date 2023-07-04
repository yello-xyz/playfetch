import { Project, ActivePrompt, PromptConfig, PromptInputs, ActiveProject, RunConfig, Chain } from '@/types'
import ClientRoute from '../../components/clientRoute'

async function parseResponse(response: Response) {
  if (response.ok) {
    return response.json()
  } else if (response.status === 401) {
    window.location.href = ClientRoute.Home
  }
  return Promise.resolve(null)
}

export async function postToAPI(apiPath: string, apiCall: string, body: Record<string, any>) {
  return fetch(`${apiPath}/${apiCall}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(response => parseResponse(response))
}

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api', apiCall.name, json)
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
  toggleFavorite: function (promptID: number, favorite: boolean) {
    return post(this.toggleFavorite, { promptID, favorite })
  },
  deletePrompt: function (promptID: number) {
    return post(this.deletePrompt, { promptID })
  },
  runPrompt: function (config: RunConfig, inputs: PromptInputs[]) {
    return post(this.runPrompt, { config, inputs })
  },
  runChain: function (configs: RunConfig[], inputs: PromptInputs[]) {
    return post(this.runChain, { configs, inputs })
  },
  checkEndpointName: function (promptID: number, projectURLPath: string, name: string): Promise<boolean> {
    return post(this.checkEndpointName, { promptID, projectURLPath, name })
  },
  publishPrompt: function (versionID: number, projectID: number, name: string, flavor: string, useCache: boolean) {
    return post(this.publishPrompt, { versionID, projectID, name, flavor, useCache })
  },
  publishChain: function (chain: Chain, projectID: number, name: string, flavor: string, useCache: boolean) {
    return post(this.publishChain, { chain, projectID, name, flavor, useCache })
  },
  toggleCache: function (endpointID: number, useCache: boolean) {
    return post(this.toggleCache, { endpointID, useCache })
  },
  unpublishPrompt: function (endpointID: number) {
    return post(this.unpublishPrompt, { endpointID })
  },
  updateVersionLabels: function (versionID: number, projectID: number, labels: string[]) {
    return post(this.updateVersionLabels, { versionID, projectID, labels })
  },
  updateInputValues: function (projectID: number, name: string, values: string[]) {
    return post(this.updateInputValues, { projectID, name, values })
  },
  deleteVersion: function (versionID: number) {
    return post(this.deleteVersion, { versionID })
  },
}

export default api
