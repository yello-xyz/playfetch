import { SupportsFunctionsPrompt, SupportsSystemPrompt } from '@/src/common/providerMetadata'
import { PromptConfig, Prompts } from '@/types'

const validEmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const CheckValidEmail = (email: string) => !!email.trim().toLowerCase().match(validEmailRegExp)

const isValidTimestamp = (timestamp: number) =>
  timestamp > 0 && timestamp < Number.MAX_VALUE && !Number.isNaN(timestamp)

export const FormatDate = (timestamp: number, alwaysIncludeTime = true, alwaysIncludeDate = false) => {
  if (!isValidTimestamp(timestamp)) {
    return '?'
  }

  const toDateString = (date: Date) =>
    date.toLocaleDateString('en', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    })
  const date = new Date(timestamp)
  const dateString = toDateString(date)
  const timeString = date.toLocaleTimeString('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const todayString = toDateString(new Date())
  return !alwaysIncludeDate && dateString === todayString
    ? timeString
    : alwaysIncludeTime
    ? `${dateString} ${timeString}`
    : dateString
}

export const FormatRelativeDate = (timestamp: number, thresholdDays = 0) => {
  if (!isValidTimestamp(timestamp)) {
    return '?'
  }

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  const elapsed = new Date(timestamp).getTime() - new Date().getTime()

  if (thresholdDays > 0 && Math.abs(elapsed) > thresholdDays * day) {
    return FormatDate(timestamp, false)
  }

  const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 365 * day },
    { unit: 'month', ms: 30 * day },
    { unit: 'week', ms: 7 * day },
    { unit: 'day', ms: day },
    { unit: 'hour', ms: hour },
    { unit: 'minute', ms: minute },
  ]

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' })

  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) > ms) {
      return formatter.format(Math.round(elapsed / ms), unit)
    }
  }

  return 'just now'
}

export const FormatLargeInteger = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const FormatCost = (cost: number) =>
  cost ? `${cost < 0.005 ? '<' : ''}$${Math.max(cost, 0.01).toFixed(2)}` : '$0.00'

export const FormatDuration = (durationInSeconds: number) =>
  durationInSeconds < 1
    ? `${durationInSeconds < 0.0005 ? '<' : ''}${Math.max(durationInSeconds * 1000, 1).toFixed(0)}ms`
    : durationInSeconds.toFixed(2) + 's'

export const Truncate = (text: string, length: number) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'

export const Capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

export const ToCamelCase = (s: string) =>
  s.replace(/(?:^\w|[A-Z]|\b\w)/g, (ch, i) => (i === 0 ? ch.toLowerCase() : ch.toUpperCase())).replace(/\s+/g, '')

export const StripVariableSentinels = (text: string) => text.replaceAll('{{', '').replaceAll('}}', '')

export const ExtractVariables = (text: string) => [
  ...new Set([...text.matchAll(/{{([^{}]+)}}/g)].map(match => match[1])),
]

const TryParseJSON = (text: string) => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const ExtractFunctionNames = (text: string) => {
  const json = TryParseJSON(text)
  return Array.isArray(json) ? json.map(item => item?.name as string).filter(name => name) : []
}

export const ExtractFunctionName = (run: { output: string }) => {
  const json = TryParseJSON(run.output)
  return json?.function?.name as string
}

export const ExtractPromptVariables = (prompts: Prompts, config: PromptConfig, includingDynamic = true) => [
  ...ExtractVariables(prompts.main),
  ...(SupportsSystemPrompt(config.model) && prompts.system ? ExtractVariables(prompts.system) : []),
  ...(SupportsFunctionsPrompt(config.model) && prompts.functions
    ? [...ExtractVariables(prompts.functions), ...(includingDynamic ? ExtractFunctionNames(prompts.functions) : [])]
    : []),
]

export const CheckValidURLPath = (urlPath: string) => {
  const validRegexp = /^[a-zA-Z0-9\-]+$/
  const digitsOnlyRegexp = /^\d*$/

  return urlPath.length > 2 && validRegexp.test(urlPath) && !digitsOnlyRegexp.test(urlPath)
}
