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

export const BuildUniqueName = (name: string, existingNames: string[]) => {
  let uniqueName = name
  let counter = 2
  while (existingNames.includes(uniqueName)) {
    uniqueName = `${name} ${counter++}`
  }
  return uniqueName
}

export const Truncate = (text: string, length: number) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'
