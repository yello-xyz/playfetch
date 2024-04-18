import { createHash } from 'crypto'
import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntities,
  getEntityCount,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
  getRecentEntities,
  getTimestamp,
} from './datastore'
import { decrypt, encrypt } from '@/src/server/encryption'
import { ActiveProject, PendingProject, PendingUser, Project, ProjectMetrics, RecentProject, User } from '@/types'
import ShortUniqueId from 'short-unique-id'
import {
  grantUserAccess,
  grantUsersAccess,
  hasUserAccess,
  checkUserOwnership,
  revokeUserAccess,
  getAccessibleObjectIDs,
} from './access'
import { addPromptToProject, matchesDefaultName, toPrompt } from './prompts'
import { getActiveUsers, getUserForEmail, toUser } from './users'
import { DefaultEndpointFlavor, toEndpoint } from './endpoints'
import { toChain } from './chains'
import { ensureWorkspaceAccess, getPendingAccessObjects, getWorkspaceUsers } from './workspaces'
import { toUsage } from './usage'
import { GetUniqueName, StripVariableSentinels } from '@/src/common/formatting'
import { getAnalyticsForProject } from './analytics'
import { toComment } from './comments'
import { deleteEntity } from './cleanup'
import { toTable } from './tables'
import { DefaultLabels } from '@/src/common/defaults'

export async function migrateProjects(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  for (const projectData of allProjects) {
    await updateProject({ ...projectData }, false)
  }
}

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
  workspaceID: number,
  name: string,
  labels: string[],
  flavors: string[],
  userID: number,
  createdAt: Date,
  lastEditedAt: Date,
  favorited: number[],
  apiKeyHash: string | undefined,
  encryptedAPIKey: string | undefined,
  projectID: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: {
    workspaceID,
    name,
    userID,
    createdAt,
    lastEditedAt,
    labels: JSON.stringify(labels),
    flavors: JSON.stringify(flavors),
    favorited: JSON.stringify(favorited),
    apiKeyHash,
    encryptedAPIKey,
  },
  excludeFromIndexes: ['name', 'encryptedAPIKey', 'apiKeyHash', 'labels', 'flavors', 'favorited'],
})

export const toProject = (data: any, userID: number, isOwner: boolean): Project => ({
  id: getID(data),
  name: data.name,
  workspaceID: data.workspaceID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
  favorited: JSON.parse(data.favorited).includes(userID),
  isOwner,
  createdBy: data.userID,
})

async function loadEndpoints(projectID: number, apiKeyDev: string) {
  const endpoints = await getOrderedEntities(Entity.ENDPOINT, 'projectID', projectID)
  const usages = await getEntities(Entity.USAGE, 'projectID', projectID)

  return endpoints
    .map(endpoint => ({
      ...toEndpoint(endpoint),
      url: `${process.env.API_URL || process.env.NEXTAUTH_URL}/${projectID}/${endpoint.urlPath}`,
      apiKeyDev,
      usage: toUsage(usages.find(usage => getID(usage) === getID(endpoint))),
    }))
    .reverse()
}

export async function getActiveProject(userID: number, projectID: number): Promise<ActiveProject> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID)
  const prompts = promptData.map(toPrompt)
  const chainData = await getOrderedEntities(Entity.CHAIN, 'projectID', projectID)
  const chains = chainData.map(toChain)
  const tableData = await getOrderedEntities(Entity.TABLE, 'projectID', projectID)
  const tables = tableData.map(toTable)
  const commentsData = await getOrderedEntities(Entity.COMMENT, 'projectID', projectID)
  const comments = commentsData.map(toComment).reverse()
  const [users, pendingUsers, projectOwners, projectMembers, pendingProjectMembers] = await getProjectAndWorkspaceUsers(
    projectID,
    projectData.workspaceID
  )

  const projectOwner = projectOwners.find(user => user.id === userID)

  return {
    ...toProject(projectData, userID, !!projectOwner),
    availableFlavors: JSON.parse(projectData.flavors),
    endpoints: await loadEndpoints(projectID, projectData.encryptedAPIKey ? decrypt(projectData.encryptedAPIKey) : ''),
    prompts,
    chains,
    tables,
    users,
    pendingUsers,
    projectOwners: projectOwner ? [projectOwner, ...filterObjects(projectOwners, [projectOwner])] : [],
    projectMembers: projectOwner ? projectMembers : [],
    pendingProjectMembers: projectOwner ? pendingProjectMembers : [],
    availableLabels: JSON.parse(projectData.labels),
    comments,
  }
}

const DefaultProjectName = 'New Project'

