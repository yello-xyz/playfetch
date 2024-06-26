import { User } from '@/types'
import filterIcon from '@/public/filter.svg'
import userIcon from '@/public/user.svg'
import labelIcon from '@/public/label.svg'
import textIcon from '@/public/text.svg'
import UserAvatar from '@/src/client/users/userAvatar'
import { useRef, useState } from 'react'
import PopupMenu, { PopupSectionTitle } from '@/src/client/components/popupMenu'
import Icon from '@/src/client/components/icon'
import { Filter, FilterItem, IsTextFilter, LabelsFromFilters, StatusesFromFilters, UserIDsFromFilters } from './filters'
import FilterPopupItem, { FilterCategoryItem, SortOptionItem } from './filterPopupItem'

export function FiltersButton<SortOption extends string>({
  users,
  labelColors,
  colorForStatus,
  items,
  filters,
  setFilters,
  sortOptions = [],
  activeSortOption,
  setActiveSortOption,
}: {
  users?: User[]
  labelColors?: Record<string, string>
  colorForStatus?: (status: string) => string
  items?: FilterItem[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOptions?: SortOption[]
  activeSortOption?: SortOption
  setActiveSortOption?: (option: SortOption) => void
}) {
  const filterItems = items ?? []
  const activeUserIDs = UserIDsFromFilters(filters)
  const itemUserIDs = filterItems.flatMap(item => item.userIDs)
  const countForUserID = (userID: number) => itemUserIDs.filter(id => id === userID).length
  const availableUsers = (users ?? []).filter(
    user =>
      !activeUserIDs.includes(user.id) && countForUserID(user.id) > 0 && countForUserID(user.id) < filterItems.length
  )

  const activeLabels = LabelsFromFilters(filters)
  const itemLabels = filterItems.map(item => item.labels)
  const countForLabel = (label: string) => itemLabels.filter(labels => labels.includes(label)).length
  const availableLabels = [...new Set(itemLabels.flat())].filter(
    label => !activeLabels.includes(label) && countForLabel(label) < filterItems.length
  )

  const activeStatuses = StatusesFromFilters(filters)
  const itemStatuses = filterItems.map(item => item.statuses)
  const countForStatus = (status: string) => itemStatuses.filter(statuses => statuses.includes(status)).length
  const availableStatuses = [...new Set(itemStatuses.flat())].filter(
    status => !activeStatuses.includes(status) && countForStatus(status) < filterItems.length
  )

  const [text, setText] = useState('')
  const [menuState, setMenuState] = useState<'collapsed' | 'expanded' | 'user' | 'label' | 'status' | 'text'>(
    'collapsed'
  )

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
      ...filters.filter(filter => !IsTextFilter(filter) || filter.text !== text),
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
              {users !== undefined && (
                <FilterCategoryItem
                  title='Created by'
                  icon={userIcon}
                  onClick={() => setMenuState('user')}
                  disabled={!availableUsers.length}
                />
              )}
              {labelColors !== undefined && (
                <FilterCategoryItem
                  title='Label'
                  icon={labelIcon}
                  onClick={() => setMenuState('label')}
                  disabled={!availableLabels.length}
                />
              )}
              {colorForStatus !== undefined && (
                <FilterCategoryItem
                  title='Status'
                  icon={labelIcon}
                  onClick={() => setMenuState('status')}
                  disabled={!availableStatuses.length}
                />
              )}
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
          {menuState === 'user' &&
            availableUsers.map((user, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ userID: user.id })}>
                <UserAvatar user={user} size='sm' />
                <div className='grow'>{user.fullName}</div>
                <div className='pr-2'>{countForUserID(user.id)}</div>
              </FilterPopupItem>
            ))}
          {menuState === 'label' &&
            availableLabels.map((label, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ label })}>
                <div className={`w-2 h-2 m-1 rounded-full ${labelColors?.[label]}`} />
                <div className='grow'>{label}</div>
                <div className='pr-2'>{countForLabel(label)}</div>
              </FilterPopupItem>
            ))}
          {menuState === 'status' &&
            availableStatuses.map((status, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ status })}>
                <div className={`w-2 h-2 m-1 rounded-full ${colorForStatus?.(status)}`} />
                <div className='grow'>{status}</div>
                <div className='pr-2'>{countForStatus(status)}</div>
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
