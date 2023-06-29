import { User, Version } from '@/types'

export type VersionFilter = { user: User } | { label: string } | { text: string }

export const BuildVersionFilter = (filters: VersionFilter[]) => (version: Version) => {
  const userFilters = filters.filter(filter => 'user' in filter).map(filter => (filter as { user: User }).user)
  const userFilter = (version: Version) => !userFilters.length || userFilters.some(user => user.id === version.userID)

  const labelFilters = filters.filter(filter => 'label' in filter).map(filter => (filter as { label: string }).label)
  const labelFilter = (version: Version) =>
    !labelFilters.length || version.labels.some(label => labelFilters.includes(label))

  const textFilters = filters
    .filter(filter => 'text' in filter)
    .map(filter => (filter as { text: string }).text.toLowerCase())
  const textFilter = (version: Version) =>
    !textFilters.length || textFilters.every(filter => version.prompt.toLowerCase().includes(filter))

  return userFilter(version) && labelFilter(version) && textFilter(version)
}

export default function VersionFilters({
  versions,
  filters,
  setFilters,
}: {
  versions: Version[]
  filters: VersionFilter[]
  setFilters: (filters: VersionFilter[]) => void
}) {
  return (
    <input
      className='flex-grow p-2 mb-4 text-sm bg-white border border-gray-300 rounded-lg'
      type='text'
      value={filters.map(filter => ('text' in filter ? filter.text : '')).join(' ')}
      onChange={event => setFilters(event.target.value.length ? [{ text: event.target.value }] : [])}
      placeholder='Filter'
    />
  )
}
