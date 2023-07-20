import { Chain, Project, Prompt } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import PickProjectDialog from './pickProjectDialog'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

export default function ProjectItemPopupMenu({
  item,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefresh,
  onDelete,
}: {
  item: Prompt | Chain
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
  onDelete?: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const isPrompt = 'lastPrompt' in item

  const deleteCall = () => (isPrompt ? api.deletePrompt(item.id) : api.deleteChain(item.id))
  const renameCall = (name: string) => (isPrompt ? api.renamePrompt(item.id, name) : api.renameChain(item.id, name))

  const deleteItem = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: `Are you sure you want to delete this ${isPrompt ? 'prompt' : 'chain'}? This action cannot be undone.`,
      callback: () => deleteCall().then(onDelete ?? onRefresh),
      destructive: true,
    })
  }

  const renameItem = () => {
    setIsMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename' callback={renameItem} />
        <PopupMenuItem separated destructive title='Delete' callback={deleteItem} />
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title={isPrompt ? 'Rename Prompt' : 'Rename Chain'}
          confirmTitle='Rename'
          label='Name'
          initialName={item.name}
          onConfirm={name => renameCall(name).then(onRefresh)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
