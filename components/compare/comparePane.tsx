import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ChainVersion,
  IsPromptVersion,
  PromptVersion,
  ResolvedEndpoint,
} from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import RunTimeline from '../runs/runTimeline'
import PromptPanel, { PromptTab } from '../prompts/promptPanel'

export const IsEndpoint = (item: ActivePrompt | ActiveChain | ResolvedEndpoint | undefined): item is ResolvedEndpoint =>
  !!item && 'urlPath' in item

export default function ComparePane({
  project,
  activeItem,
  activeVersion,
  setItemID,
  setVersionID,
  activePromptTab,
  setActivePromptTab,
  disabled,
  includeResponses,
}: {
  project: ActiveProject
  activeItem?: ActivePrompt | ActiveChain | ResolvedEndpoint
  activeVersion?: PromptVersion | ChainVersion
  setItemID: (itemID: number) => void
  setVersionID: (versionID: number) => void
  activePromptTab?: PromptTab
  setActivePromptTab: (tab: PromptTab) => void
  disabled?: boolean
  includeResponses?: boolean
}) {
  return (
    <div className='flex flex-col flex-grow w-1/2 h-full'>
      <div className='flex items-center gap-1 p-4 border-b border-gray-200'>
        <ProjectItemSelector
          className='w-full max-w-[240px]'
          project={project}
          selectedItemID={activeItem?.id}
          onSelectItemID={setItemID}
          includeEndpoints
          disabled={disabled}
        />
        {!IsEndpoint(activeItem) && (
          <VersionSelector
            className='w-full max-w-[240px]'
            projectItem={activeItem}
            selectedVersionID={activeVersion?.id}
            onSelectVersionID={setVersionID}
            disabled={disabled}
          />
        )}
      </div>
      {activeVersion && IsPromptVersion(activeVersion) && (
        <div className='p-4 border-b border-gray-200 min-h-[188px]'>
          <PromptPanel
            version={activeVersion}
            initialActiveTab={activePromptTab}
            onActiveTabChange={setActivePromptTab}
          />
        </div>
      )}
      {activeVersion && !IsEndpoint(activeItem) && includeResponses && (
        <div className='overflow-y-auto'>
          <RunTimeline runs={activeVersion.runs} activeItem={activeItem} version={activeVersion} skipHeader />
        </div>
      )}
    </div>
  )
}
