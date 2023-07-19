const validEmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const CheckValidEmail = (email: string) => !!email.trim().toLowerCase().match(validEmailRegExp)

export const FormatDate = (timestamp: string, alwaysIncludeTime = true) => {
  const toDateString = (date: Date) =>
    date.toLocaleDateString('en', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    })
  const dateString = toDateString(new Date(timestamp))
  const timeString = new Date(timestamp).toLocaleTimeString('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const todayString = toDateString(new Date())
  return dateString === todayString ? timeString : alwaysIncludeTime ? `${dateString} ${timeString}` : dateString
}

export const FormatRelativeDate = (timestamp: string, thresholdDays = 0) => {
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

export const FormatCost = (cost: number) =>
  cost ? `${cost < 0.005 ? '<' : ''}$${Math.max(cost, 0.01).toFixed(2)}` : '$0.00'

export const Truncate = (text: string, length: number) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'

export const ToCamelCase = (s: string) =>
  s.replace(/(?:^\w|[A-Z]|\b\w)/g, (ch, i) => (i === 0 ? ch.toLowerCase() : ch.toUpperCase())).replace(/\s+/g, '')

export const StripPromptSentinels = (prompt: string) => prompt.replaceAll('{{', '').replaceAll('}}', '')

export const ExtractPromptVariables = (prompt: string) => [
  ...new Set([...prompt.matchAll(/{{([^{}]+)}}/g)].map(match => match[1])),
]

export const CheckValidURLPath = (urlPath: string) => {
  const validRegexp = /^[a-zA-Z0-9\-]+$/
  const digitsOnlyRegexp = /^\d*$/

  return urlPath.length > 2 && validRegexp.test(urlPath) && !digitsOnlyRegexp.test(urlPath)
}
