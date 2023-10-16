import { postToAPI } from '@/src/client/api'
import { User, UserMetrics } from '@/types'

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api/admin', apiCall.name, json, 'json')
}

const api = {
  addUser: async function (email: string, fullName: string) {
    return post(this.addUser, { email, fullName })
  },
  getWaitlistUsers: async function (): Promise<User[]> {
    return post(this.getWaitlistUsers)
  },
  getUserMetrics: async function (userID: number): Promise<UserMetrics> {
    return post(this.getUserMetrics, { userID })
  },
}

export default api
