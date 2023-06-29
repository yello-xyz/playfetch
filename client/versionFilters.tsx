import { User, Version } from '@/types'
import clearIcon from '@/public/clear.svg'

type UserFilter = { userID: number }
type LabelFilter = { label: string }
type TextFilter = { text: string }

export type VersionFilter = UserFilter | LabelFilter | TextFilter

const isUserFilter = (filter: VersionFilter): filter is UserFilter => 'userID' in (filter as UserFilter)
const isLabelFilter = (filter: VersionFilter): filter is LabelFilter => 'label' in (filter as LabelFilter)
const isTextFilter = (filter: VersionFilter): filter is TextFilter => 'text' in (filter as TextFilter)

export const BuildVersionFilter = (filters: VersionFilter[]) => (version: Version) => {
  const userIDs = filters.filter(isUserFilter).map(filter => filter.userID)
  const userFilter = (version: Version) => !userIDs.length || userIDs.includes(version.userID)

  const labels = filters.filter(isLabelFilter).map(filter => filter.label)
  const labelFilter = (version: Version) => !labels.length || version.labels.some(label => labels.includes(label))

  const textStrings = filters.filter(isTextFilter).map(filter => filter.text.toLowerCase())
  const textFilter = (version: Version) =>
    !textStrings.length || textStrings.every(filter => version.prompt.toLowerCase().includes(filter))

  return userFilter(version) && labelFilter(version) && textFilter(version)
}

export default function VersionFilters({
  users,
  labelColors,
  versions,
  filters,
  setFilters,
}: {
  users: User[]
  labelColors: Record<string, string>
  versions: Version[]
  filters: VersionFilter[]
  setFilters: (filters: VersionFilter[]) => void
}) {
  return (
    <div className='flex items-start justify-between w-full gap-2'>
      <div className='flex flex-wrap flex-grow gap-2 text-xs text-gray-800'>
        {filters.map((filter, index) => (
          <FilterCell
            key={index}
            filter={filter}
            labelColors={labelColors}
            onClick={() => setFilters(filters.filter((_, i) => i !== index))}
          />
        ))}
        {filters.length > 1 && (
          <div
            className='px-2 py-1 border border-gray-300 border-dashed rounded-md cursor-pointer'
            onClick={() => setFilters([])}>
            clear filters
          </div>
        )}
      </div>
      <input
        className='flex-grow p-2 mb-4 text-sm bg-white border border-gray-300 rounded-lg'
        type='text'
        value={filters.map(filter => ('text' in filter ? filter.text : '')).join(' ')}
        onChange={event => setFilters(event.target.value.length ? [{ text: event.target.value }] : [])}
        placeholder='Filter'
      />
    </div>
  )
}

function FilterCell({
  filter,
  labelColors,
  onClick,
}: {
  filter: VersionFilter
  labelColors: Record<string, string>
  onClick: () => void
}) {
  return (
    <div className='flex items-center gap-1 p-1 pl-2 border border-gray-300 rounded-md'>
      {isTextFilter(filter) && <>contains: “{filter.text}”</>}
      {isLabelFilter(filter) && (
        <>
          label: <div className={`w-1.5 h-1.5 rounded-full ${labelColors[filter.label]}`} />
          {filter.label}
        </>
      )}
      <img className='w-[18px] h-[18px] cursor-pointer' src={clearIcon.src} onClick={onClick} />
    </div>
  )
}
