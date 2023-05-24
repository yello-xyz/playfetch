async function parseResponse(response: Response) {
  if (response.ok) {
    return response.json()
  } else if (response.status === 401) {
    window.location.href = '/'
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
  addPrompt: async function (prompt: string) {
    return post(this.addPrompt, { prompt })
  },
}

export default api
