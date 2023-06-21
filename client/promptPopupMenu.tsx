import { Prompt } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import { useDialogPrompt, usePickNamePrompt, usePickProjectPrompt } from './modalDialogContext'

export default function PromptPopupMenu({
  prompt,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefresh,
}: {
  prompt: Prompt
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
}) {
  const setDialogPrompt = useDialogPrompt()
  const setPickNamePrompt = usePickNamePrompt()
  const setPickProjectPrompt = usePickProjectPrompt()

  const deletePrompt = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      message: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      callback: () => api.deletePrompt(prompt.id).then(onRefresh),
      destructive: true,
    })
  }

  const renamePrompt = () => {
    setIsMenuExpanded(false)
    setPickNamePrompt({
      title: 'Rename Prompt',
      label: 'Name',
      callback: (name: string) => api.renamePrompt(prompt.id, name).then(onRefresh),
      initialName: prompt.name,
    })
  }

  const movePrompt = () => {
    setIsMenuExpanded(false)
    setPickProjectPrompt!({
      callback: (projectID: number) => api.movePrompt(prompt.id, projectID).then(onRefresh),
      initialProjectID: prompt.projectID,
    })
  }

  return (
    <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
      <PopupMenuItem title='Rename' callback={renamePrompt} />
      {setPickProjectPrompt && <PopupMenuItem title='Move to project' callback={movePrompt} />}
      <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
    </PopupMenu>
  )
}
