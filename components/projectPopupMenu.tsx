import { Project, Workspace } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import MoveProjectDialog from './moveProjectDialog'

export default function ProjectPopupMenu({
  project,
  isMenuExpanded,
  setIsMenuExpanded,
  workspaces,
  isSharedProject,
  onRefresh,
  onDeleted,
}: {
  project: Project
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  workspaces: Workspace[]
  isSharedProject: boolean
  onRefresh: () => void
  onDeleted: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showMoveProjectDialog, setShowMoveProjectDialog] = useState(false)

  const leaveProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to leave this project?',
      callback: () => api.leaveProject(project.id).then(onDeleted),
      destructive: true,
    })
  }

  const deleteProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this project and ALL its prompts? This action cannot be undone.',
      callback: () => api.deleteProject(project.id).then(onDeleted),
      destructive: true,
    })
  }

  const renameProject = () => {
    setIsMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  const moveProject = () => {
    setIsMenuExpanded(false)
    setShowMoveProjectDialog(true)
  }

  return (
    <>
      <PopupMenu className='w-44' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename Project' callback={renameProject} />
        {!isSharedProject && <PopupMenuItem title='Move to Workspace' callback={moveProject} />}
        {isSharedProject && <PopupMenuItem separated destructive title='Leave Project' callback={leaveProject} />}
        {!isSharedProject && <PopupMenuItem separated destructive title='Delete Project' callback={deleteProject} />}
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
      {showMoveProjectDialog && workspaces && (
        <MoveProjectDialog
          workspaces={workspaces}
          project={project}
          onConfirm={workspaceID => api.moveProject(project.id, workspaceID).then(onRefresh)}
          onDismiss={() => setShowMoveProjectDialog(false)}
        />
      )}
    </>
  )
}
