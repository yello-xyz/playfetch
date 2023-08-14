import {
  ActiveProject,
  Chain,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  FindParentInProject,
  Prompt,
  ResolvedEndpoint,
} from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'
import Checkbox from './checkbox'
import addIcon from '@/public/add.svg'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from './icon'
import TableCell, { TableHeader } from './TableCell'

export default function EndpointsTable({
  tabSelector,
  project,
  activeEndpoint,
  setActiveEndpoint,
  onAddEndpoint,
}: {
  tabSelector: ReactNode
  project: ActiveProject
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onAddEndpoint?: () => void
}) {
  const groups = EndpointParentsInProject(project)
    .map(parent => project.endpoints.filter(endpoint => endpoint.parentID === parent.id))
    .filter(group => group.length > 0)
  return (
    <>
      <div className='flex items-center justify-between w-full'>
        {tabSelector}
        {onAddEndpoint && (
          <div
            className='flex items-center gap-0.5 text-gray-800 cursor-pointer rounded-lg hover:bg-gray-50 pl-1 pr-2 py-0.5'
            onClick={onAddEndpoint}>
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
        <EmptyTable onAddEndpoint={onAddEndpoint} />
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
  return (
    <>
      <div className='flex items-center gap-1 mt-4 text-gray-700'>
        <Icon icon={EndpointParentIsPrompt(parent) ? promptIcon : chainIcon} />
        {parent.name}
      </div>
      <div className={`grid w-full grid-cols-[80px_repeat(2,minmax(80px,1fr))_repeat(2,80px)_120px]`}>
        <TableHeader first>Enabled</TableHeader>
        <TableHeader>Endpoint</TableHeader>
        <TableHeader>Environment</TableHeader>
        <TableHeader>Cache</TableHeader>
        <TableHeader>Stream</TableHeader>
        <TableHeader last>Usage</TableHeader>
        {endpoints.map((endpoint, index) => {
          const active = activeEndpoint?.id === endpoint.id
          const SelectableCell = ({
            children,
            center,
            first,
            last,
          }: {
            children: ReactNode
            center?: boolean
            first?: boolean
            last?: boolean
          }) => (
            <TableCell
              center={center}
              first={first}
              last={last}
              active={active}
              callback={() => setActiveEndpoint(endpoint)}>
              {children}
            </TableCell>
          )
          return (
            <Fragment key={index}>
              <SelectableCell center first>
                <Checkbox checked={endpoint.enabled} disabled onClick={() => setActiveEndpoint(endpoint)} />
              </SelectableCell>
              <SelectableCell>{endpoint.urlPath}</SelectableCell>
              <SelectableCell>{endpoint.flavor}</SelectableCell>
              <SelectableCell>{endpoint.useCache ? 'Yes' : 'No'}</SelectableCell>
              <SelectableCell>{endpoint.useStreaming ? 'Yes' : 'No'}</SelectableCell>
              <SelectableCell last>{endpoint.usage.requests} requests</SelectableCell>
            </Fragment>
          )
        })}
      </div>
    </>
  )
}

function EmptyTable({ onAddEndpoint }: { onAddEndpoint?: () => void }) {
  const AddPromptLink = ({ label }: { label: string }) => (
    <span className='font-medium text-blue-500 cursor-pointer' onClick={onAddEndpoint}>
      {label}
    </span>
  )

  return (
    <div className='w-full h-full'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>No Endpoints</span>

        <span className='text-xs text-center text-gray-400 w-60'>
          {onAddEndpoint ? (
            <span>
              Create a <AddPromptLink label={'New Endpoint'} /> to integrate this project in your code base.
            </span>
          ) : (
            <span>Create some prompts or chains first to integrate this project into your code base.</span>
          )}
        </span>
      </div>
    </div>
  )
}
