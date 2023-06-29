import { User, Version } from '@/types'
import clearIcon from '@/public/clear.svg'
import filterIcon from '@/public/filter.svg'
import chevronIcon from '@/public/chevron.svg'
import userIcon from '@/public/user.svg'
import labelIcon from '@/public/label.svg'
import textIcon from '@/public/text.svg'
import { UserAvatar } from './userSidebarItem'
import { ReactNode, useState } from 'react'
import PopupMenu from './popupMenu'

type UserFilter = { userID: number }
type LabelFilter = { label: string }
type TextFilter = { text: string }

export type VersionFilter = UserFilter | LabelFilter | TextFilter

const isUserFilter = (filter: VersionFilter): filter is UserFilter => 'userID' in (filter as UserFilter)
const isLabelFilter = (filter: VersionFilter): filter is LabelFilter => 'label' in (filter as LabelFilter)
const isTextFilter = (filter: VersionFilter): filter is TextFilter => 'text' in (filter as TextFilter)

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
}: {
  users: User[]
  labelColors: Record<string, string>
  versions: Version[]
  filters: VersionFilter[]
  setFilters: (filters: VersionFilter[]) => void
}) {
  return (
    <div className='flex items-start justify-between w-full gap-2'>
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
      <FilterButton
        users={users}
        labelColors={labelColors}
        versions={versions}
        filters={filters}
        setFilters={setFilters}
      />
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
      <img className='w-[18px] h-[18px] cursor-pointer' src={clearIcon.src} onClick={onClick} />
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
  const availableUsers = users.filter(user => versionUserIDs.includes(user.id) && !activeUserIDs.includes(user.id))
  const countForUserID = (userID: number) => versionUserIDs.filter(id => id === userID).length

  const activeLabels = labelsFromFilters(filters)
  const versionLabels = versions.map(version => version.labels)
  const availableLabels = [...new Set(versionLabels.flat())].filter(label => !activeLabels.includes(label))
  const countForLabel = (label: string) => versionLabels.filter(labels => labels.includes(label)).length

  const [menuState, setMenuState] = useState<'collapsed' | 'expanded' | 'user' | 'label' | 'text'>('collapsed')

  const canShowTopLevel = availableUsers.length > 0 || availableLabels.length > 0
  const addFilter = (filter: VersionFilter) => {
    setMenuState('collapsed')
    setFilters([...filters, filter])
  }

  return (
    <div className='relative flex'>
      <div
        className='flex items-center gap-1 px-2 cursor-pointer'
        onClick={() => setMenuState(canShowTopLevel ? 'expanded' : 'text')}>
        <img className='w-6 h-6' src={filterIcon.src} />
        Filter
      </div>
      <div className='absolute right-0 top-7'>
        <PopupMenu className='w-56 p-3' expanded={menuState !== 'collapsed'} collapse={() => setMenuState('collapsed')}>
          {menuState === 'expanded' && (
            <>
              {availableUsers.length > 0 && (
                <FilterCategoryItem title='Created by' icon={userIcon.src} onClick={() => setMenuState('user')} />
              )}
              {availableLabels.length > 0 && (
                <FilterCategoryItem title='Label' icon={labelIcon.src} onClick={() => setMenuState('label')} />
              )}
              <FilterCategoryItem title='Contains' icon={textIcon.src} onClick={() => setMenuState('text')} />
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
        </PopupMenu>
      </div>
      {/* <input
        className='flex-grow p-2 mb-4 text-sm bg-white border border-gray-300 rounded-lg'
        type='text'
        value={filters.map(filter => ('text' in filter ? filter.text : '')).join(' ')}
        onChange={event => setFilters(event.target.value.length ? [{ text: event.target.value }] : [])}
        placeholder='Filter'
      /> */}
    </div>
  )
}

function FilterCategoryItem({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <FilterPopupItem onClick={onClick}>
      <img className='w-6 h-6' src={icon} />
      <div className='flex-grow'>{title}</div>
      <img className='w-6 h-6' src={chevronIcon.src} />
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
