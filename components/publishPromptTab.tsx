import { ActiveProject, Prompt, ResolvedEndpoint } from '@/types'
import { useRefreshPrompt } from './refreshContext'
import { EndpointsView } from './publishChainTab'

export default function PublishPromptTab({
  endpoints,
  prompt,
  project,
}: {
  endpoints: ResolvedEndpoint[]
  prompt: Prompt
  project: ActiveProject
}) {
  const refreshPrompt = useRefreshPrompt()
  return <EndpointsView endpoints={endpoints} activeItem={prompt} project={project} onRefresh={refreshPrompt} />
}
