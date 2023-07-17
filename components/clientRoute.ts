import { GetServerSidePropsResult } from 'next'

enum ClientRoute {
  Home = '/',
  Settings = `${ClientRoute.Home}?s=1`,
  Login = '/login',
  Admin = '/admin',
}

export const ProjectRoute = (projectID: number) => `${ClientRoute.Home}?g=${projectID}`

export const ChainsRoute = (projectID: number) => `${ClientRoute.Home}?g=${projectID}&c=1`

export const PromptRoute = (promptID: number) => `${ClientRoute.Home}?p=${promptID}`

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

export default ClientRoute
