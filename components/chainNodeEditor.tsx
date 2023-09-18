import { ChainItem, PromptVersion } from '@/types'
import DropdownMenu from './dropdownMenu'
import { PromptCache } from './chainView'
import Label from './label'
import PromptChainNodeEditor from './promptChainNodeEditor'
import { IsCodeChainItem, IsPromptChainItem } from './chainNode'
import CodeChainNodeEditor from './codeChainNodeEditor'
import { ExtractChainVariables } from './chainNodeOutput'
import Button, { PendingButton } from './button'
import { useState } from 'react'
import useSavePrompt from '@/src/client/hooks/useSavePrompt'

export default function ChainNodeEditor({
  items,
  setItems,
  activeIndex,
  promptCache,
  dismiss,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeIndex: number
  promptCache: PromptCache
  dismiss: () => void
}) {
  const [updatedItems, setUpdatedItems] = useState(items)

  const updateItems = (items: ChainItem[], item: ChainItem) => [
    ...items.slice(0, activeIndex),
    item,
    ...items.slice(activeIndex + 1),
  ]

  const updateActiveItem = (item: ChainItem, newItems = updatedItems) => setUpdatedItems(updateItems(newItems, item))

  const activeItem = updatedItems[activeIndex]
  const isPromptChainItemActive = IsPromptChainItem(activeItem)
  const activePrompt = isPromptChainItemActive ? promptCache.promptForItem(activeItem) : undefined
  const initialActivePromptVersion = isPromptChainItemActive ? promptCache.versionForItem(activeItem) : undefined
  const [activePromptVersion, setActivePromptVersion] = useState(initialActivePromptVersion)
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activePromptVersion, setActivePromptVersion)

  const saveAndRefreshPrompt = (onSavePrompt?: (versionID: number) => void) => {
    if (isPromptChainItemActive) {
      return savePrompt(async versionID => {
        onSavePrompt?.(versionID)
        promptCache.refreshPrompt(activeItem.promptID)
      })
    }
  }

  const selectVersion = (version?: PromptVersion) => {
    saveAndRefreshPrompt()
    setActivePromptVersion(version)
    if (version) {
      updateActiveItem({ ...activeItem, versionID: version.id })
    }
  }

  const mapOutput = (output?: string) => {
    const newItems = updatedItems.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    updateActiveItem({ ...newItems[activeIndex], output }, newItems)
  }

  const colorClass = IsPromptChainItem(activeItem) ? 'bg-white' : 'bg-gray-25'

  const saveAndClose = async () => {
    setItems(updatedItems)
    await saveAndRefreshPrompt(versionID => setItems(updateItems(updatedItems, { ...activeItem, versionID })))
    dismiss()
  }

  return (
    <>
      <div className={`flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden ${colorClass}`}>
        {IsPromptChainItem(activeItem) && (
          <PromptChainNodeEditor
            item={activeItem}
            updateItem={updateActiveItem}
            canIncludeContext={items.slice(0, activeIndex).some(IsPromptChainItem)}
            promptCache={promptCache}
            selectVersion={selectVersion}
            setModifiedVersion={setModifiedVersion}
          />
        )}
        {IsCodeChainItem(activeItem) && (
          <CodeChainNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} />
        )}
        <div className='flex items-center justify-end w-full gap-4 px-4'>
          {(IsPromptChainItem(activeItem) || IsCodeChainItem(activeItem)) && (
            <OutputMapper
              key={activeItem.output}
              output={activeItem.output}
              inputs={ExtractChainVariables(items.slice(activeIndex + 1), promptCache, false)}
              onMapOutput={mapOutput}
            />
          )}
          <div className='flex gap-2'>
            <Button type='outline' onClick={dismiss}>
              Cancel
            </Button>
            <PendingButton title='Save and close' pendingTitle='Saving' onClick={saveAndClose} />
          </div>
        </div>
      </div>
    </>
  )
}

function OutputMapper({
  output,
  inputs,
  onMapOutput,
}: {
  output?: string
  inputs: string[]
  onMapOutput: (input?: string) => void
}) {
  return inputs.length > 0 ? (
    <div className='flex-1 self-start py-0.5 flex items-center gap-2'>
      <Label className='whitespace-nowrap'>Map output to</Label>
      <DropdownMenu value={output ?? 0} onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
        <option value={0} disabled>
          Select Input
        </option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            Input “{input}”
          </option>
        ))}
      </DropdownMenu>
    </div>
  ) : null
}
