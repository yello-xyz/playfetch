import { ActivePrompt, ResolvedPromptEndpoint } from '@/types'
import Label from './label'
import { Fragment, ReactNode } from 'react'

export default function EndpointsTable({
  prompt,
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
}: {
  prompt: ActivePrompt
  endpoints: ResolvedPromptEndpoint[]
  activeEndpoint?: ResolvedPromptEndpoint
  setActiveEndpoint: (endpoint: ResolvedPromptEndpoint) => void
}) {
  return (
    <>
      <Label>Endpoints</Label>
      <div className='grid w-full grid-cols-8 overflow-y-auto grid-flow-dense'>
        <RowCell header first wide>
          Endpoint
        </RowCell>
        <RowCell header wide>
          Environment
        </RowCell>
        <RowCell header>Prompt</RowCell>
        <RowCell header>Cached</RowCell>
        <RowCell header wide>Usage</RowCell>
        {endpoints.map((endpoint, index) => (
          <Fragment key={index}>
            <RowCell first wide>
              {endpoint.urlPath}
            </RowCell>
            <RowCell wide>{endpoint.flavor}</RowCell>
            <RowCell>v{prompt.versions.findIndex(version => version.id === endpoint.versionID) + 1}</RowCell>
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
