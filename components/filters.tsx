import { User } from '@/types'
import clearIcon from '@/public/clear.svg'
import filterIcon from '@/public/filter.svg'
import chevronIcon from '@/public/chevron.svg'
import userIcon from '@/public/user.svg'
import labelIcon from '@/public/label.svg'
import textIcon from '@/public/text.svg'
import checkIcon from '@/public/check.svg'
import UserAvatar from '@/components/users/userAvatar'
import { ReactNode, useRef, useState } from 'react'
import PopupMenu, { PopupSectionTitle } from './popupMenu'
import Icon from './icon'
import { StaticImageData } from 'next/image'

type UserFilter = { userID: number }
type LabelFilter = { label: string }
type TextFilter = { text: string }

export type Filter = UserFilter | LabelFilter | TextFilter
export type FilterItem = { userIDs: number[]; labels: string[]; contents: string[] }

const isUserFilter = (filter: Filter): filter is UserFilter => 'userID' in filter
const isLabelFilter = (filter: Filter): filter is LabelFilter => 'label' in filter
const isTextFilter = (filter: Filter): filter is TextFilter => 'text' in filter

const userIDsFromFilters = (filters: Filter[]) => filters.filter(isUserFilter).map(filter => filter.userID)
const labelsFromFilters = (filters: Filter[]) => filters.filter(isLabelFilter).map(filter => filter.label)
const contentsFromFilters = (filters: Filter[]) => filters.filter(isTextFilter).map(filter => filter.text.toLowerCase())

export const BuildFilter = (filters: Filter[]) => (item: FilterItem) => {
  const userIDs = userIDsFromFilters(filters)
  const itemUserIDs = [...new Set(item.userIDs)]
  const passedUserFilter = !userIDs.length || itemUserIDs.some(userID => userIDs.includes(userID))

  const labels = labelsFromFilters(filters)
  const itemLabels = [...new Set(item.labels)]
  const passesLabelFilter = !labels.length || itemLabels.some(label => labels.includes(label))

  const contents = contentsFromFilters(filters)
  const itemContents = [...new Set(item.contents.map(content => content.toLowerCase()))]
  const passesTextFilter =
    !contents.length || contents.every(filter => itemContents.some(content => content.includes(filter)))

  return passedUserFilter && passesLabelFilter && passesTextFilter
}

