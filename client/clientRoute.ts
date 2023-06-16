import { Endpoint } from '@/types'
import { GetServerSidePropsResult } from 'next'
import { NextRouter } from 'next/router'

enum ClientRoute {
  Home = '/',
  Login = '/login',
}

export const Redirect = (route: ClientRoute): GetServerSidePropsResult<Record<string, unknown>> => ({
  redirect: { destination: route, permanent: false },
})

export const ProjectRoute = (projectID?: number) =>
  projectID ? `${ClientRoute.Home}?g=${projectID}` : ClientRoute.Home

export const PromptRoute = (promptID?: number) => (promptID ? `${ClientRoute.Home}?p=${promptID}` : ClientRoute.Home)

export const EndpointUIRoute = (endpoint: Endpoint) => {
  return `/ui/${endpoint.token}/${endpoint.projectURLPath}/${endpoint.urlPath}`
}

export function ParseQuery(query: NodeJS.Dict<string | string[]>): NodeJS.Dict<string> {
  return Object.keys(query).reduce(function (result: NodeJS.Dict<string>, key) {
    const value = query[key]
    result[key] = Array.isArray(value) ? value[0] : (value as string)
    return result
  }, {})
}

export default ClientRoute
