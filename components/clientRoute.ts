import { GetServerSidePropsResult } from 'next'

enum ClientRoute {
  Home = '/',
  Settings = `${ClientRoute.Home}?s=1`,
  Login = '/login',
  Admin = '/admin',
}

export const WorkspaceRoute = (workspaceID: number, userID: number) =>
  workspaceID !== userID ? `${ClientRoute.Home}?w=${workspaceID}` : ClientRoute.Home

export const ProjectRoute = (projectID: number) => `${ClientRoute.Home}${projectID}`

export const ChainRoute = (projectID: number, chainID: number) => `${ProjectRoute(projectID)}?c=${chainID}`

export const PromptRoute = (projectID: number, promptID: number) => `${ProjectRoute(projectID)}?p=${promptID}`

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
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const ParseNumberQuery = (query: NodeJS.Dict<string | string[]>): NodeJS.Dict<number> =>
  mapDictionary(ParseQuery(query), value => Number(value))

export default ClientRoute
