import { Project, Prompt, ActivePrompt, PromptConfig, PromptInputs, ActiveProject } from '@/types'
import ClientRoute from './clientRoute'

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
  login: function (email: string) {
    return post(this.login, { email })
  },
  logout: async function () {
    return post(this.logout)
  },
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
  runPrompt: function (
    promptID: number,
    versionID: number,
    prompt: string,
    config: PromptConfig,
    inputs: PromptInputs[]
  ) {
    return post(this.runPrompt, { promptID, versionID, prompt, config, inputs })
  },
  checkEndpointName: function (promptID: number, projectURLPath: string, name: string): Promise<{ url?: string }> {
    return post(this.checkEndpointName, { promptID, projectURLPath, name })
  },
  publishPrompt: function (
    projectID: number,
    promptID: number,
    name: string,
    prompt: string,
    config: PromptConfig,
    inputs: PromptInputs,
    useCache: boolean
  ): Promise<string> {
    return post(this.publishPrompt, { projectID, promptID, name, prompt, config, inputs, useCache })
  },
  unpublishPrompt: function (promptID: number) {
    return post(this.unpublishPrompt, { promptID })
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
