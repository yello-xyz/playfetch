import { ActiveUser, IsRawPromptVersion, PromptConfig, User, UserMetrics } from '@/types'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getEntity,
  getEntityCount,
  getFilteredEntityCount,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { addWorkspaceForUser, getWorkspacesForUser } from './workspaces'
import { uploadImageURLToStorage } from '../storage'
import { getRecentVersions } from './versions'
import { getRecentComments } from './comments'
import { getRecentEndpoints } from './endpoints'
import { and } from '@google-cloud/datastore'
import { getRecentProjects, getSharedProjectsForUser } from './projects'
import { getRecentRuns } from './runs'
import { DefaultPromptConfig, DefaultLayoutConfig } from '@/src/common/defaultConfig'
import { ValidatePromptConfig } from '@/src/common/providerMetadata'
import { LayoutConfig, UserPresets } from '@/src/common/userPresets'

export async function migrateUsers(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allUsers] = await datastore.runQuery(datastore.createQuery(Entity.USER))
  for (const userData of allUsers) {
    await getDatastore().save(
      toUserData(
        userData.email,
        userData.fullName,
        userData.imageURL,
        userData.hasAccess,
        userData.didCompleteOnboarding,
        userData.isAdmin,
        userData.createdAt,
        userData.lastLoginAt,
        userData.presets ? JSON.parse(userData.presets) : undefined,
        getID(userData)
      )
    )
  }
}

const updateUserData = (userData: any) =>
  toUserData(
    userData.email,
    userData.fullName,
    userData.imageURL,
    userData.hasAccess,
    userData.didCompleteOnboarding,
    userData.isAdmin,
    userData.createdAt,
    userData.lastLoginAt,
    userData.presets ? JSON.parse(userData.presets) : undefined,
    getID(userData)
  )

const updateUser = (userData: any) => getDatastore().save(updateUserData(userData))

const toUserData = (
  email: string,
  fullName: string,
  imageURL: string,
  hasAccess: boolean,
  didCompleteOnboarding: boolean,
  isAdmin: boolean,
  createdAt: Date,
  lastLoginAt?: Date,
  presets?: any,
  userID?: number
) => ({
  key: buildKey(Entity.USER, userID),
  data: {
    email,
    fullName,
    imageURL,
    hasAccess,
    didCompleteOnboarding,
    isAdmin,
    createdAt,
    lastLoginAt,
    presets: presets ? JSON.stringify(presets) : undefined,
  },
  excludeFromIndexes: ['fullName', 'imageURL', 'presets'],
})

export const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  fullName: data.fullName,
  imageURL: data.imageURL,
  isAdmin: data.isAdmin,
  lastLoginAt: getTimestamp(data, 'lastLoginAt') ?? null,
  didCompleteOnboarding: data.didCompleteOnboarding ?? true,
})

export const getUserForID = (userID: number) => getKeyedEntity(Entity.USER, userID).then(toUser)

export async function getUserForEmail(email: string, includingWithoutAccess = false) {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData && (includingWithoutAccess || userData.hasAccess) ? toUser(userData) : undefined
}

const getUserData = (userID: number) => getKeyedEntity(Entity.USER, userID)

const ensureUserData = async (userID: number) => {
  const userData = await getUserData(userID)
  if (!userData) {
    throw new Error(`User with ID ${userID} does not exist or user has no access`)
  }
  return userData
}

const loadFilteredPresets = <T extends object>(userData: any, keys: (keyof T)[]): [Partial<T>, any] => {
  const presetEntries = Object.entries(userData.presets ? JSON.parse(userData.presets) : {})
  const [filteredEntries, otherEntries] = presetEntries.reduce(
    ([pass, fail], entry) => (keys.includes(entry[0] as keyof T) ? [[...pass, entry], fail] : [pass, [...fail, entry]]),
    [[], []] as [[string, unknown][], [string, unknown][]]
  )
  return [Object.fromEntries(filteredEntries) as Partial<T>, Object.fromEntries(otherEntries)]
}

const promptConfigKeys: (keyof PromptConfig)[] = ['model', 'isChat', 'temperature', 'maxTokens', 'seed', 'jsonMode']
const layoutConfigKeys: (keyof LayoutConfig)[] = ['floatingSidebar', 'promptTabs']

const filterOptionalKeys = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T

const ensureValidPromptConfig = (config: PromptConfig) => filterOptionalKeys(ValidatePromptConfig(config))

