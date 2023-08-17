import { User, Version } from '@/types'
import clearIcon from '@/public/clear.svg'
import filterIcon from '@/public/filter.svg'
import chevronIcon from '@/public/chevron.svg'
import userIcon from '@/public/user.svg'
import labelIcon from '@/public/label.svg'
import textIcon from '@/public/text.svg'
import { UserAvatar } from './userSidebarItem'
import { ReactNode, useRef, useState } from 'react'
import PopupMenu from './popupMenu'
import Icon from './icon'
import { StaticImageData } from 'next/image'

type UserFilter = { userID: number }
type LabelFilter = { label: string }
type TextFilter = { text: string }

export type VersionFilter = UserFilter | LabelFilter | TextFilter

const isUserFilter = (filter: VersionFilter): filter is UserFilter => 'userID' in filter
const isLabelFilter = (filter: VersionFilter): filter is LabelFilter => 'label' in filter
const isTextFilter = (filter: VersionFilter): filter is TextFilter => 'text' in filter

const userIDsFromFilters = (filters: VersionFilter[]) => filters.filter(isUserFilter).map(filter => filter.userID)
const labelsFromFilters = (filters: VersionFilter[]) => filters.filter(isLabelFilter).map(filter => filter.label)

export const BuildVersionFilter = (filters: VersionFilter[]) => (version: Version) => {
  const userIDs = userIDsFromFilters(filters)
  const userFilter = (version: Version) => !userIDs.length || userIDs.includes(version.userID)

  const labels = labelsFromFilters(filters)
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
  tabSelector,
}: {
  users: User[]
  labelColors: Record<string, string>
  versions: Version[]
  filters: VersionFilter[]
  setFilters: (filters: VersionFilter[]) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  return (
    <div className='flex flex-col gap-2'>
      {tabSelector(
        <FilterButton
          users={users}
          labelColors={labelColors}
          versions={versions}
          filters={filters}
          setFilters={setFilters}
        />
      )}
      <div className='flex flex-wrap flex-1 gap-2 pb-2 text-xs text-gray-800'>
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
  filter: VersionFilter
  users: User[]
  labelColors: Record<string, string>
  onClick: () => void
}) {
  return (
    <div className='flex items-center gap-1 p-1 pl-2 border border-gray-300 rounded-md'>
      {isTextFilter(filter) && <TextFilterCell filter={filter} />}
      {isLabelFilter(filter) && <LabelFilterCell filter={filter} labelColors={labelColors} />}
      {isUserFilter(filter) && <UserFilterCell filter={filter} users={users} />}
      <Icon className='w-[18px] h-fit cursor-pointer' icon={clearIcon} onClick={onClick} />
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

function FilterButton({
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
  const activeUserIDs = userIDsFromFilters(filters)
  const versionUserIDs = versions.map(version => version.userID)
  const countForUserID = (userID: number) => versionUserIDs.filter(id => id === userID).length
  const availableUsers = users.filter(
    user => !activeUserIDs.includes(user.id) && countForUserID(user.id) > 0 && countForUserID(user.id) < versions.length
  )

  const activeLabels = labelsFromFilters(filters)
  const versionLabels = versions.map(version => version.labels)
  const countForLabel = (label: string) => versionLabels.filter(labels => labels.includes(label)).length
  const availableLabels = [...new Set(versionLabels.flat())].filter(
    label => !activeLabels.includes(label) && countForLabel(label) < versions.length
  )

  const [text, setText] = useState('')
  const [menuState, setMenuState] = useState<'collapsed' | 'expanded' | 'user' | 'label' | 'text'>('collapsed')

  const canShowTopLevel = availableUsers.length > 0 || availableLabels.length > 0

  const addFilter = (filter: VersionFilter) => {
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
        className='flex items-center gap-1 px-2 cursor-pointer'
        onClick={() => setMenuState(canShowTopLevel ? 'expanded' : 'text')}>
        <Icon icon={filterIcon} />
        Filter
      </div>
      <div className='absolute right-0 top-7'>
        <PopupMenu
          className={menuState === 'text' ? 'w-72 p-2' : 'w-56 p-3'}
          expanded={menuState !== 'collapsed'}
          collapse={() => setMenuState('collapsed')}>
          {menuState === 'expanded' && (
            <>
              {availableUsers.length > 0 && (
                <FilterCategoryItem title='Created by' icon={userIcon} onClick={() => setMenuState('user')} />
              )}
              {availableLabels.length > 0 && (
                <FilterCategoryItem title='Label' icon={labelIcon} onClick={() => setMenuState('label')} />
              )}
              <FilterCategoryItem title='Contains' icon={textIcon} onClick={() => setMenuState('text')} />
            </>
          )}
          {menuState === 'label' &&
            availableLabels.map((label, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ label })}>
                <div className={`w-2 h-2 m-1 rounded-full ${labelColors[label]}`} />
                <div className='flex-grow'>{label}</div>
                <div className='pr-2'>{countForLabel(label)}</div>
              </FilterPopupItem>
            ))}
          {menuState === 'user' &&
            availableUsers.map((user, index) => (
              <FilterPopupItem key={index} onClick={() => addFilter({ userID: user.id })}>
                <UserAvatar user={user} size='sm' />
                <div className='flex-grow'>{user.fullName}</div>
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

function FilterCategoryItem({ title, icon, onClick }: { title: string; icon: StaticImageData; onClick: () => void }) {
  return (
    <FilterPopupItem onClick={onClick}>
      <Icon icon={icon} />
      <div className='flex-grow'>{title}</div>
      <Icon icon={chevronIcon} />
    </FilterPopupItem>
  )
}

function FilterPopupItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <div className='flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-100' onClick={onClick}>
      {children}
    </div>
  )
}
