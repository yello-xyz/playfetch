import { postToAPI } from '@/src/client/api'
import { ActiveUser, ProjectMetrics, User, UserMetrics, WorkspaceMetrics } from '@/types'

const post = (apiCall: Function, json: any = {}) => {
  return postToAPI('/api/admin', apiCall.name, json, 'json')
}

const api = {
  addUser: async function (email: string, fullName: string, asAdmin: boolean) {
    return post(this.addUser, { email, fullName, asAdmin })
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
  getWorkspaceMetrics: async function (workspaceID: number, before?: number): Promise<WorkspaceMetrics> {
    return post(this.getWorkspaceMetrics, { workspaceID, before })
  },
}

export default api