export async function getPresetsForUser(userID: number): Promise<UserPresets> {
  const userData = await getUserData(userID)
  const [userPromptConfig] = loadFilteredPresets(userData, promptConfigKeys)
  const [userLayoutConfig] = loadFilteredPresets(userData, layoutConfigKeys)
  return {
    defaultPromptConfig: ensureValidPromptConfig({ ...DefaultPromptConfig, ...userPromptConfig }),
    layoutConfig: { ...DefaultLayoutConfig, ...userLayoutConfig },
  }
}

export async function saveDefaultPromptConfigForUser(userID: number, config: Partial<PromptConfig>) {
  const userData = await ensureUserData(userID)
  const [previousConfig, otherPresets] = loadFilteredPresets(userData, promptConfigKeys)
  const userConfig = config.model ? { ...previousConfig, ...config } : { model: previousConfig.model, ...config }
  await updateUser({ ...userData, presets: JSON.stringify({ ...userConfig, ...otherPresets }) })

  return ensureValidPromptConfig({ ...DefaultPromptConfig, ...userConfig })
}

export async function saveLayoutConfigForUser(userID: number, config: Partial<LayoutConfig>) {
  const userData = await getUserData(userID)
  const [previousConfig, otherPresets] = loadFilteredPresets(userData, layoutConfigKeys)
  const userConfig = { ...previousConfig, ...config }
  await updateUser({ ...userData, presets: JSON.stringify({ ...userConfig, ...otherPresets }) })

  return { ...DefaultLayoutConfig, ...userConfig }
}

export async function markUserAsOnboarded(userID: number) {
  const userData = await getUserData(userID)
  if (userData) {
    await updateUser({ ...userData, didCompleteOnboarding: true })
  }
}

export async function markUserLogin(userID: number, fullName: string, imageURL: string) {
  const userData = await getUserData(userID)
  if (userData) {
    if (imageURL.length) {
      imageURL = await uploadImageURLToStorage(userID.toString(), imageURL)
    }
    await updateUser({
      ...userData,
      fullName: fullName.length ? fullName : userData.fullName,
      imageURL: imageURL.length ? imageURL : userData.imageURL,
      lastLoginAt: new Date(),
    })
  }
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, fullName: string, hasAccess = false, isAdmin = false) {
  const previousUserData = await getEntity(Entity.USER, 'email', email)
  const userData = toUserData(
    email.trim().toLowerCase(),
    (fullName.length ? fullName : email).trim(),
    previousUserData?.imageURL ?? '',
    hasAccess,
    previousUserData?.didCompleteOnboarding ?? false,
    isAdmin,
    hasAccess ? previousUserData?.createdAt ?? new Date() : new Date(),
    previousUserData?.lastLoginAt,
    previousUserData?.presets ? JSON.parse(previousUserData.presets) : undefined,
    previousUserData ? getID(previousUserData) : undefined
  )
  await getDatastore().save(userData)
  if (hasAccess && (!previousUserData || !previousUserData.hasAccess)) {
    const userID = getID(userData)
    await addWorkspaceForUser(userID)
    await addWorkspaceForUser(userID, 'My first workspace')
  }
  return !previousUserData
}

// Admin functionality below

export async function getUsersWithoutAccess() {
  const usersData = await getOrderedEntities(Entity.USER, 'hasAccess', false)
  return usersData.map(toUser)
}

export async function getActiveUsers(users?: User[], before?: Date, limit = 100): Promise<ActiveUser[]> {
  const recentVersions = await getRecentVersions(before, limit)
  const since = new Date(recentVersions.slice(-1)[0]?.timestamp ?? 0)

  const recentRuns = recentVersions.length > 0 ? await getRecentRuns(since, before, limit) : []
  const recentComments = recentVersions.length > 0 ? await getRecentComments(since, before, limit) : []
  const recentEndpoints = recentVersions.length > 0 ? await getRecentEndpoints(since, before, limit) : []

  if (!users) {
    const usersData = await getKeyedEntities(Entity.USER, [
      ...new Set([
        ...recentRuns.map(run => run.userID),
        ...recentVersions.map(version => version.userID),
        ...recentComments.map(comment => comment.userID),
        ...recentEndpoints.map(endpoint => endpoint.userID),
      ]),
    ])
    users = usersData.map(toUser)
  }

  return users
    .map(user => toActiveUser(user, recentVersions, recentRuns, recentComments, recentEndpoints))
    .sort((a, b) => b.lastActive - a.lastActive)
}

