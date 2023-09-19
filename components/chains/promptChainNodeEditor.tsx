import { ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import Checkbox from '../checkbox'
import VersionTimeline from '../versions/versionTimeline'
import PromptPanel from '../prompts/promptPanel'
import { Allotment } from 'allotment'
import { SingleTabHeader } from '../tabSelector'
import { useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import { LoadPendingVersion } from '../prompts/promptView'
import useModifiedVersion from '@/src/client/hooks/useModifiedVersion'
import { PromptCache } from '../../src/client/hooks/usePromptCache'

export default function PromptChainNodeEditor({
  item,
  updateItem,
  canIncludeContext,
  promptCache,
  selectVersion,
  setModifiedVersion,
}: {
  item: PromptChainItem
  updateItem: (item: PromptChainItem) => void
  canIncludeContext: boolean
  promptCache: PromptCache
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const loadedPrompt = promptCache.promptForItem(item)
  const activeVersion = promptCache.versionForItem(item)
  const setIncludeContext = (includeContext: boolean) => updateItem({ ...item, includeContext })

  return loadedPrompt && activeVersion ? (
    <PromptEditor
      prompt={loadedPrompt}
      activeVersion={activeVersion}
      canIncludeContext={canIncludeContext}
      includeContext={!!item.includeContext}
      setIncludeContext={setIncludeContext}
      selectVersion={selectVersion}
      setModifiedVersion={setModifiedVersion}
    />
  ) : (
    <div className='grow' />
  )
}

function PromptEditor({
  prompt,
  activeVersion,
  canIncludeContext,
  includeContext,
  setIncludeContext,
  selectVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  canIncludeContext: boolean
  includeContext: boolean
  setIncludeContext: (includeContext: boolean) => void
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const [currentVersion, updateVersion] = useModifiedVersion(activeVersion, setModifiedVersion)
  const loadPendingVersion = LoadPendingVersion(prompt.versions, activeVersion, selectVersion, currentVersion)

  const minVersionHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 16
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto'>
            <VersionTimeline
              activeItem={prompt}
              versions={prompt.versions.filter(version => version.didRun)}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={() => <SingleTabHeader label='Prompt versions' icon={promptIcon} />}
            />
          </div>
          {canIncludeContext && (
            <div className='self-start w-full px-4 py-2 border-t border-gray-200'>
              <Checkbox
                label='Include previous chain context into prompt'
                checked={includeContext}
                setChecked={setIncludeContext}
              />
            </div>
          )}
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={minHeight} preferredSize={minHeight}>
        <div className='h-full px-4 pt-4 bg-white'>
          <PromptPanel
            version={activeVersion}
            setModifiedVersion={updateVersion}
            loadPendingVersion={loadPendingVersion}
            setPreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
