import {
  ActiveProject,
  Chain,
  Endpoint,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  FindParentInProject,
  Prompt,
  ResolvedEndpoint,
} from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'
import api from '@/src/client/api'
import Checkbox from './checkbox'
import { ToCamelCase } from '@/src/common/formatting'
import addIcon from '@/public/add.svg'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from './icon'

const NewConfigFromEndpoints = (endpoints: Endpoint[], parent: Prompt | Chain, availableFlavors: string[]) => {
  const existingNamesForParent = endpoints
    .filter(endpoint => endpoint.parentID === parent.id)
    .map(endpoint => endpoint.urlPath)
  for (const existingName of existingNamesForParent) {
    const otherEndpointsWithName = endpoints.filter(endpoint => endpoint.urlPath === existingName)
    const existingFlavors = otherEndpointsWithName.map(endpoint => endpoint.flavor)
    const availableFlavor = availableFlavors.find(flavor => !existingFlavors.includes(flavor))
    if (availableFlavor) {
      return { name: existingName, flavor: availableFlavor }
    }
  }
  return {
    name: ToCamelCase(parent.name.split(' ').slice(0, 3).join(' ')),
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
  const parents = EndpointParentsInProject(project)
  const canAddNewEndpoint = parents.length > 0

  const addEndpoint = () => {
    const parent = parents[0]
    const { name, flavor } = NewConfigFromEndpoints(project.endpoints, parent, project.availableFlavors)
    const versionID = EndpointParentIsPrompt(parent) ? parent.lastVersionID : undefined
    api.publishEndpoint(project.id, parent.id, versionID, name, flavor, false, false).then(onRefresh)
  }

  const groups = parents
    .map(parent => project.endpoints.filter(endpoint => endpoint.parentID === parent.id))
    .filter(group => group.length > 0)
  return (
    <>
      <div className='flex items-center justify-between w-full'>
        <Label>Endpoints</Label>
        {canAddNewEndpoint && (
          <div
            className='flex items-center gap-0.5 text-gray-800 cursor-pointer rounded-lg hover:bg-gray-50 pl-1 pr-2 py-0.5'
            onClick={addEndpoint}>
            <Icon icon={addIcon} />
            New Endpoint
          </div>
        )}
      </div>
      {groups.length > 0 ? (
        groups.map((group, index) => (
          <EndpointsGroup
            key={index}
            parent={FindParentInProject(group[0].parentID, project)}
            endpoints={group}
            activeEndpoint={activeEndpoint}
            setActiveEndpoint={setActiveEndpoint}
          />
        ))
      ) : (
        <EmptyTable canAddNewEndpoint={canAddNewEndpoint} />
      )}
    </>
  )
}

function EndpointsGroup({
  parent,
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
}: {
  parent: Chain | Prompt
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
}) {
  const HeaderCell = ({ children, first }: { children: ReactNode; first?: boolean }) => (
    <RowCell header first={first}>
      {children}
    </RowCell>
  )

  return (
    <>
      <div className='flex items-center gap-1 mt-4 text-gray-700'>
        <Icon icon={EndpointParentIsPrompt(parent) ? promptIcon : chainIcon} />
        {parent.name}
      </div>
      <div className={`grid w-full grid-cols-[80px_repeat(2,minmax(80px,1fr))_repeat(2,80px)_120px]`}>
        <HeaderCell first>Enabled</HeaderCell>
        <HeaderCell>Endpoint</HeaderCell>
        <HeaderCell>Environment</HeaderCell>
        <HeaderCell>Cache</HeaderCell>
        <HeaderCell>Stream</HeaderCell>
        <HeaderCell>Usage</HeaderCell>
        {endpoints.map((endpoint, index) => {
          const active = activeEndpoint?.id === endpoint.id
          const ActiveCell = ({
            children,
            center,
            first,
          }: {
            children: ReactNode
            center?: boolean
            first?: boolean
          }) => (
            <RowCell center={center} first={first} active={active} callback={() => setActiveEndpoint(endpoint)}>
              {children}
            </RowCell>
          )
          return (
            <Fragment key={index}>
              <ActiveCell center first>
                <Checkbox checked={endpoint.enabled} disabled onClick={() => setActiveEndpoint(endpoint)} />
              </ActiveCell>
              <ActiveCell>{endpoint.urlPath}</ActiveCell>
              <ActiveCell>{endpoint.flavor}</ActiveCell>
              <ActiveCell>{endpoint.useCache ? 'Yes' : 'No'}</ActiveCell>
              <ActiveCell>{endpoint.useStreaming ? 'Yes' : 'No'}</ActiveCell>
              <ActiveCell>{endpoint.usage.requests} requests</ActiveCell>
            </Fragment>
          )
        })}
      </div>
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
