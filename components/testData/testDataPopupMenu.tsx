import PopupMenu, { PopupMenuItem } from '../popupMenu'
import { Chain, ProjectItemIsChain, Prompt } from '@/types'
import api from '../../src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '../../src/client/context/projectContext'
import { useRouter } from 'next/router'
import { TableRoute } from '@/src/common/clientRoute'
import useModalDialogPrompt from '../../src/client/context/modalDialogContext'

export default function TestDataPopupMenu({
  parentItem,
  isDataEmpty,
  onReplaceData,
  isMenuExpanded,
  setMenuExpanded,
}: {
  parentItem: Prompt | Chain
  isDataEmpty: boolean
  onReplaceData?: () => void
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
}) {
  const router = useRouter()
  const refreshProject = useRefreshProject()
  const setDialogPrompt = useModalDialogPrompt()

  const withDismiss = (callback?: () => void) =>
    callback
      ? () => {
          setMenuExpanded(false)
          callback()
        }
      : callback

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
    <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
      <PopupMenuItem title='Replace Test Data' callback={withDismiss(replaceData)} first />
      <PopupMenuItem title='Save Test Data' callback={withDismiss(exportData)} />
      <PopupMenuItem
        title='Reset Test Data'
        callback={withDismiss(resetData)}
        separated
        destructive={!parentItem.tableID}
        last
      />
    </PopupMenu>
  )
}

export function useReplaceInputs(parentItem: Prompt | Chain) {
  const refreshActiveItem = useRefreshActiveItem()

  return (tableID: number | null) =>
    (ProjectItemIsChain(parentItem)
      ? api.replaceChainInputs(parentItem.id, tableID)
      : api.replacePromptInputs(parentItem.id, tableID)
    ).then(refreshActiveItem)
}
