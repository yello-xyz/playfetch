const validEmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const CheckValidEmail = (email: string) => !!email.toLowerCase().match(validEmailRegExp)

export const FormatDate = (timestamp: string, previousTimestamp?: string) => {
  const dateString = new Date(timestamp).toLocaleDateString()
  const timeString = new Date(timestamp).toLocaleTimeString()
  const previousDateString = previousTimestamp ? new Date(previousTimestamp).toLocaleDateString() : undefined
  const todayString = new Date().toLocaleDateString()
  return dateString === previousDateString || dateString === todayString ? timeString : `${dateString} ${timeString}`
}

export const FormatRelativeDate = (timestamp: string) => {
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 365 * day },
    { unit: 'month', ms: 30 * day },
    { unit: 'week', ms: 7 * day },
    { unit: 'day', ms: day },
    { unit: 'hour', ms: hour },
    { unit: 'minute', ms: minute },
  ]

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' })
  const elapsed = new Date(timestamp).getTime() - new Date().getTime()

  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) > ms) {
      return formatter.format(Math.round(elapsed / ms), unit)
    }
  }

  return 'just now'
}

export const Truncate = (text: string, length: number) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'

export const ToCamelCase = (s: string) =>
  s.replace(/(?:^\w|[A-Z]|\b\w)/g, (ch, i) => (i === 0 ? ch.toLowerCase() : ch.toUpperCase())).replace(/\s+/g, '')

export const StripPromptSentinels = (prompt: string) => prompt.replaceAll('{{', '').replaceAll('}}', '')

export const ExtractPromptVariables = (prompt: string) => [
  ...new Set(prompt.match(/{{(.*?)}}/g)?.map(match => match.replace(/{{(.*?)}}/g, '$1')) ?? []),
]

export const ProjectNameToURLPath = (projectName: string) => projectName.replaceAll(' ', '-').toLowerCase()

export const CheckValidURLPath = (urlPath: string) => {
  const validRegexp = /^[a-zA-Z0-9\-]+$/
  const digitsOnlyRegexp = /^\d*$/

  return urlPath.length > 2 && validRegexp.test(urlPath) && !digitsOnlyRegexp.test(urlPath)
}
