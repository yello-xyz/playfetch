import { ResolvedEndpoint } from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'

export default function EndpointsTable({
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
  getVersionIndex,
}: {
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
  getVersionIndex?: (endpoint: ResolvedEndpoint) => number
}) {
  const columnsClass = getVersionIndex ? 'grid-cols-8' : 'grid-cols-7'
  return (
    <>
      <Label>Endpoints</Label>
      <div className={`grid w-full overflow-y-auto grid-flow-dense ${columnsClass}`}>
        <RowCell header first wide>
          Endpoint
        </RowCell>
        <RowCell header wide>
          Environment
        </RowCell>
        {getVersionIndex && <RowCell header>Prompt</RowCell>}
        <RowCell header>Cached</RowCell>
        <RowCell header wide>Usage</RowCell>
        {endpoints.map((endpoint, index) => (
          <Fragment key={index}>
            <RowCell first wide>
              {endpoint.urlPath}
            </RowCell>
            <RowCell wide>{endpoint.flavor}</RowCell>
            {getVersionIndex && <RowCell>v{getVersionIndex(endpoint) + 1}</RowCell>}
            <RowCell>{endpoint.useCache ? 'Yes' : 'No'}</RowCell>
            <RowCell wide>{endpoint.usage.requests} requests</RowCell>
          </Fragment>
        ))}
      </div>
    </>
  )
}

function RowCell({
  children,
  header,
  first,
  wide,
}: {
  children: ReactNode
  header?: boolean
  first?: boolean
  wide?: boolean
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
  const spanClass = wide ? 'col-span-2' : ''
  return <div className={`${baseClass} ${borderClass} ${textClass} ${spanClass}`}>{children}</div>
}
