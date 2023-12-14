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
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'

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
  const [updatedItems, setUpdatedItems] = useInitialState(
    items,
    (a, b) => GetChainItemsSaveKey(a) === GetChainItemsSaveKey(b)
  )

  const itemsWithUpdate = (item: ChainItem) => [
    ...updatedItems.slice(0, activeIndex),
    item,
    ...updatedItems.slice(activeIndex + 1),
  ]

  const updateItems = (updatedItems: ChainItem[]) => {
    setUpdatedItems(updatedItems)
    updateItemsDirty(GetChainItemsSaveKey(items) !== GetChainItemsSaveKey(updatedItems))
  }

  const updateActiveItem = (item: ChainItem) => updateItems(itemsWithUpdate(item))

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
      return savePrompt(() => promptCache.refreshPrompt(activeItem.promptID)).then(
        versionID => versionID && onSavePrompt?.(versionID)
      )
    }
  }

  const setDialogPrompt = useModalDialogPrompt()

  const saveAndClose = async () => {
    saveItems(updatedItems)
    await saveAndRefreshPrompt(versionID => saveItems(itemsWithUpdate({ ...activeItem, versionID })))
    dismiss()
  }

  const promptSaveAndClose = () => {
    const prunedNodeCount = items.length - updatedItems.length
    if (prunedNodeCount > 0) {
      setDialogPrompt({
        title: `This will prune a branch with ${prunedNodeCount} node${prunedNodeCount > 1 ? 's' : ''} from the chain.`,
        confirmTitle: 'Proceed',
        callback: saveAndClose,
        destructive: true,
      })
    } else {
      saveAndClose()
    }
  }

  const colorClass = IsPromptChainItem(activeItem) ? 'bg-white' : 'bg-gray-25'

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
        {IsBranchChainItem(activeItem) && (
          <BranchNodeEditor key={activeIndex} index={activeIndex} items={updatedItems} updateItems={updateItems} />
        )}
        {IsQueryChainItem(activeItem) && (
          <QueryNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} />
        )}
        <div className='flex items-center justify-end w-full gap-2 px-4'>
          <Button type='outline' onClick={dismiss}>
            Cancel
          </Button>
          <PendingButton title='Save and close' pendingTitle='Saving' onClick={promptSaveAndClose} />
        </div>
      </div>
    </>
  )
}
