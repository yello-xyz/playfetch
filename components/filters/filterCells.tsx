import { User } from '@/types'
import clearIcon from '@/public/clear.svg'
import UserAvatar from '@/components/users/userAvatar'
import Icon from '../icon'
import { Filter, IsLabelFilter, IsTextFilter, IsUserFilter, LabelFilter, TextFilter, UserFilter } from './filters'

export default function FilterCells<SortOption extends string>({
  users,
  labelColors,
  filters,
  setFilters,
  sortOptions = [],
  activeSortOption,
  setActiveSortOption,
}: {
  users: User[]
  labelColors: Record<string, string>
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOptions?: SortOption[]
  activeSortOption?: SortOption
  setActiveSortOption?: (option: SortOption) => void
}) {
  const isCustomSortOption = sortOptions.length > 0 && activeSortOption && activeSortOption !== sortOptions[0]
  const hasFilters = filters.length > 0 || isCustomSortOption
  const markup = hasFilters ? 'border-b border-gray-200 py-2' : ''
  const resetSortOption = () => setActiveSortOption && setActiveSortOption(sortOptions[0])
  const resetFilters = () => {
    setFilters([])
    resetSortOption()
  }

  return (
    <div className={`flex flex-wrap flex-1 gap-2 mx-4 text-xs text-gray-700 ${markup}`}>
      {filters.map((filter, index) => (
        <FilterCell
          key={index}
          filter={filter}
          users={users}
          labelColors={labelColors}
          onClick={() => setFilters(filters.filter((_, i) => i !== index))}
        />
      ))}
      {isCustomSortOption && (
        <FilterCell filter={activeSortOption} users={users} labelColors={labelColors} onClick={resetSortOption} />
      )}
      {hasFilters && (
        <div
          className='px-2 py-1 border border-gray-300 border-dashed rounded-md cursor-pointer'
          onClick={resetFilters}>
          clear filters
        </div>
      )}
    </div>
  )
}

function FilterCell<SortOption extends string>({
  filter,
  users,
  labelColors,
  onClick,
}: {
  filter: Filter | SortOption
  users: User[]
  labelColors: Record<string, string>
  onClick: () => void
}) {
  return (
    <div className='flex items-center gap-1 p-1 pl-2 border border-gray-300 rounded-md'>
      {typeof filter === 'string' ? (
        <SortOptionCell option={filter} />
      ) : (
        <>
          {IsTextFilter(filter) && <TextFilterCell filter={filter} />}
          {IsLabelFilter(filter) && <LabelFilterCell filter={filter} labelColors={labelColors} />}
          {IsUserFilter(filter) && <UserFilterCell filter={filter} users={users} />}
        </>
      )}
      <Icon className='cursor-pointer' icon={clearIcon} onClick={onClick} />
    </div>
  )
}

const SortOptionCell = <SortOption extends string>({ option }: { option: SortOption }) => <>sort by: {option}</>

const TextFilterCell = ({ filter }: { filter: TextFilter }) => <>contains: “{filter.text}”</>

const LabelFilterCell = ({ filter, labelColors }: { filter: LabelFilter; labelColors: Record<string, string> }) => (
  <>
    label: <div className={`w-1.5 h-1.5 rounded-full ${labelColors[filter.label]}`} />
    {filter.label}
  </>
)

const UserFilterCell = ({ filter, users }: { filter: UserFilter; users: User[] }) => {
  const user = users.find(user => user.id === filter.userID)
  return user ? (
    <>
      created by: <UserAvatar user={user} size='xs' />
      {user.fullName}
    </>
  ) : null
}
