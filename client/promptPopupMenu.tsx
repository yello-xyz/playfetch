import { Prompt } from "@/types"
import { DialogPrompt } from "./modalDialog"
import { PickNamePrompt } from "./pickNameDialog"
import { PickProjectPrompt } from "./pickPromptDialog"
import api from "./api"
import PopupMenu, { PopupMenuItem } from "./popupMenu"

export default function PromptPopupMenu({
  prompt,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefresh,
  setDialogPrompt,
  setPickNamePrompt,
  setPickProjectPrompt,
}: {
  prompt: Prompt
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
  setDialogPrompt: (prompt: DialogPrompt) => void
  setPickNamePrompt: (prompt: PickNamePrompt) => void
  setPickProjectPrompt?: (prompt: PickProjectPrompt) => void
}) {
  const deletePrompt = () => {
    setDialogPrompt({
      message: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      callback: () => api.deletePrompt(prompt.id).then(onRefresh),
      destructive: true,
    })
  }

  const renamePrompt = () => {
    setPickNamePrompt({
      title: 'Rename Prompt',
      label: 'Name',
      callback: (name: string) => api.renamePrompt(prompt.id, name).then(onRefresh),
      initialName: prompt.name,
    })
  }

  const movePrompt = () => {
    setPickProjectPrompt!({
      callback: (projectID: number) => api.movePrompt(prompt.id, projectID).then(onRefresh),
      initialProjectID: prompt.projectID,
    })
  }

  return (
    <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
      <PopupMenuItem title='Rename' callback={renamePrompt} />
      {setPickProjectPrompt && <PopupMenuItem title='Move to Project' callback={movePrompt} />}
      <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
    </PopupMenu>
  )
}
