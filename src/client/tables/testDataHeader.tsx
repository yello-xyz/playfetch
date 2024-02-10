import { useState } from 'react'
import { EditableItem } from '../components/headerItem'
import chevronIcon from '@/public/chevron.svg'
import GlobalPopupMenu from '../components/globalPopupMenu'
import PopupMenu, { PopupContent, PopupMenuItem } from '../components/popupMenu'
import { WithDismiss } from '@/src/client/components/globalPopupContext'
import PickNameDialog from '../components/pickNameDialog'
import IconButton from '../components/iconButton'
import ModalDialog, { DialogPrompt } from '../components/modalDialog'

export default function TestDataHeader({
  variable,
  variables,
  staticVariables,
  onRename,
  onDelete,
  grow,
  isFirst,
  isLast,
  inModal,
}: {
  variable: string
  variables: string[]
  staticVariables: string[]
  onRename?: (name: string) => void
  onDelete?: () => void
  grow?: boolean
  isFirst?: boolean
  isLast?: boolean
  inModal?: boolean
}) {
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showDeleteDialogPrompt, setShowDeleteDialogPrompt] = useState(false)
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => {
    onRename?.(name)
    setLabel(undefined)
  }

  const renameColumn = () => setShowPickNamePrompt(true)
  const deleteColumn = () => setShowDeleteDialogPrompt(true)

  const deleteDialogPrompt: DialogPrompt = {
    title: 'Delete table column? This action cannot be undone.',
    destructive: true,
    callback: () => onDelete?.(),
  }

  const showPopupMenu = (): [typeof ModalTestDataHeaderPopupMenu, TestDataHeaderPopupMenuProps] => [
    ModalTestDataHeaderPopupMenu,
    { renameColumn, deleteColumn },
  ]

  const isInUse = variables.includes(variable)
  const isStatic = staticVariables.includes(variable)
  const bgColor = isStatic ? 'bg-pink-25' : isInUse ? 'bg-purple-25' : ''
  const textColor = isStatic ? 'text-pink-400' : isInUse ? 'text-purple-400' : ''

  const baseClass = 'flex items-center px-3 py-1 border-b border-gray-200 h-8'
  const iconClassName = isLast ? 'mr-5' : '-mr-2'

  return (
    <div
      className={`${baseClass} ${isFirst ? '' : 'border-l'} ${grow ? 'grow' : ''}  ${bgColor}`}
      onClick={isInUse || !onRename ? undefined : () => setLabel(variable)}>
      <span className={`flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis ${textColor}`}>
        {label !== undefined ? (
          <EditableItem
            className='pl-0.5 leading-6 select-none bg-blue-25 whitespace-nowrap'
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          `${isStatic ? `{{${variable}}}` : variable}`
        )}
      </span>
      {!isInUse &&
        onRename &&
        onDelete &&
        (inModal ? (
          <InlineTestDataHeaderPopupMenu {...{ iconClassName, renameColumn, deleteColumn }} />
        ) : (
          <GlobalPopupMenu icon={chevronIcon} iconClassName={iconClassName} loadPopup={showPopupMenu} />
        ))}
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Column'
          confirmTitle='Rename'
          label='Name'
          initialName={variable}
          onConfirm={name => onRename?.(name)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
      {showDeleteDialogPrompt && (
        <ModalDialog prompt={deleteDialogPrompt} onDismiss={() => setShowDeleteDialogPrompt(false)}></ModalDialog>
      )}
    </div>
  )
}

export type TestDataHeaderPopupMenuProps = {
  renameColumn: () => void
  deleteColumn: () => void
}

const InlineTestDataHeaderPopupMenu = ({
  renameColumn,
  deleteColumn,
  iconClassName,
}: TestDataHeaderPopupMenuProps & { iconClassName?: string }) => {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const withDismiss = (callback: () => void) => () => {
    setMenuExpanded(false)
    callback()
  }

  return (
    <div className='relative pr-0.5'>
      <IconButton icon={chevronIcon} className={iconClassName} onClick={() => setMenuExpanded(!isMenuExpanded)} />
      <div className='absolute shadow-sm -right-1 top-8'>
        <PopupMenu className='w-44 z-100' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
          <TestDataHeaderPopupMenuItems {...{ renameColumn, deleteColumn, withDismiss }} />
        </PopupMenu>
      </div>
    </div>
  )
}

const ModalTestDataHeaderPopupMenu = ({
  renameColumn,
  deleteColumn,
  withDismiss,
}: TestDataHeaderPopupMenuProps & WithDismiss) => (
  <PopupContent className='w-44'>
    <TestDataHeaderPopupMenuItems {...{ renameColumn, deleteColumn, withDismiss }} />
  </PopupContent>
)

const TestDataHeaderPopupMenuItems = ({
  renameColumn,
  deleteColumn,
  withDismiss,
}: TestDataHeaderPopupMenuProps & WithDismiss) => (
  <>
    <PopupMenuItem title='Rename Column' callback={withDismiss(renameColumn)} first />
    <PopupMenuItem title='Delete Column' callback={withDismiss(deleteColumn)} separated destructive last />
  </>
)
