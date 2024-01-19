import { useState } from 'react'
import { EditableItem } from '../headerItem'
import chevronIcon from '@/public/chevron.svg'
import GlobalPopupMenu from '../globalPopupMenu'
import { PopupContent, PopupMenuItem } from '../popupMenu'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import PickNameDialog from '../pickNameDialog'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'

export default function TestDataHeader({
  variable,
  variables,
  staticVariables,
  onRename,
  onDelete,
  grow,
  isFirst,
  isLast,
}: {
  variable: string
  variables: string[]
  staticVariables: string[]
  onRename?: (name: string) => void
  onDelete?: () => void
  grow?: boolean
  isFirst?: boolean
  isLast?: boolean
}) {
  const setDialogPrompt = useModalDialogPrompt()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => {
    onRename?.(name)
    setLabel(undefined)
  }

  const showPopupMenu = (): [typeof TestDataHeaderPopupMenu, TestDataHeaderPopupMenuProps] => [
    TestDataHeaderPopupMenu,
    {
      renameColumn: () => setShowPickNamePrompt(true),
      deleteColumn: () =>
        setDialogPrompt({
          title: 'Delete table column? This action cannot be undone.',
          destructive: true,
          callback: () => onDelete?.(),
        }),
    },
  ]

  const isInUse = variables.includes(variable)
  const isStatic = staticVariables.includes(variable)
  const bgColor = isStatic ? 'bg-pink-25' : isInUse ? 'bg-purple-25' : ''
  const textColor = isStatic ? 'text-pink-400' : isInUse ? 'text-purple-400' : ''

  const baseClass = 'flex items-center px-3 py-1 border-b border-gray-200 h-8'

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
      {!isInUse && onRename && onDelete && (
        <GlobalPopupMenu icon={chevronIcon} iconClassName={isLast ? 'mr-5' : '-mr-2'} loadPopup={showPopupMenu} />
      )}
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
    </div>
  )
}

export type TestDataHeaderPopupMenuProps = {
  renameColumn: () => void
  deleteColumn: () => void
}

function TestDataHeaderPopupMenu({
  renameColumn,
  deleteColumn,
  withDismiss,
}: TestDataHeaderPopupMenuProps & WithDismiss) {
  return (
    <PopupContent className='w-44'>
      <PopupMenuItem title='Rename Column' callback={withDismiss(renameColumn)} first />
      <PopupMenuItem title='Delete Column' callback={withDismiss(deleteColumn)} separated destructive last />
    </PopupContent>
  )
}