const toActiveUser = (
  user: User,
  recentVersions: Awaited<ReturnType<typeof getRecentVersions>>,
  recentRuns: Awaited<ReturnType<typeof getRecentRuns>>,
  recentComments: Awaited<ReturnType<typeof getRecentComments>>,
  recentEndpoints: Awaited<ReturnType<typeof getRecentEndpoints>>
): ActiveUser => {
  const userVersions = recentVersions.filter(version => version.userID === user.id)
  const versionCount = userVersions.length

  const userRuns = recentRuns.filter(run => run.userID === user.id)
  const runCount = userRuns.length

  const userComments = recentComments.filter(comment => comment.userID === user.id)
  const commentCount = userComments.length

  const userEndpoints = recentEndpoints.filter(endpoint => endpoint.userID === user.id)
  const endpointCount = userEndpoints.length

  const fallback = user.lastLoginAt ?? 0
  const lastActive = Math.max(
    ...[
      userVersions[0]?.timestamp ?? fallback,
      userRuns[0]?.timestamp ?? fallback,
      userComments[0]?.timestamp ?? fallback,
      userEndpoints[0]?.timestamp ?? fallback,
    ]
  )
  const startTimestamp = Math.min(
    ...[
      userVersions.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
      userRuns.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
      userComments.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
      userEndpoints.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
    ]
  )

  const promptVersions = userVersions.filter(IsRawPromptVersion)
  const promptCount = new Set(promptVersions.map(version => version.parentID)).size
  const chainVersions = userVersions.filter(version => !IsRawPromptVersion(version))
  const chainCount = new Set(chainVersions.map(version => version.parentID)).size

  return {
    ...user,
    lastActive,
    startTimestamp,
    commentCount,
    endpointCount,
    versionCount,
    runCount,
    promptCount,
    chainCount,
  }
}

export async function getMetricsForUser(userID: number): Promise<UserMetrics> {
  const createdWorkspaceCount = await getEntityCount(Entity.WORKSPACE, 'userID', userID)
  const workspaceAccessCount = await getFilteredEntityCount(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', 'workspace')])
  )
  const projectAccessCount = await getFilteredEntityCount(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', 'project')])
  )

  const [workspaces, pendingWorkspaces] = await getWorkspacesForUser(userID)

  const [sharedProjects, pendingSharedProjects] = await getSharedProjectsForUser(userID, workspaces)
  const sharedProjectsAsRecent = await getRecentProjects(sharedProjects)
  const pendingSharedProjectsAsRecent = await getRecentProjects(pendingSharedProjects)

  const getTimestamps = (type: string, userID: number) =>
    getDatastore().runQuery(getDatastore().createQuery(type).filter(buildFilter('userID', userID)).select('createdAt'))

  const [versionsData] = await getTimestamps(Entity.VERSION, userID)
  const [runsData] = await getTimestamps(Entity.RUN, userID)
  const [commentsData] = await getTimestamps(Entity.COMMENT, userID)
  const [endpointsData] = await getTimestamps(Entity.ENDPOINT, userID)

  const toDay = (timestamp: number) => new Date(timestamp).setUTCHours(0, 0, 0, 0)
  const today = toDay(new Date().getTime())
  const millisecondsInDay = 24 * 60 * 60 * 1000
  const daysAgo = (timestamp: number) => (today - toDay(timestamp)) / millisecondsInDay

  const versionTimestamps = versionsData.map(({ createdAt }) => daysAgo(createdAt / 1000))
  const runTimestamps = runsData.map(({ createdAt }) => daysAgo(createdAt / 1000))
  const commentTimestamps = commentsData.map(({ createdAt }) => daysAgo(createdAt / 1000))
  const endpointTimestamps = endpointsData.map(({ createdAt }) => daysAgo(createdAt / 1000))

  const maxDaysAgo = Math.max(...versionTimestamps, ...runTimestamps, ...commentTimestamps, ...endpointTimestamps)
  const activity = Array.from({ length: maxDaysAgo + 1 }, (_, daysAgo) => ({
    timestamp: today - (maxDaysAgo - daysAgo) * millisecondsInDay,
    versions: 0,
    runs: 0,
    comments: 0,
    endpoints: 0,
  }))
  versionTimestamps.forEach(daysAgo => activity[maxDaysAgo - daysAgo].versions++)
  runTimestamps.forEach(daysAgo => activity[maxDaysAgo - daysAgo].runs++)
  commentTimestamps.forEach(daysAgo => activity[maxDaysAgo - daysAgo].comments++)
  endpointTimestamps.forEach(daysAgo => activity[maxDaysAgo - daysAgo].endpoints++)

  const providersData = await getEntities(Entity.PROVIDER, 'scopeID', userID)
  const providers = providersData.map(providerData => providerData.provider)

  return {
    createdWorkspaceCount,
    workspaceAccessCount,
    projectAccessCount,
    activity,
    providers,
    sharedProjects: sharedProjectsAsRecent,
    pendingSharedProjects: pendingSharedProjectsAsRecent,
    workspaces,
    pendingWorkspaces,
  }
}
