import { ActiveProject } from '@/types'
import { useRefreshPrompt } from './refreshContext'
import { EndpointsView } from './publishChainTab'

export default function PublishPromptTab({ project }: { project: ActiveProject }) {
  const refreshPrompt = useRefreshPrompt()
  return <EndpointsView project={project} onRefresh={refreshPrompt} />
}
