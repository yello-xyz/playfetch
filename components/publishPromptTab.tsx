import { ActiveProject, ResolvedEndpoint } from '@/types'
import { useRefreshPrompt } from './refreshContext'
import { EndpointsView } from './publishChainTab'

export default function PublishPromptTab({
  endpoints,
  project,
}: {
  endpoints: ResolvedEndpoint[]
  project: ActiveProject
}) {
  const refreshPrompt = useRefreshPrompt()
  return <EndpointsView endpoints={endpoints} project={project} onRefresh={refreshPrompt} />
}
