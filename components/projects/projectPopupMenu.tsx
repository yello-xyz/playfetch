import { Project, Workspace } from '@/types'
import api from '@/src/client/api'
import PopupMenu, { PopupMenuItem } from '../popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { useState } from 'react'
import PickNameDialog from '../pickNameDialog'
import MoveProjectPopup, { MoveProjectPopupProps } from './moveProjectPopup'
import useGlobalPopup from '@/src/client/context/globalPopupContext'

export default function ProjectPopupMenu({
  project,
  isMenuExpanded,
  setMenuExpanded,
  workspaces,
  isSharedProject,
  onRefresh,
  onDeleted,
}: {
  project: Project
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  workspaces: Workspace[]
  isSharedProject: boolean
  onRefresh: () => void
  onDeleted: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const leaveProject = () => {
    setMenuExpanded(false)
    setDialogPrompt({
      title: `Are you sure you want to leave “${project.name}”?`,
      content: 'If you leave this project, you will no longer have access to any of its prompts or chains.',
      confirmTitle: 'Leave Shared Project',
      callback: () => api.leaveProject(project.id).then(onDeleted),
      destructive: true,
    })
  }

  const deleteProject = () => {
    setMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this project and ALL its prompts? This action cannot be undone.',
      callback: () => api.deleteProject(project.id).then(onDeleted),
      destructive: true,
    })
  }

  const renameProject = () => {
    setMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  const setPopup = useGlobalPopup<MoveProjectPopupProps>()

  const moveProject = () => {
    setMenuExpanded(false)
    setPopup(MoveProjectPopup, {
      workspaces,
      project,
      selectWorkspace: workspaceID => api.moveProject(project.id, workspaceID).then(onRefresh),
    })
  }

  return (
    <>
      <PopupMenu className='w-48' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
        <PopupMenuItem title='Rename Project…' callback={renameProject} first />
        {!isSharedProject && <PopupMenuItem title='Move to Workspace…' callback={moveProject} />}
        {isSharedProject ? (
          <PopupMenuItem separated destructive title='Leave Project' callback={leaveProject} last />
        ) : (
          <PopupMenuItem separated destructive title='Delete Project' callback={deleteProject} last />
        )}
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
