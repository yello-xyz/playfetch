import { PopupContent, PopupMenuItem } from '../popupMenu'
import { Chain, ProjectItemIsChain, Prompt } from '@/types'
import api from '../../src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '../../src/client/context/projectContext'
import { useRouter } from 'next/router'
import { TableRoute } from '@/src/common/clientRoute'
import useModalDialogPrompt from '../../src/client/context/modalDialogContext'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

export type TestDataPopupMenuProps = {
  parentItem: Prompt | Chain
  isDataEmpty: boolean
  onReplaceData?: () => void
}
export default function TestDataPopupMenu({
  parentItem,
  isDataEmpty,
  onReplaceData,
  withDismiss,
}: TestDataPopupMenuProps & WithDismiss) {
  const router = useRouter()
  const refreshProject = useRefreshProject()
  const setDialogPrompt = useModalDialogPrompt()

  const dismiss = (callback?: () => void) => (callback ? withDismiss(callback) : undefined)

  const exportInputs = async () => {
    const tableID = ProjectItemIsChain(parentItem)
      ? await api.exportChainInputs(parentItem.id)
      : await api.exportPromptInputs(parentItem.id)
    refreshProject()
    return tableID
  }

  const exportData =
    parentItem.tableID || isDataEmpty
      ? undefined
      : () => exportInputs().then(tableID => router.push(TableRoute(parentItem.projectID, tableID)))

  const replaceInputs = useReplaceInputs(parentItem)
  const resetInputs = () => replaceInputs(null)

  const resetData = isDataEmpty
    ? undefined
    : parentItem.tableID
      ? resetInputs
      : () => {
          setDialogPrompt({
            title: 'Confirm Reset Test Data',
            content:
              'To retain the current test data, select Save below to save it in a reusable object before proceeding. ' +
              'Resetting the data cannot be undone once confirmed.',
            confirmTitle: 'Save and Reset',
            alternativeTitle: 'Reset',
            callback: () => exportInputs().then(resetInputs),
            alternativeCallback: resetInputs,
          })
        }

  const replaceData = onReplaceData
    ? parentItem.tableID || isDataEmpty
      ? onReplaceData
      : () => {
          setDialogPrompt({
            title: 'Confirm Replace Test Data',
            content:
              'Replacing the test data will overwrite the existing data. ' +
              'To retain the current test data, select Save below to save it in a reusable object before proceeding. ' +
              'Replacing the data cannot be undone once confirmed.',
            confirmTitle: 'Save and Replace',
            alternativeTitle: 'Replace',
            callback: () => exportInputs().then(onReplaceData),
            alternativeCallback: onReplaceData,
          })
        }
    : undefined

  return (
    <PopupContent className='w-44'>
      <PopupMenuItem title='Replace Test Data' callback={dismiss(replaceData)} first />
      <PopupMenuItem title='Save Test Data' callback={dismiss(exportData)} />
      <PopupMenuItem
        title='Reset Test Data'
        callback={dismiss(resetData)}
        separated
        destructive={!parentItem.tableID}
        last
      />
    </PopupContent>
  )
}

export function useReplaceInputs(parentItem: Prompt | Chain) {
  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()

  return async (tableID: number | null) => {
    await (ProjectItemIsChain(parentItem)
      ? api.replaceChainInputs(parentItem.id, tableID)
      : api.replacePromptInputs(parentItem.id, tableID))
    refreshProject()
    refreshActiveItem()
  }
}
