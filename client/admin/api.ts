import { postToAPI } from '@/client/api'

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api/admin', apiCall.name, json)
}

const api = {
  addUser: async function (email: string, avatarColor: string, isAdmin: boolean) {
    return post(this.addUser, { email, avatarColor, isAdmin })
  },
}

export default api
