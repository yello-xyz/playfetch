import { NextRouter } from "next/router"

enum ClientRoute {
  Home = '/',
  Login = '/login',
}

export function ParseQuery(query: NodeJS.Dict<string | string[]>): any {
  return Object.keys(query).reduce(function (result: NodeJS.Dict<string>, key) {
    const value = query[key]
    result[key] = Array.isArray(value) ? value[0] : (value as string)
    return result
  }, {})
}

export default ClientRoute
