import { ActiveProject } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import { useRefreshProject, useRefreshProjects, useResetProject } from './refreshContext'

export default function ProjectPopupMenu({
  project,
  isMenuExpanded,
  setIsMenuExpanded,
}: {
  project: ActiveProject
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const refreshProjects = useRefreshProjects()
  const refreshProject = useRefreshProject()
  const resetProject = useResetProject()

  const refresh = () => {
    refreshProject()
    refreshProjects()
  }

  const reset = () => {
    resetProject()
    refreshProjects()
  }

  const leaveProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to leave this project?',
      callback: () => api.leaveProject(project.id).then(reset),
      destructive: true,
    })
  }

  const deleteProject = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this project and ALL its prompts? This action cannot be undone.',
      callback: () => api.deleteProject(project.id).then(reset),
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
        {project.users.length > 1 ? (
          <PopupMenuItem separated destructive title='Leave Project' callback={leaveProject} />
        ) : (
          <PopupMenuItem separated destructive title='Delete Project' callback={deleteProject} />
        )}
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Project'
          confirmTitle='Rename'
          label='Name'
          initialName={project.name}
          onConfirm={name => api.renameProject(project.id, name).then(refresh)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
