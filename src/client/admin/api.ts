import { postToAPI } from '@/src/client/api'

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api/admin', apiCall.name, json, 'json')
}

const api = {
  addUser: async function (email: string, fullName: string) {
    return post(this.addUser, { email, fullName })
  },
  getWaitlistUsers: async function () {
    return post(this.getWaitlistUsers)
  },
}

export default api
