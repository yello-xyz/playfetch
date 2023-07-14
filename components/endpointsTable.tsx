import { ResolvedEndpoint } from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'
import { EndpointToggle } from './publishSettingsPane'

export default function EndpointsTable({
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
  onRefresh,
  getVersionIndex,
}: {
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  onRefresh: () => Promise<void>
  getVersionIndex?: (endpoint: ResolvedEndpoint) => number
}) {
  const columnsClass = getVersionIndex
    ? 'grid-cols-[80px_repeat(2,minmax(80px,1fr))_repeat(2,80px)_120px]'
    : 'grid-cols-[80px_repeat(2,minmax(80px,1fr))_80px_120px]'

  const HeaderCell = ({ children, first }: { children: ReactNode; first?: boolean }) => (
    <RowCell header first={first}>
      {children}
    </RowCell>
  )

  return (
    <>
      <Label>Endpoints</Label>
      <div className={`grid w-full overflow-y-auto ${columnsClass}`}>
        <HeaderCell first>Enabled</HeaderCell>
        <HeaderCell>Endpoint</HeaderCell>
        <HeaderCell>Environment</HeaderCell>
        {getVersionIndex && <HeaderCell>Prompt</HeaderCell>}
        <HeaderCell>Cached</HeaderCell>
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
              <RowCell active={active} center first>
                <EndpointToggle endpoint={endpoint} onRefresh={onRefresh} />
              </RowCell>
              <ActiveCell>{endpoint.urlPath}</ActiveCell>
              <ActiveCell>{endpoint.flavor}</ActiveCell>
              {getVersionIndex && <ActiveCell>v{getVersionIndex(endpoint) + 1}</ActiveCell>}
              <ActiveCell>{endpoint.useCache ? 'Yes' : 'No'}</ActiveCell>
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
