import { postToAPI } from '@/src/client/api'
import { ActiveUser, ProjectMetrics, User, UserMetrics } from '@/types'

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api/admin', apiCall.name, json, 'json')
}

const api = {
  addUser: async function (email: string, fullName: string) {
    return post(this.addUser, { email, fullName })
  },
  getActiveUsers: async function (before: number): Promise<ActiveUser[]> {
    return post(this.getActiveUsers, { before })
  },
  getWaitlistUsers: async function (): Promise<User[]> {
    return post(this.getWaitlistUsers)
  },
  getUserMetrics: async function (userID: number): Promise<UserMetrics> {
    return post(this.getUserMetrics, { userID })
  },
  getProjectMetrics: async function (projectID: number, workspaceID: number, before?: number): Promise<ProjectMetrics> {
    return post(this.getProjectMetrics, { projectID, workspaceID, before })
  },
}

export default api
