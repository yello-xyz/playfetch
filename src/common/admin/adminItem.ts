import { ActiveUser, RecentProject, Workspace } from '@/types'

export const WaitlistItem = 'waitlist'
export const ActiveUsersItem = 'activeUsers'
export const RecentProjectsItem = 'recentProjects'
export type AdminItem =
  | typeof WaitlistItem
  | typeof ActiveUsersItem
  | typeof RecentProjectsItem
  | ActiveUser
  | RecentProject
  | Workspace
export const AdminItemIsUser = (item: AdminItem): item is ActiveUser => typeof item === 'object' && 'fullName' in item
export const AdminItemIsProject = (item: AdminItem): item is RecentProject =>
  typeof item === 'object' && 'workspaceName' in item
