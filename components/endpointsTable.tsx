import { ActiveProject, Chain, Endpoint, Prompt, ResolvedEndpoint } from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'
import useModalDialogPrompt from './modalDialogContext'
import api from '@/src/client/api'
import Checkbox from './checkbox'
import { ToCamelCase } from '@/src/common/formatting'
import DropdownMenu from './dropdownMenu'
import { useInitialState } from './useInitialState'

export function PublishToggle({
  endpoint,
  onRefresh,
  isActive,
  setActive,
}: {
  endpoint: Endpoint
  onRefresh: () => Promise<void>
  isActive?: boolean
  setActive?: () => void
}) {
  const [isEnabled, setEnabled] = useInitialState(endpoint.enabled)

  const setDialogPrompt = useModalDialogPrompt()

  const togglePublish = (enabled: boolean) => {
    const callback = () => {
      setEnabled(enabled)
      api.updateEndpoint({ ...endpoint, enabled }).then(_ => onRefresh())
    }
    if (isEnabled) {
      setDialogPrompt({
        title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
        callback,
        destructive: true,
      })
    } else {
      callback()
    }
  }

  return setActive ? (
    <RowCell active={isActive} center first>
      <Checkbox checked={isEnabled} setChecked={togglePublish} />
    </RowCell>
  ) : (
    <Checkbox checked={isEnabled} setChecked={togglePublish} />
  )
}

const NewConfigFromEndpoints = (endpoints: Endpoint[], itemName: string, availableFlavors: string[]) => {
  for (const existingName of endpoints.map(endpoint => endpoint.urlPath)) {
    const otherEndpointsWithName = endpoints.filter(endpoint => endpoint.urlPath === existingName)
    const existingFlavors = otherEndpointsWithName.map(endpoint => endpoint.flavor)
    const availableFlavor = availableFlavors.find(flavor => !existingFlavors.includes(flavor))
    if (availableFlavor) {
      return { name: existingName, flavor: availableFlavor }
    }
  }
  return {
    name: ToCamelCase(itemName.split(' ').slice(0, 3).join(' ')),
    flavor: availableFlavors[0],
  }
}

export default function EndpointsTable({
  project,
  activeEndpoint,
  setActiveEndpoint,
  onRefresh,
}: {
  project: ActiveProject
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onRefresh: () => Promise<void>
}) {
  const parents = [...project.prompts, ...project.chains]
  const canAddNewEndpoint = parents.length > 0

  const isPrompt = (parent: Chain | Prompt): parent is Prompt => 'lastVersionID' in (parent as Prompt)
  const addEndpoint = (parentID: number) => {
    const parent = parents.find(parent => parent.id === parentID)!
    const { name, flavor } = NewConfigFromEndpoints(project.endpoints, parent.name, project.availableFlavors)
    const versionID = isPrompt(parent) ? parent.lastVersionID : undefined
    api.publishEndpoint(project.id, parent.id, versionID, name, flavor, false, false).then(onRefresh)
  }

  const groups = [...project.prompts, ...project.chains]
    .map(parent => project.endpoints.filter(endpoint => endpoint.parentID === parent.id))
    .filter(group => group.length > 0)
  return (
    <>
      <div className='flex items-center justify-between w-full'>
        <Label>Endpoints</Label>
        {canAddNewEndpoint && (
          <div className='flex-end'>
            <DropdownMenu value={0} onChange={value => addEndpoint(Number(value))}>
              <option value={0} disabled>
                Add New Endpoint
              </option>
              {parents.map((parent, index) => (
                <option key={index} value={parent.id}>
                  {isPrompt(parent) ? 'Prompt' : 'Chain'} “{parent.name}”
                </option>
              ))}
            </DropdownMenu>
          </div>
        )}
      </div>
      {groups.length > 0 ? (
        groups.map((group, index) => (
          <EndpointsGroup
            key={index}
            endpoints={group}
            activeEndpoint={activeEndpoint}
            setActiveEndpoint={setActiveEndpoint}
            onRefresh={onRefresh}
          />
        ))
      ) : (
        <EmptyTable canAddNewEndpoint={canAddNewEndpoint} />
      )}
    </>
  )
}

function EndpointsGroup({
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
  onRefresh,
}: {
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onRefresh: () => Promise<void>
}) {
  const HeaderCell = ({ children, first }: { children: ReactNode; first?: boolean }) => (
    <RowCell header first={first}>
      {children}
    </RowCell>
  )

  return (
    <div className={`grid w-full overflow-y-auto grid-cols-[80px_repeat(2,minmax(80px,1fr))_repeat(2,80px)_120px]`}>
      <HeaderCell first>Enabled</HeaderCell>
      <HeaderCell>Endpoint</HeaderCell>
      <HeaderCell>Environment</HeaderCell>
      <HeaderCell>Cache</HeaderCell>
      <HeaderCell>Stream</HeaderCell>
      <HeaderCell>Usage</HeaderCell>
      {endpoints.map((endpoint, index) => {
        const active = activeEndpoint?.id === endpoint.id
        const ActiveCell = ({ children }: { children: ReactNode }) => (
          <RowCell active={active} callback={() => setActiveEndpoint(endpoint)}>
            {children}
          </RowCell>
        )
        return (
          <Fragment key={index}>
            <PublishToggle
              endpoint={endpoint}
              onRefresh={onRefresh}
              isActive={active}
              setActive={() => setActiveEndpoint(endpoint)}
            />
            <ActiveCell>{endpoint.urlPath}</ActiveCell>
            <ActiveCell>{endpoint.flavor}</ActiveCell>
            <ActiveCell>{endpoint.useCache ? 'Yes' : 'No'}</ActiveCell>
            <ActiveCell>{endpoint.useStreaming ? 'Yes' : 'No'}</ActiveCell>
            <ActiveCell>{endpoint.usage.requests} requests</ActiveCell>
          </Fragment>
        )
      })}
    </div>
  )
}

function RowCell({
  children,
  header,
  first,
  center,
  active,
  callback,
}: {
  children: ReactNode
  header?: boolean
  first?: boolean
  center?: boolean
  active?: boolean
  callback?: () => void
}) {
  const baseClass = 'px-3 py-2 text-ellipsis overflow-hidden border-gray-100'
  const borderClass = header
    ? first
      ? 'border'
      : 'border-r border-y'
    : first
    ? 'border-b border-x'
    : 'border-b border-r'
  const textClass = header ? 'font-medium text-gray-800' : ''
  const bgClass = active ? 'bg-blue-25' : ''
  const layoutClass = center ? 'flex justify-center' : ''
  const cursorClass = callback ? 'cursor-pointer' : ''
  const className = `${baseClass} ${borderClass} ${textClass} ${bgClass} ${layoutClass} ${cursorClass}`
  return (
    <div className={className} onClick={callback}>
      {children}
    </div>
  )
}

function EmptyTable({ canAddNewEndpoint }: { canAddNewEndpoint: boolean }) {
  return (
    <div className='w-full h-full'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>No Endpoints</span>

        <span className='text-xs text-center text-gray-400 w-60'>
          {canAddNewEndpoint ? 'Add a new endpoint' : 'Create some prompts or chains first'} to integrate this project
          into your code base.
        </span>
      </div>
    </div>
  )
}
