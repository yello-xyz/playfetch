import { ActiveProject, Chain, Endpoint, Prompt, ResolvedEndpoint } from '@/types'
import Label from './label'
import { Fragment, ReactNode, useState } from 'react'
import Icon from './icon'
import addIcon from '@/public/add.svg'
import useModalDialogPrompt from './modalDialogContext'
import api from '@/src/client/api'
import Checkbox from './checkbox'
import { CheckValidURLPath, ToCamelCase } from '@/src/common/formatting'
import TextInput from './textInput'

export function EndpointToggleWithName({
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
  const [isEnabled, setEnabled] = useState(endpoint.enabled)
  const [name, setName] = useState(endpoint.urlPath)

  const [savedEndpoint, setSavedEndpoint] = useState(endpoint)
  if (endpoint.enabled !== savedEndpoint.enabled || endpoint.urlPath !== savedEndpoint.urlPath) {
    setEnabled(endpoint.enabled)
    setName(endpoint.urlPath)
    setSavedEndpoint(endpoint)
  }

  const setDialogPrompt = useModalDialogPrompt()

  const togglePublish = (enabled: boolean) => {
    const callback = () => {
      setEnabled(enabled)
      api.updateEndpoint({ ...endpoint, enabled, urlPath: name }).then(_ => onRefresh())
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
    <>
      <RowCell active={isActive} center first>
        <Checkbox disabled={!CheckValidURLPath(name)} checked={isEnabled} setChecked={togglePublish} />
      </RowCell>
      <RowCell active={isActive} callback={setActive}>
        {endpoint.urlPath}
      </RowCell>
    </>
  ) : (
    <>
      <Checkbox disabled={!CheckValidURLPath(name)} checked={isEnabled} setChecked={togglePublish} />
      <Label>Name</Label>
      {endpoint.enabled ? name : <TextInput value={name} setValue={name => setName(ToCamelCase(name))} />}
    </>
  )
}

export default function EndpointsTable({
  project,
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
  onRefresh,
  onAddEndpoint,
}: {
  project: ActiveProject
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onRefresh: () => Promise<void>
  onAddEndpoint: (parent: Chain | Prompt) => void
}) {
  const HeaderCell = ({ children, first }: { children: ReactNode; first?: boolean }) => (
    <RowCell header first={first}>
      {children}
    </RowCell>
  )

  // TODO if we can only add a new endpoint for the first prompt, we really need a selector in the settings pane.
  const addNewEndpoint = project.prompts.length > 0 ? () => onAddEndpoint(project.prompts[0]) : undefined

  return (
    <>
      <div className='flex items-center justify-between w-full'>
        <Label>Endpoints</Label>
        {addNewEndpoint && (
          <div className='flex items-center gap-0.5 text-gray-800 cursor-pointer' onClick={addNewEndpoint}>
            <Icon icon={addIcon} />
            New Endpoint
          </div>
        )}
      </div>
      {endpoints.length > 0 ? (
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
                <EndpointToggleWithName
                  endpoint={endpoint}
                  onRefresh={onRefresh}
                  isActive={active}
                  setActive={() => setActiveEndpoint(endpoint)}
                />
                <ActiveCell>{endpoint.flavor}</ActiveCell>
                <ActiveCell>{endpoint.useCache ? 'Yes' : 'No'}</ActiveCell>
                <ActiveCell>{endpoint.useStreaming ? 'Yes' : 'No'}</ActiveCell>
                <ActiveCell>{endpoint.usage.requests} requests</ActiveCell>
              </Fragment>
            )
          })}
        </div>
      ) : (
        <EmptyTable onAddEndpoint={addNewEndpoint} />
      )}
    </>
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

function EmptyTable({ onAddEndpoint }: { onAddEndpoint?: () => void }) {
  const AddPromptLink = ({ label }: { label: string }) => (
    <span className='text-gray-500 underline cursor-pointer' onClick={onAddEndpoint}>
      {label}
    </span>
  )

  return (
    <div className='w-full h-full'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>No Endpoints</span>
        {onAddEndpoint && (
          <span className='w-56 text-xs text-center text-gray-400'>
            Create a <AddPromptLink label={'New Endpoint'} /> to integrate this project in your code base.
          </span>
        )}
      </div>
    </div>
  )
}
