import { Project, Prompt } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import PickProjectDialog from './pickProjectDialog'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import { useLoggedInUser } from './userContext'

export default function PromptPopupMenu({
  prompt,
  projects,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefresh,
  onDelete,
}: {
  prompt: Prompt
  projects: Project[]
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
  onDelete?: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showPickProjectPrompt, setShowPickProjectPrompt] = useState(false)

  const deletePrompt = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      callback: () => api.deletePrompt(prompt.id).then(onDelete ?? onRefresh),
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

  const user = useLoggedInUser()
  const properProjects = projects.filter(project => project.id !== user.id)

  // TODO allow to create new project within move flow if there are no projects
  const canMove = properProjects.length > 0

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename' callback={renamePrompt} />
        {canMove && <PopupMenuItem title='Move to project' callback={movePrompt} />}
        <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
      </PopupMenu>
      {showPickProjectPrompt && (
        <PickProjectDialog
          key={prompt.projectID}
          projects={properProjects}
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
