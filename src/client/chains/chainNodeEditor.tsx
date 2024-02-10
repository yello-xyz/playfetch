import { ChainItem, PromptVersion } from '@/types'
import PromptNodeEditor from './promptNodeEditor'
import { IsBranchChainItem, IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from './chainNode'
import CodeNodeEditor from './codeNodeEditor'
import Button, { PendingButton } from '@/src/client/components/button'
import { useState } from 'react'
import useSavePrompt from '@/src/client/prompts/useSavePrompt'
import { ChainItemCache } from './useChainItemCache'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import useInitialState from '@/src/client/components/useInitialState'
import QueryNodeEditor from './queryNodeEditor'
import BranchNodeEditor from './branchNodeEditor'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import { GetChainItemsSaveKey } from './chainItems'

export default function ChainNodeEditor({
  items,
  saveItems,
  activeIndex,
  setDirty,
  itemCache,
  dismiss,
  variables,
}: {
  items: ChainItem[]
  saveItems: (items: ChainItem[]) => void
  activeIndex: number
  setDirty: (dirty: boolean) => void
  itemCache: ChainItemCache
  dismiss: () => void
  variables: string[]
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
  const activePrompt = isPromptChainItemActive ? itemCache.promptForItem(activeItem) : undefined
  const initialActivePromptVersion = isPromptChainItemActive ? itemCache.versionForItem(activeItem) : undefined
  const [activePromptVersion, setActivePromptVersion] = useInitialState(
    initialActivePromptVersion,
    (a, b) => a?.id === b?.id
  )
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activePromptVersion, setActivePromptVersion)

  const updateVersion = (version?: PromptVersion) => {
    setModifiedVersion(version)
    updatePromptDirty(!!activePromptVersion && !!version && !PromptVersionsAreEqual(activePromptVersion, version))
  }

  const selectVersion = (version?: PromptVersion) => {
    isPromptChainItemActive && savePrompt(() => itemCache.refreshItem(activeItem.promptID))
    setActivePromptVersion(version)
    updatePromptDirty(false)
    if (version) {
      updateActiveItem({ ...activeItem, versionID: version.id })
    }
  }

  const setDialogPrompt = useModalDialogPrompt()

  const saveAndClose = async () => {
    if (isPromptChainItemActive) {
      savePrompt().then(versionID => versionID && saveItems(itemsWithUpdate({ ...activeItem, versionID })))
    } else {
      saveItems(updatedItems)
    }
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

  return (
    <>
      <div className='flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden'>
        {IsPromptChainItem(activeItem) && (
          <PromptNodeEditor
            item={activeItem}
            itemCache={itemCache}
            selectVersion={selectVersion}
            setModifiedVersion={updateVersion}
            variables={variables}
          />
        )}
        {IsCodeChainItem(activeItem) && (
          <CodeNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} variables={variables} />
        )}
        {IsBranchChainItem(activeItem) && (
          <BranchNodeEditor
            key={activeIndex}
            index={activeIndex}
            items={updatedItems}
            updateItems={updateItems}
            variables={variables}
          />
        )}
        {IsQueryChainItem(activeItem) && (
          <QueryNodeEditor key={activeIndex} item={activeItem} updateItem={updateActiveItem} variables={variables} />
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
