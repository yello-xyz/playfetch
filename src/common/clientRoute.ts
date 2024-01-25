import { ActiveProject } from '@/types'
import { GetServerSidePropsResult } from 'next'

export const SharedProjectsWorkspaceID = 1

enum ClientRoute {
  Home = '/',
  SharedProjects = `${ClientRoute.Home}?w=${SharedProjectsWorkspaceID}`,
  Settings = '/settings',
  Login = '/login',
  Onboarding = '/onboarding',
  Privacy = '/privacy',
  Admin = '/admin',
}

export const WaitlistRoute = (email: string, provider: string | undefined) =>
  `${ClientRoute.Login}?w=1&e=${encodeURIComponent(email)}&p=${encodeURIComponent(provider ?? '')}`

export const WorkspaceRoute = (workspaceID: number, userID: number) =>
  workspaceID !== userID ? `${ClientRoute.Home}?w=${workspaceID}` : ClientRoute.Home

export const ProjectRoute = (projectID: number) => `${ClientRoute.Home}${projectID}`

export const PromptRoute = (projectID: number, promptID: number) => `${ProjectRoute(projectID)}?p=${promptID}`

export const ChainRoute = (projectID: number, chainID: number) => `${ProjectRoute(projectID)}?c=${chainID}`

export const TableRoute = (projectID: number, tableID: number) => `${ProjectRoute(projectID)}?t=${tableID}`

export const CompareRoute = (projectID: number, itemID?: number, versionID?: number, previousID?: number) =>
  `${ProjectRoute(projectID)}?m=1` +
  `${itemID ? `&i=${itemID}` : ''}${versionID ? `&v=${versionID}` : ''}${previousID ? `&p=${previousID}` : ''}`

export const EndpointsRoute = (projectID: number) => `${ProjectRoute(projectID)}?e=1`

export const NewEndpointRoute = (projectID: number, parentID: number, versionID: number) =>
  `${EndpointsRoute(projectID)}&p=${parentID}&v=${versionID}`

export const LogsRoute = (projectID: number) => `${ProjectRoute(projectID)}?e=1&l=1`

export const Redirect = (route: ClientRoute): GetServerSidePropsResult<Record<string, unknown>> => ({
  redirect: { destination: route, permanent: false },
})

export function ParseQuery(query: NodeJS.Dict<string | string[]>): NodeJS.Dict<string> {
  return Object.keys(query).reduce(function (result: NodeJS.Dict<string>, key) {
    const value = query[key]
    result[key] = Array.isArray(value) ? value[0] : (value as string)
    return result
  }, {})
}

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([key, value]) => [key, value ? mapper(value) : undefined]))

export const ParseNumberQuery = (query: NodeJS.Dict<string | string[]>): NodeJS.Dict<number> =>
  mapDictionary(ParseQuery(query), value => Number(value))

export const ParseEncodedQuery = (query: NodeJS.Dict<string | string[]>): NodeJS.Dict<string> =>
  mapDictionary(ParseQuery(query), value => decodeURIComponent(value))

export const ParseActiveItemQuery = (query: any, project: ActiveProject) => {
  let { p: promptID, c: chainID, t: tableID, m: compare, e: endpoints, s: settings } = ParseNumberQuery(query)
  if (!compare && !endpoints && !settings && !promptID && !chainID && !tableID) {
    if (project.prompts.length > 0) {
      promptID = project.prompts[0].id
    } else {
      chainID = project.chains[0]?.id
    }
  }
  return { promptID, chainID, tableID, compare, endpoints, settings }
}

type ActiveSettingsTab = 'providers' | 'usage' | 'team' | 'connectors' | 'sourceControl' | 'issueTracker'

export const UserSettingsRoute = (activeTab: ActiveSettingsTab = 'providers') =>
  `${ClientRoute.Settings}${activeTab !== 'providers' ? `?t=${activeTab[0]}` : ''}`

export const ProjectSettingsRoute = (projectID: number, activeTab: ActiveSettingsTab = 'providers') =>
  `${ProjectRoute(projectID)}?s=1${activeTab !== 'providers' ? `&t=${activeTab[0]}` : ''}`

export const ParseActiveSettingsTabQuery = (query: any) => {
  const { t: activeTab } = ParseQuery(query)
  switch (activeTab) {
    case 'u':
      return 'usage'
    case 't':
      return 'team'
    case 'c':
      return 'connectors'
    case 's':
      return 'sourceControl'
    case 'i':
      return 'issueTracker'
    default:
      return 'providers'
  }
}

export default ClientRoute
