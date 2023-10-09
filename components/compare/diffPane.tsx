import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'
import RunTimeline from '../runs/runTimeline'
import PromptPanel, { PromptTab } from '../prompts/promptPanel'
import ReactDiffViewer from 'react-diff-viewer-continued'

const getContent = (version: ChainVersion | PromptVersion, activePromptTab: PromptTab) => {
  switch (activePromptTab) {
    case 'main':
    case 'functions':
    case 'system':
      return version.prompts?.[activePromptTab]
    case 'settings':
      return JSON.stringify(version.config ?? {}, null, 2) // TODO: format
  }
}

export default function DiffPane({
  leftVersion,
  rightVersion,
  activePromptTab,
}: {
  leftVersion: PromptVersion | ChainVersion
  rightVersion: PromptVersion | ChainVersion
  activePromptTab: PromptTab
}) {
  const leftContent = leftVersion ? getContent(leftVersion, activePromptTab) : undefined
  const rightContent = rightVersion ? getContent(rightVersion, activePromptTab) : undefined

  return leftContent && rightContent && rightContent !== leftContent ? (
    <div className='h-full overflow-y-auto'>
      <ReactDiffViewer oldValue={leftContent} newValue={rightContent} splitView={true} />
    </div>
  ) : null
}
