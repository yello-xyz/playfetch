import { Chain, Endpoint, Prompt } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

export default function ProjectItemPopupMenu({
  item,
  reference,
  isMenuExpanded,
  setMenuExpanded,
  onRefresh,
  onDelete,
}: {
  item: Prompt | Chain
  reference: Chain | Endpoint | undefined
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
  onDelete?: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const isPrompt = 'lastVersionID' in item

  const deleteCall = () => (isPrompt ? api.deletePrompt(item.id) : api.deleteChain(item.id))
  const renameCall = (name: string) => (isPrompt ? api.renamePrompt(item.id, name) : api.renameChain(item.id, name))

  const deleteItem = () => {
    setMenuExpanded(false)
    const label = isPrompt ? 'prompt' : 'chain'
    if (reference) {
      const reason = 'name' in reference ? `it is referenced by chain “${reference.name}”` : `has published endpoints`
      setDialogPrompt({
        title: `Cannot delete ${label} because ${reason}.`,
        confirmTitle: 'OK',
        cancellable: false
      })
    } else {
      setDialogPrompt({
        title: `Are you sure you want to delete this ${label}? This action cannot be undone.`,
        callback: () => deleteCall().then(onDelete ?? onRefresh),
        destructive: true,
      })
    }
  }

  const renameItem = () => {
    setMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
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
