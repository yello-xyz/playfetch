import { ParsedUrlQuery } from 'querystring'
import { getActiveUsers, getMetricsForUser, getUsersWithoutAccess } from '@/src/server/datastore/users'
import { getMetricsForProject, getRecentProjects } from '@/src/server/datastore/projects'
import { getMetricsForWorkspace } from '@/src/server/datastore/workspaces'
import { ParseNumberQuery } from '@/src/common/clientRoute'
import { ActiveUsersItem, AdminItem, RecentProjectsItem, WaitlistItem } from '@/src/common/adminItem'

export default async function loadAdminItem(query: ParsedUrlQuery) {
  const { w: waitlist, p: projects, i: itemID, s: isWorkspace } = ParseNumberQuery(query)

  const initialActiveUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()
  const recentProjects = await getRecentProjects()

  const activeUser = initialActiveUsers.find(user => user.id === itemID)
  const recentProject = recentProjects.find(project => project.id === itemID)

  const initialWorkspaceMetrics = isWorkspace && itemID ? await getMetricsForWorkspace(itemID) : null
  const initialUserMetrics = activeUser ? await getMetricsForUser(activeUser.id) : null
  const initialProjectMetrics = recentProject
    ? await getMetricsForProject(recentProject.id, recentProject.workspaceID)
    : null

  const initialAdminItem: AdminItem = waitlist
    ? WaitlistItem
    : projects
      ? RecentProjectsItem
      : initialWorkspaceMetrics ?? activeUser ?? recentProject ?? ActiveUsersItem

  return {
    initialAdminItem,
    initialUserMetrics,
    initialProjectMetrics,
    initialWorkspaceMetrics,
    initialActiveUsers,
    waitlistUsers,
    recentProjects,
    analyticsLinks: [
      ['Dashboards', process.env.GOOGLE_ANALYTICS_DASHBOARD_URL ?? ''],
      ['Reports', process.env.GOOGLE_ANALYTICS_REPORTS_URL ?? ''],
      ['Search Console', process.env.GOOGLE_SEARCH_CONSOLE_URL ?? ''],
    ].filter(([, url]) => url),
    debugLinks: [
      ['Integration Test', process.env.INTEGRATION_TEST_URL ?? ''],
      ['Server Logs', process.env.SERVER_LOGS_URL ?? ''],
    ].filter(([, url]) => url),
  }
}
