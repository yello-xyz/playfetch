import { ActiveProject, ChainItem, ModelProvider, Prompt, PromptChainItem, Version } from '@/types'
import { ReactNode } from 'react'
import DropdownMenu from './dropdownMenu'
import { PromptCache, IsPromptChainItem } from './chainView'
import Checkbox from './checkbox'
import Label from './label'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { RefreshContext } from './refreshContext'

export default function PromptChainNodeEditor({
  node,
  index,
  items,
  updateItem,
  project,
  promptCache,
  outputMapper,
  checkProviderAvailable,
  selectVersion,
  setModifiedVersion,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  updateItem: (item: ChainItem) => void
  project: ActiveProject
  promptCache: PromptCache
  outputMapper: (node: PromptChainItem) => ReactNode
  checkProviderAvailable: (provider: ModelProvider) => boolean
  selectVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  const replacePrompt = (promptID: number) => updateItem(promptCache.promptItemForID(promptID))
  const toggleIncludeContext = (includeContext: boolean) => updateItem({ ...items[index], includeContext })

  return (
    <RefreshContext.Provider value={{ refreshPrompt: () => promptCache.refreshPrompt(node.promptID).then(_ => {}) }}>
      <div className='flex flex-col justify-between flex-grow h-full gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <PromptSelector
            prompts={project.prompts}
            selectedPrompt={project.prompts.find(prompt => prompt.id === node.promptID)}
            onSelectPrompt={replacePrompt}
          />
          {outputMapper(node)}
        </div>
        {items.slice(0, index).some(IsPromptChainItem) && (
          <div className='self-start'>
            <Checkbox
              label='Include previous context into prompt'
              checked={!!node.includeContext}
              setChecked={toggleIncludeContext}
            />
          </div>
        )}
        {loadedPrompt && activeVersion && (
          <>
            <VersionTimeline
              prompt={loadedPrompt}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={<Label>Prompt Version</Label>}
            />
            <PromptPanel
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              checkProviderAvailable={checkProviderAvailable}
            />
          </>
        )}
      </div>
    </RefreshContext.Provider>
  )
}

function PromptSelector({
  prompts,
  selectedPrompt,
  onSelectPrompt,
}: {
  prompts: Prompt[]
  selectedPrompt?: Prompt
  onSelectPrompt: (promptID: number) => void
}) {
  return (
    <div className='flex items-center self-start gap-4'>
      <Label>Prompt</Label>
      <DropdownMenu value={selectedPrompt?.id} onChange={value => onSelectPrompt(Number(value))}>
        {prompts.map((prompt, index) => (
          <option key={index} value={prompt.id}>
            {prompt.name}
          </option>
        ))}
      </DropdownMenu>
    </div>
  )
}