export async function addProjectForUser(
  userID: number,
  workspaceID: number,
  name = DefaultProjectName
): Promise<number> {
  await ensureWorkspaceAccess(userID, workspaceID)
  const projectNames = await getEntities(Entity.PROJECT, 'workspaceID', workspaceID)
  const uniqueName = GetUniqueName(
    name,
    projectNames.map(project => project.name)
  )
  const projectID = await allocateID(Entity.PROJECT)
  const createdAt = new Date()
  const projectData = toProjectData(
    workspaceID,
    uniqueName,
    DefaultLabels,
    [DefaultEndpointFlavor],
    userID,
    createdAt,
    createdAt,
    [],
    undefined,
    undefined,
    projectID
  )
  const [promptData, versionData] = await addPromptToProject(userID, projectID)
  await getDatastore().save([projectData, promptData, versionData])
  await grantUserAccess(userID, userID, projectID, 'project', 'owner', createdAt)
  return projectID
}

export async function augmentProjectWithNewVersion(
  projectID: number,
  newVersionPrompt: string,
  previousVersionPrompt: string
) {
  const projectData = await getTrustedProjectData(projectID)
  if (
    matchesDefaultName(projectData.name, DefaultProjectName) &&
    !previousVersionPrompt.length &&
    newVersionPrompt.length
  ) {
    const newProjectName = StripVariableSentinels(newVersionPrompt).split(' ').slice(0, 5).join(' ')
    await updateProject({ ...projectData, name: newProjectName }, true)
  }
}

export async function inviteMembersToProject(userID: number, projectID: number, emails: string[]) {
  await ensureProjectAccess(userID, projectID)
  await grantUsersAccess(userID, emails, projectID, 'project')
}

export async function revokeMemberAccessForProject(userID: number, memberID: number, projectID: number) {
  if (userID !== memberID) {
    await ensureProjectOwnership(userID, projectID)
  }
  await revokeUserAccess(memberID, projectID)
}

export async function toggleOwnershipForProject(userID: number, memberID: number, projectID: number, isOwner: boolean) {
  if (userID !== memberID) {
    await ensureProjectOwnership(userID, projectID)
    await grantUserAccess(userID, memberID, projectID, 'project', isOwner ? 'owner' : 'default')
  }
}

async function updateProject(projectData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toProjectData(
      projectData.workspaceID,
      projectData.name,
      JSON.parse(projectData.labels),
      JSON.parse(projectData.flavors),
      projectData.userID,
      projectData.createdAt,
      updateLastEditedTimestamp ? new Date() : projectData.lastEditedAt,
      JSON.parse(projectData.favorited),
      projectData.apiKeyHash,
      projectData.encryptedAPIKey,
      getID(projectData)
    )
  )
}

export const ensureProjectAccess = (userID: number, projectID: number) => getVerifiedUserProjectData(userID, projectID)

export const ensureProjectOwnership = (userID: number, projectID: number) => checkUserOwnership(userID, projectID)

const getTrustedProjectData = (projectID: number) => getKeyedEntity(Entity.PROJECT, projectID)

export const getProjectName = (projectID: number) => getTrustedProjectData(projectID).then(data => data.name)

const getVerifiedUserProjectData = async (userID: number, projectID: number) => {
  const projectData = await getTrustedProjectData(projectID)
  if (!projectData) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    await ensureWorkspaceAccess(userID, projectData.workspaceID)
  }
  return projectData
}

export const getVerifiedUserProjectWorkspaceID = (userID: number, projectID: number) =>
  getVerifiedUserProjectData(userID, projectID).then(projectData => projectData.workspaceID)

export async function tryGetVerifiedAPIProjectWorkspaceID(apiKey: string, projectID: number) {
  const projectData = await getTrustedProjectData(projectID)
  return projectData && projectData.apiKeyHash === hashAPIKey(apiKey) ? projectData.workspaceID : undefined
}

export const getProjectUserForEmail = async (projectID: number, email: string) => {
  const user = await getUserForEmail(email)
  return user && (await hasUserAccess(user.id, projectID)) ? user : undefined
}

// TODO Also call this when deleting prompts/chains or updating endpoints etc.
export async function updateProjectLastEditedAt(projectID: number) {
  const projectData = await getTrustedProjectData(projectID)
  await updateProject(projectData, true)
}

export async function updateProjectName(userID: number, projectID: number, name: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, name }, true)
}

export async function addProjectFlavor(userID: number, projectID: number, flavor: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, flavors: JSON.stringify([...JSON.parse(projectData.flavors), flavor]) }, true)
}

export async function ensureProjectLabels(projectID: number, labels: string[]) {
  const projectData = await getTrustedProjectData(projectID)
  const oldLabels = JSON.parse(projectData.labels) as string[]
  const missingLabels = [...new Set(labels)].filter(label => !oldLabels.includes(label))
  if (missingLabels.length > 0) {
    const newLabels = [...oldLabels, ...missingLabels]
    await updateProject({ ...projectData, labels: JSON.stringify(newLabels) }, true)
  }
}

export async function ensureProjectAPIKey(userID: number, projectID: number): Promise<void> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  if (!projectData.encryptedAPIKey) {
    const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
    const encryptedAPIKey = encrypt(apiKey)
    const apiKeyHash = hashAPIKey(apiKey)
    await updateProject({ ...projectData, encryptedAPIKey, apiKeyHash }, true)
  }
}

