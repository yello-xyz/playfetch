import { Project, Prompt } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import PickProjectDialog from './pickProjectDialog'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

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
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showPickProjectPrompt, setShowPickProjectPrompt] = useState(false)

  const deletePrompt = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      callback: () => api.deletePrompt(prompt.id).then(onRefresh),
      destructive: true,
    })
  }

  const renamePrompt = () => {
    setIsMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  const movePrompt = () => {
    setIsMenuExpanded(false)
    setShowPickProjectPrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename' callback={renamePrompt} />
        {projects.length > 1 && <PopupMenuItem title='Move to project' callback={movePrompt} />}
        <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
      </PopupMenu>
      {showPickProjectPrompt && (
        <PickProjectDialog
          key={prompt.projectID}
          projects={projects}
          prompt={prompt}
          onConfirm={(projectID: number) => api.movePrompt(prompt.id, projectID).then(onRefresh)}
          onDismiss={() => setShowPickProjectPrompt(false)}
        />
      )}
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Prompt'
          confirmTitle='Rename'
          label='Name'
          initialName={prompt.name}
          onConfirm={name => api.renamePrompt(prompt.id, name).then(onRefresh)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
