import { Project, Prompt, RunConfig, Version } from '@/types'
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
      'accept': 'application/json',
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
  getPrompts: function (projectID: number | null): Promise<Prompt[]> {
    return post(this.getPrompts, { projectID })
  },
  checkProjectName: function (name: string): Promise<{ url?: string }> {
    return post(this.checkProjectName, { name })
  },
  addProject: function (name: string) {
    return post(this.addProject, { name })
  },
  getPrompt: function (promptID: number): Promise<Prompt> {
    return post(this.getPrompt, { promptID })
  },
  addPrompt: function (projectID: number | null): Promise<Prompt> {
    return post(this.addPrompt, { projectID })
  },
  updatePrompt: function (
    promptID: number,
    prompt: string,
    title: string,
    tags: string,
    versionID?: number
  ): Promise<number> {
    return post(this.updatePrompt, { promptID, prompt, title, tags, versionID })
  },
  runPrompt: function (promptID: number, versionID: number, prompt: string, config: RunConfig) {
    return post(this.runPrompt, { promptID, versionID, prompt, config })
  },
  runTokenizedEndpoint: function (
    urlPath: string,
    projectURLPath: string,
    token: string,
    inputs: { [key: string]: string }
  ): Promise<{ output: string }> {
    return post(this.runTokenizedEndpoint, { urlPath, projectURLPath, token, inputs })
  },
  checkEndpointName: function (promptID: number, projectURLPath: string, name: string): Promise<{ url?: string }> {
    return post(this.checkEndpointName, { promptID, projectURLPath, name })
  },
  publishPrompt: function (
    projectID: number,
    promptID: number,
    name: string,
    prompt: string,
    config: RunConfig
  ): Promise<string> {
    return post(this.publishPrompt, { projectID, promptID, name, prompt, config })
  },
  unpublishPrompt: function (promptID: number) {
    return post(this.unpublishPrompt, { promptID })
  },
  getVersions: function (promptID: number): Promise<Version[]> {
    return post(this.getVersions, { promptID })
  },
  deleteVersion: function (versionID: number) {
    return post(this.deleteVersion, { versionID })
  },
}

export default api
