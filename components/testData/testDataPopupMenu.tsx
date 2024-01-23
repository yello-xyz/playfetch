import { PopupContent, PopupMenuItem } from '../popupMenu'
import { Chain, ProjectItemIsChain, Prompt } from '@/types'
import api from '../../src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '../../src/client/context/projectContext'
import { useRouter } from 'next/router'
import { TableRoute } from '@/src/common/clientRoute'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { DialogPrompt } from '../modalDialog'

export type TestDataPopupMenuProps = {
  parentItem: Prompt | Chain
  isDataEmpty: boolean
  setDialogPrompt: (prompt: DialogPrompt) => void
  replaceTitle: string
  onReplaceData?: () => void
  onExportData?: () => void
}

export default function TestDataPopupMenu({
  parentItem,
  isDataEmpty,
  setDialogPrompt,
  replaceTitle,
  onReplaceData,
  onExportData,
  withDismiss,
}: TestDataPopupMenuProps & WithDismiss) {
  const router = useRouter()
  const refreshProject = useRefreshProject()

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
      <PopupMenuItem title={replaceTitle} callback={dismiss(replaceData)} first />
      <PopupMenuItem title='Save Test Data' callback={dismiss(exportData)} />
      <PopupMenuItem title='Export as CSV' callback={dismiss(onExportData)} />
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
    return refreshActiveItem()
  }
}
