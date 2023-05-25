import { GetServerSidePropsResult } from 'next'
import { NextRouter } from 'next/router'

enum ClientRoute {
  Home = '/',
  Login = '/login',
}

export const Redirect = (route: ClientRoute): GetServerSidePropsResult<Record<string, unknown>> => ({
  redirect: { destination: route, permanent: false },
})

export function ParseQuery(query: NodeJS.Dict<string | string[]>): any {
  return Object.keys(query).reduce(function (result: NodeJS.Dict<string>, key) {
    const value = query[key]
    result[key] = Array.isArray(value) ? value[0] : (value as string)
    return result
  }, {})
}

export default ClientRoute
