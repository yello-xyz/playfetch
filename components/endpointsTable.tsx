import { ResolvedEndpoint } from '@/types'
import Label from './label'

export default function EndpointsTable({
  endpoints,
  activeEndpoint,
  setActiveEndpoint,
}: {
  endpoints: ResolvedEndpoint[]
  activeEndpoint?: ResolvedEndpoint
  setActiveEndpoint: (endpoint: ResolvedEndpoint) => void
}) {
  return (
    <>
      <Label>Endpoints</Label>
      <div className='grid w-full grid-cols-2 overflow-y-auto'>
        <div className='px-3 py-2 font-medium text-gray-800 border border-gray-100'>Endpoint</div>
        <div className='px-3 py-2 font-medium text-gray-800 border-r border-gray-100 border-y'>
          Environment
        </div>
        {endpoints.map((endpoint, index) => (
          <>
            <div className='px-3 py-2 border-b border-gray-100 border-x'>{endpoint.urlPath}</div>
            <div className='px-3 py-2 text-sm bg-white border-b border-r border-gray-100 outline-none'>
              {endpoint.flavor}
            </div>
          </>
        ))}
      </div>
    </>
  )
}
