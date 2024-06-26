import { Chain, ProjectItemIsChain, Prompt, ResolvedEndpoint, Analytics } from '@/types'
import { ReactNode } from 'react'
import Checkbox from '@/src/client/components/checkbox'
import addIcon from '@/public/add.svg'
import addIconWhite from '@/public/addWhite.svg'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from '@/src/client/components/icon'
import TableCell, { TableHeader } from '@/src/client/components/tableCell'

import dynamic from 'next/dynamic'
import { TopBarButton } from '@/src/client/components/topBarButton'
const AnalyticsDashboards = dynamic(() => import('./analyticsDashboards'), { ssr: false })

export default function EndpointsTable({
  endpoints,
  parents,
  findParent,
  tabSelector,
  activeEndpoint,
  setActiveEndpoint,
  onAddEndpoint,
  analytics,
  refreshAnalytics,
}: {
  endpoints: ResolvedEndpoint[]
  parents: (Chain | Prompt)[]
  findParent: (id: number) => Chain | Prompt
  tabSelector: (children?: ReactNode) => ReactNode
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onAddEndpoint?: () => void
  analytics?: Analytics
  refreshAnalytics: (dayRange: number) => void
}) {
  const groups = parents
    .map(parent => endpoints.filter(endpoint => endpoint.parentID === parent.id))
    .filter(group => group.length > 0)
  const groupsLength = groups.length
  const baseClass = 'flex flex-col w-full h-full min-h-0 gap-2 px-4 pt-4 overflow-y-auto text-gray-500'
  const bgColor = groupsLength > 0 ? 'bg-gray-25' : 'bg-white'
  const containerClass = baseClass + ' ' + bgColor

  return (
    <div className='flex flex-col h-full'>
      {tabSelector(
        onAddEndpoint && (
          <div
            className='flex items-center gap-0.5 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50 pl-1 pr-2 py-0.5 -my-0.5'
            onClick={onAddEndpoint}>
            <Icon icon={addIcon} />
            New Endpoint
          </div>
        )
      )}
      <div className={containerClass}>
        <AnalyticsDashboards analytics={analytics} refreshAnalytics={refreshAnalytics} />
        {groupsLength > 0 ? (
          groups.map((group, index) => (
            <EndpointsGroup
              key={index}
              parent={findParent(group[0].parentID)}
              endpoints={group}
              activeEndpoint={activeEndpoint}
              setActiveEndpoint={setActiveEndpoint}
            />
          ))
        ) : (
          <EmptyTable onAddEndpoint={onAddEndpoint} />
        )}
      </div>
    </div>
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
      <div className='flex items-center gap-1 text-gray-700'>
        <Icon icon={ProjectItemIsChain(parent) ? chainIcon : promptIcon} />
        {parent.name}
      </div>
      <div className='mb-4 grid w-full grid-cols-[80px_repeat(2,minmax(80px,1fr))_repeat(2,80px)_120px]'>
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
            <div key={index} className='contents group'>
              <SelectableCell center first>
                <Checkbox checked={endpoint.enabled} disabled onClick={() => setActiveEndpoint(endpoint)} />
              </SelectableCell>
              <SelectableCell>{endpoint.urlPath}</SelectableCell>
              <SelectableCell>{endpoint.flavor}</SelectableCell>
              <SelectableCell>{endpoint.useCache ? 'Yes' : 'No'}</SelectableCell>
              <SelectableCell>{endpoint.useStreaming ? 'Yes' : 'No'}</SelectableCell>
              <SelectableCell last>{endpoint.usage.requests} requests</SelectableCell>
            </div>
          )
        })}
      </div>
    </>
  )
}

const EmptyTable = ({ onAddEndpoint }: { onAddEndpoint?: () => void }) => (
  <div className='w-full h-full pb-4 text-gray-700 bg-white'>
    <div className='flex flex-col items-center justify-center h-full gap-1 p-6 border border-gray-200 rounded-lg bg-gray-25'>
      <span className='font-medium'>No Endpoints</span>
      <span className='text-sm text-center text-gray-400 w-72'>
        {onAddEndpoint ? (
          <span>Create an endpoint to allow integrating prompts or chains into your code base.</span>
        ) : (
          <span>Create some prompts or chains first to integrate this project into your code base.</span>
        )}
      </span>
      {onAddEndpoint && (
        <span className='mt-2'>
          <TopBarButton type='primary' title='New Endpoint' icon={addIconWhite} onClick={onAddEndpoint} />
        </span>
      )}
    </div>
  </div>
)
