import { Project } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

export default function ProjectPopupMenu({
  project,
  isMenuExpanded,
  setIsMenuExpanded,
  canLeave,
  canDelete,
  onRefresh,
  onDeleteOrLeave,
}: {
  project: Project
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  canLeave: boolean
  canDelete: boolean
  onRefresh: () => void
  onDeleteOrLeave: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const leaveProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to leave this project?',
      callback: () => api.leaveProject(project.id).then(onDeleteOrLeave),
      destructive: true,
    })
  }

  const deleteProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this project and ALL its prompts? This action cannot be undone.',
      callback: () => api.deleteProject(project.id).then(onDeleteOrLeave),
      destructive: true,
    })
  }

  const renameProject = () => {
    setIsMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename Project' callback={renameProject} />
        {canLeave && <PopupMenuItem separated destructive title='Leave Project' callback={leaveProject} />}
        {canDelete && <PopupMenuItem separated destructive title='Delete Project' callback={deleteProject} />}
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Project'
          confirmTitle='Rename'
          label='Name'
          initialName={project.name}
          onConfirm={name => api.renameProject(project.id, name).then(onRefresh)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
