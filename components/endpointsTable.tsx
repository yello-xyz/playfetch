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
        <RowCell header wide>
          Usage
        </RowCell>
        {endpoints.map((endpoint, index) => {
          const active = activeEndpoint?.id === endpoint.id
          const Cell = ({ children, first, wide }: { children: ReactNode; first?: boolean; wide?: boolean }) => (
            <RowCell active={active} first={first} wide={wide} callback={() => setActiveEndpoint(endpoint)}>
              {children}
            </RowCell>
          )
          return (
            <Fragment key={index}>
              <Cell first wide>
                {endpoint.urlPath}
              </Cell>
              <Cell wide>{endpoint.flavor}</Cell>
              {getVersionIndex && <Cell>v{getVersionIndex(endpoint) + 1}</Cell>}
              <Cell>{endpoint.useCache ? 'Yes' : 'No'}</Cell>
              <Cell wide>{endpoint.usage.requests} requests</Cell>
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
  wide,
  active,
  callback,
}: {
  children: ReactNode
  header?: boolean
  first?: boolean
  wide?: boolean
  active?: boolean
  callback?: () => void
}) {
  const baseClass = 'px-3 py-2 text-ellipsis overflow-hidden border-gray-100 cursor-pointer'
  const borderClass = header
    ? first
      ? 'border'
      : 'border-r border-y'
    : first
    ? 'border-b border-x'
    : 'border-b border-r'
  const textClass = header ? 'font-medium text-gray-800' : ''
  const spanClass = wide ? 'col-span-2' : ''
  const bgClass = active ? 'bg-blue-25' : ''
  return (
    <div className={`${baseClass} ${borderClass} ${textClass} ${spanClass} ${bgClass}`} onClick={callback}>
      {children}
    </div>
  )
}