export async function toggleFavoriteProject(userID: number, projectID: number, favorited: boolean) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const oldFavorited = JSON.parse(projectData.favorited)
  await updateProject(
    {
      ...projectData,
      favorited: JSON.stringify(
        favorited ? [...oldFavorited, userID] : oldFavorited.filter((id: number) => id !== userID)
      ),
    },
    false
  )
}

export async function updateProjectWorkspace(userID: number, projectID: number, workspaceID: number) {
  await ensureProjectOwnership(userID, projectID)
  await ensureWorkspaceAccess(userID, workspaceID)
  const projectData = await getTrustedProjectData(projectID)
  await updateProject({ ...projectData, workspaceID }, true)
}

export const filterObjects = <T extends { id: number }, U extends { id: number }>(source: T[], filter: U[]) =>
  source.filter(a => !filter.some(b => b.id === a.id))

export async function getSharedProjectsForUser(
  userID: number,
  workspaces: { id: number }[] = []
): Promise<[Project[], PendingProject[]]> {
  const [projects, pendingProjects, ownedProjects] = await getPendingAccessObjects(
    userID,
    'project',
    Entity.PROJECT,
    projectData => toProject(projectData, userID, false)
  )
  projects.forEach(project => (project.isOwner = ownedProjects.some(ownedProject => ownedProject.id === project.id)))
  let workspaceIDs = workspaces.map(workspace => workspace.id)
  if (workspaceIDs.length === 0) {
    const [ownedWorkspaceIDs, accessibleWorkspaceIDs] = await getAccessibleObjectIDs(userID, 'workspace')
    workspaceIDs = [...ownedWorkspaceIDs, ...accessibleWorkspaceIDs]
  }
  return [projects.filter(project => !workspaceIDs.includes(project.workspaceID)), pendingProjects]
}

const getProjectUsers = (projectID: number): Promise<[User[], PendingUser[], User[]]> =>
  getPendingAccessObjects(projectID, 'project', Entity.USER, toUser)

async function getProjectAndWorkspaceUsers(
  projectID: number,
  workspaceID: number
): Promise<[User[], PendingUser[], User[], User[], PendingUser[]]> {
  const [projectUsers, pendingProjectUsers, projectOwners] = await getProjectUsers(projectID)
  const [workspaceUsers, pendingWorkspaceUsers] = await getWorkspaceUsers(workspaceID)

  return [
    [...projectOwners, ...filterObjects(projectUsers, projectOwners), ...filterObjects(workspaceUsers, projectUsers)],
    [
      ...filterObjects(pendingProjectUsers, workspaceUsers),
      ...filterObjects(pendingWorkspaceUsers, [...projectUsers, ...pendingProjectUsers]),
    ],
    projectOwners,
    filterObjects(projectUsers, projectOwners),
    filterObjects(pendingProjectUsers, workspaceUsers),
  ]
}

export async function deleteProjectForUser(userID: number, projectID: number) {
  // TODO warn or even refuse when project has published endpoints
  await ensureProjectOwnership(userID, projectID)
  await deleteEntity(Entity.PROJECT, projectID)
}

export async function getRecentProjects(projects?: Project[], limit = 100): Promise<RecentProject[]> {
  if (!projects) {
    const recentProjectsData = await getRecentEntities(Entity.PROJECT, limit, undefined, undefined, 'lastEditedAt')
    projects = recentProjectsData.map(projectData => toProject(projectData, 0, false))
  }

  const workspacesData = await getKeyedEntities(Entity.WORKSPACE, [
    ...new Set([...projects.map(project => project.workspaceID)]),
  ])

  const usersData = await getKeyedEntities(Entity.USER, [...new Set([...projects.map(project => project.createdBy)])])

  return projects
    .map(project => toRecentProject(project, workspacesData, usersData))
    .sort((a, b) => b.timestamp - a.timestamp)
}

const toRecentProject = (project: Project, workspacesData: any[], usersData: any[]): RecentProject => {
  const workspaceData = workspacesData.find(workspace => getID(workspace) === project.workspaceID)
  const userData = usersData.find(user => getID(user) === project.createdBy)

  return { ...project, workspace: workspaceData.name, creator: userData.fullName }
}

export async function getMetricsForProject(
  projectID: number,
  workspaceID: number,
  before?: Date
): Promise<ProjectMetrics> {
  const promptCount = await getEntityCount(Entity.PROMPT, 'projectID', projectID)
  const chainCount = await getEntityCount(Entity.CHAIN, 'projectID', projectID)
  const endpointCount = await getEntityCount(Entity.ENDPOINT, 'projectID', projectID)

  const analytics = await getAnalyticsForProject(0, projectID, true)

  const [users, pendingUsers] = await getProjectAndWorkspaceUsers(projectID, workspaceID)
  const activeUsers = await getActiveUsers([...users, ...pendingUsers], before)

  return {
    promptCount,
    chainCount,
    endpointCount,
    analytics,
    users: activeUsers.filter(user => users.some(u => u.id === user.id)),
    pendingUsers: activeUsers.filter(user => pendingUsers.some(u => u.id === user.id)),
  }
}
