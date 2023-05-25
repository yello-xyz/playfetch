import ClientRoute from "./clientRoute"

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
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(response => parseResponse(response))
}

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api', apiCall.name, json)
}

const api = {
  login: async function (email: string) {
    return post(this.login, { email })
  },
  logout: async function () {
    return post(this.logout)
  },
  addProject: async function () {
    return post(this.addProject)
  },
  addPrompt: async function (projectID: number) {
    return post(this.addPrompt, { projectID })
  },
}

export default api
