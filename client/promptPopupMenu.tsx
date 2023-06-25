import { Project, Prompt } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import { useDialogPrompt, usePickNamePrompt } from './modalDialogContext'
import PickProjectDialog, { PickProjectPrompt } from './pickProjectDialog'
import { useState } from 'react'

export default function PromptPopupMenu({
  prompt,
  projects,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefresh,
}: {
  prompt: Prompt
  projects: Project[]
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
}) {
  const setDialogPrompt = useDialogPrompt()
  const setPickNamePrompt = usePickNamePrompt()

  const [showPickProjectPrompt, setShowPickProjectPrompt] = useState(false)

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
    setShowPickProjectPrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename' callback={renamePrompt} />
        {projects.length > 0 && (prompt.projectID === null || projects.length > 1) && (
          <PopupMenuItem title='Move to project' callback={movePrompt} />
        )}
        <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
      </PopupMenu>
      {showPickProjectPrompt && (
        <PickProjectDialog
          key={prompt.projectID}
          projects={projects}
          initialProjectID={prompt.projectID}
          onConfirm={(projectID: number) => api.movePrompt(prompt.id, projectID).then(onRefresh)}
          onDismiss={() => setShowPickProjectPrompt(false)}
        />
      )}
    </>
  )
}