export default function Filters<SortOption extends string>({
  users,
  labelColors,
  items,
  filters,
  setFilters,
  sortOptions = [],
  activeSortOption,
  setActiveSortOption,
  tabSelector,
}: {
  users: User[]
  labelColors: Record<string, string>
  items: FilterItem[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOptions?: SortOption[]
  activeSortOption?: SortOption
  setActiveSortOption?: (option: SortOption) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const markup = filters.length > 0 ? 'border-b border-gray-200 mb-4 py-2' : ''

  return (
    <div className='z-10 flex flex-col'>
      {tabSelector(
        <FilterButton
          users={users}
          labelColors={labelColors}
          items={items}
          filters={filters}
          setFilters={setFilters}
          sortOptions={sortOptions}
          activeSortOption={activeSortOption}
          setActiveSortOption={setActiveSortOption}
        />
      )}
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
        {filters.length > 1 && (
          <div
            className='px-2 py-1 border border-gray-300 border-dashed rounded-md cursor-pointer'
            onClick={() => setFilters([])}>
            clear filters
          </div>
        )}
      </div>
    </div>
  )
}

function FilterCell({
  filter,
  users,
  labelColors,
  onClick,
}: {
  filter: Filter
  users: User[]
  labelColors: Record<string, string>
  onClick: () => void
}) {
  return (
    <div className='flex items-center gap-1 p-1 pl-2 border border-gray-300 rounded-md'>
      {isTextFilter(filter) && <TextFilterCell filter={filter} />}
      {isLabelFilter(filter) && <LabelFilterCell filter={filter} labelColors={labelColors} />}
      {isUserFilter(filter) && <UserFilterCell filter={filter} users={users} />}
      <Icon className='cursor-pointer' icon={clearIcon} onClick={onClick} />
    </div>
  )
}

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

function FilterButton<SortOption extends string>({
  users,
  labelColors,
  items: items,
  filters,
  setFilters,
  sortOptions = [],
  activeSortOption,
  setActiveSortOption,
}: {
  users: User[]
  labelColors: Record<string, string>
  items: FilterItem[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOptions?: SortOption[]
  activeSortOption?: SortOption
  setActiveSortOption?: (option: SortOption) => void
}) {
  const activeUserIDs = userIDsFromFilters(filters)
  const itemUserIDs = items.flatMap(item => item.userIDs)
  const countForUserID = (userID: number) => itemUserIDs.filter(id => id === userID).length
  const availableUsers = users.filter(
    user => !activeUserIDs.includes(user.id) && countForUserID(user.id) > 0 && countForUserID(user.id) < items.length
  )

  const activeLabels = labelsFromFilters(filters)
  const itemLabels = items.map(item => item.labels)
  const countForLabel = (label: string) => itemLabels.filter(labels => labels.includes(label)).length
  const availableLabels = [...new Set(itemLabels.flat())].filter(
    label => !activeLabels.includes(label) && countForLabel(label) < items.length
  )

  const [text, setText] = useState('')
  const [menuState, setMenuState] = useState<'collapsed' | 'expanded' | 'user' | 'label' | 'text'>('collapsed')

  const addFilter = (filter: Filter) => {
    setMenuState('collapsed')
    setFilters([...filters, filter])
  }

  if (menuState === 'collapsed' && text.length > 0) {
    setText('')
  }

  const inputRef = useRef<HTMLInputElement>(null)
  if (menuState === 'text' && !inputRef.current) {
    setTimeout(() => inputRef.current?.focus())
  }

  const updateText = (newText: string) => {
    setText(newText)
    setFilters([
      ...filters.filter(filter => !isTextFilter(filter) || filter.text !== text),
      ...(newText.trim().length > 0 ? [{ text: newText }] : []),
    ])
  }

  return (
    <div className='relative flex overflow-visible'>
      <div
        className='flex items-center gap-1 pl-1 pr-2 py-0.5 cursor-pointer hover:bg-gray-100 rounded-md'
        onClick={() => setMenuState('expanded')}>
        <Icon icon={filterIcon} />
        Filter
      </div>
      <div className='absolute right-0 shadow-sm top-7'>
        <PopupMenu
          className={menuState === 'text' ? 'w-72 p-2' : 'w-56 p-3'}
          expanded={menuState !== 'collapsed'}
          collapse={() => setMenuState('collapsed')}>
          {menuState === 'expanded' && (
            <>
              {sortOptions.length > 0 && <PopupSectionTitle>Filter</PopupSectionTitle>}
              <FilterCategoryItem
                title='Created by'
                icon={userIcon}
                onClick={() => setMenuState('user')}
                disabled={!availableUsers.length}
              />
              <FilterCategoryItem
                title='Label'
                icon={labelIcon}
                onClick={() => setMenuState('label')}
                disabled={!availableLabels.length}
              />
              <FilterCategoryItem title='Contains' icon={textIcon} onClick={() => setMenuState('text')} />
              {sortOptions.length > 0 && <PopupSectionTitle>Sort by</PopupSectionTitle>}
              {sortOptions.map((option, index) => (
                <SortOptionItem
                  key={index}
                  option={option}
                  onClick={() => setActiveSortOption && setActiveSortOption(option)}
                  isActive={option === activeSortOption}
                />
              ))}
            </>
          )}
          {menuState === 'label' &&
            availableLabels.map((label, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ label })}>
                <div className={`w-2 h-2 m-1 rounded-full ${labelColors[label]}`} />
                <div className='grow'>{label}</div>
                <div className='pr-2'>{countForLabel(label)}</div>
              </FilterPopupItem>
            ))}
          {menuState === 'user' &&
            availableUsers.map((user, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ userID: user.id })}>
                <UserAvatar user={user} size='sm' />
                <div className='grow'>{user.fullName}</div>
                <div className='pr-2'>{countForUserID(user.id)}</div>
              </FilterPopupItem>
            ))}
          {menuState === 'text' && (
            <input
              ref={inputRef}
              type='text'
              className='w-full text-xs border border-gray-300 outline-none rounded p-1.5'
              value={text}
              onChange={event => updateText(event.target.value)}
            />
          )}
        </PopupMenu>
      </div>
    </div>
  )
}

const FilterCategoryItem = ({
  title,
  icon,
  onClick,
  disabled,
}: {
  title: string
  icon: StaticImageData
  onClick: () => void
  disabled?: boolean
}) => (
  <FilterPopupItem onClick={onClick} disabled={disabled}>
    <Icon icon={icon} />
    <div className='grow'>{title}</div>
    <Icon className='-rotate-90' icon={chevronIcon} />
  </FilterPopupItem>
)

const SortOptionItem = <SortOption extends string>({
  option,
  onClick,
  isActive,
}: {
  option: SortOption
  onClick: () => void
  isActive?: boolean
}) => (
  <FilterPopupItem onClick={onClick}>
    {isActive && <Icon icon={checkIcon} />}
    <div className={!isActive ? 'ml-8 h-6 flex items-center' : undefined}>{option}</div>
  </FilterPopupItem>
)

const FilterPopupItem = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) => {
  const activeClass = disabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-100'
  return (
    <div className={`flex items-center gap-2 p-1 rounded ${activeClass}`} onClick={disabled ? undefined : onClick}>
      {children}
    </div>
  )
}
