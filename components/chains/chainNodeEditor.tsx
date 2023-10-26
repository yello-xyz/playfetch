import { ChainItem, PromptVersion } from '@/types'
import PromptNodeEditor from './promptNodeEditor'
import { IsBranchChainItem, IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from './chainNode'
import CodeNodeEditor from './codeNodeEditor'
import Button, { PendingButton } from '../button'
import { useState } from 'react'
import useSavePrompt from '@/src/client/hooks/useSavePrompt'
import { ChainPromptCache } from '../../src/client/hooks/useChainPromptCache'
import { GetChainItemsSaveKey } from './chainView'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import useInitialState from '@/src/client/hooks/useInitialState'
import QueryNodeEditor from './queryNodeEditor'
import BranchNodeEditor from './branchNodeEditor'

export default function ChainNodeEditor({
  items,
  saveItems,
  activeIndex,
  setDirty,
  promptCache,
  dismiss,
}: {
  items: ChainItem[]
  saveItems: (items: ChainItem[]) => void
  activeIndex: number
  setDirty: (dirty: boolean) => void
  promptCache: ChainPromptCache
  dismiss: () => void
}) {
  const [updatedItems, setUpdatedItems] = useInitialState(items, (a, b) => a.length === b.length)

  const itemsWithUpdate = (item: ChainItem) => [
    ...updatedItems.slice(0, activeIndex),
    item,
    ...updatedItems.slice(activeIndex + 1),
  ]

  const updateActiveItem = (item: ChainItem) => {
    const updatedItems = itemsWithUpdate(item)
    setUpdatedItems(updatedItems)
    updateItemsDirty(GetChainItemsSaveKey(items) !== GetChainItemsSaveKey(updatedItems))
  }

  const [areItemsDirty, setItemsDirty] = useState(false)
  const [isPromptDirty, setPromptDirty] = useState(false)
  const updateDirtyState = (itemsDirty: boolean, promptDirty: boolean) => {
    setItemsDirty(itemsDirty)
    setPromptDirty(promptDirty)
    setDirty(itemsDirty || promptDirty)
  }
  const updateItemsDirty = (itemsDirty: boolean) => updateDirtyState(itemsDirty, isPromptDirty)
  const updatePromptDirty = (promptDirty: boolean) => updateDirtyState(areItemsDirty, promptDirty)

  const activeItem = updatedItems[activeIndex] ?? items[activeIndex]
  const isPromptChainItemActive = IsPromptChainItem(activeItem)
  const activePrompt = isPromptChainItemActive ? promptCache.promptForItem(activeItem) : undefined
  const initialActivePromptVersion = isPromptChainItemActive ? promptCache.versionForItem(activeItem) : undefined
  const [activePromptVersion, setActivePromptVersion] = useState(initialActivePromptVersion)
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activePromptVersion, setActivePromptVersion)

  const updateVersion = (version?: PromptVersion) => {
    setModifiedVersion(version)
    updatePromptDirty(!!activePromptVersion && !!version && !PromptVersionsAreEqual(activePromptVersion, version))
  }

  const selectVersion = (version?: PromptVersion) => {
    saveAndRefreshPrompt()
    setActivePromptVersion(version)
    updatePromptDirty(false)
    if (version) {
      updateActiveItem({ ...activeItem, versionID: version.id })
    }
  }

  const saveAndRefreshPrompt = (onSavePrompt?: (versionID: number) => void) => {
    if (isPromptChainItemActive) {
      return savePrompt(async versionID => {
        onSavePrompt?.(versionID)
        promptCache.refreshPrompt(activeItem.promptID)
      })
    }
  }

  const colorClass = IsPromptChainItem(activeItem) ? 'bg-white' : 'bg-gray-25'

  const saveAndClose = async () => {
    saveItems(updatedItems)
    await saveAndRefreshPrompt(versionID => saveItems(itemsWithUpdate({ ...activeItem, versionID })))
    dismiss()
  }

  return (
    <>
      <div className={`flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden ${colorClass}`}>
        {IsPromptChainItem(activeItem) && (
          <PromptNodeEditor
            item={activeItem}
            promptCache={promptCache}
            selectVersion={selectVersion}
            setModifiedVersion={updateVersion}
          />
        )}
        {IsCodeChainItem(activeItem) && (
          <CodeNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} />
        )}
        {/* // TODO updating a branch node may require updating or deleting other nodes as well */}
        {IsBranchChainItem(activeItem) && (
          <BranchNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} />
        )}
        {IsQueryChainItem(activeItem) && (
          <QueryNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} />
        )}
        <div className='flex items-center justify-end w-full gap-2 px-4'>
          <Button type='outline' onClick={dismiss}>
            Cancel
          </Button>
          <PendingButton title='Save and close' pendingTitle='Saving' onClick={saveAndClose} />
        </div>
      </div>
    </>
  )
}
