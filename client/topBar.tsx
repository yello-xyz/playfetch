import { Project, Prompt } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import ModalDialog, { DialogPrompt } from './modalDialog'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import PickProjectDialog, { PickProjectPrompt } from './pickPromptDialog'

export default function TopBar({
  projects = [],
  activeProjectID,
  activePrompt,
  onSelectProject,
  onAddPrompt,
  onRefreshPrompt,
}: {
  projects?: Project[]
  activeProjectID: number | null | undefined
  activePrompt?: Prompt
  onSelectProject: (projectID: number | null) => void
  onAddPrompt: (projectID: number | null) => void
  onRefreshPrompt: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()
  const [pickProjectPrompt, setPickProjectPrompt] = useState<PickProjectPrompt>()

  const projectName = projects.find(p => p.id === activeProjectID)?.name
  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name

  return (
    <>
      <div className='z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200'>
        <div className='relative flex gap-1 text-base justify-self-start'>
          {(projectName || promptProjectName) && <img className='w-6 h-6' src={projectIcon.src} />}
          {promptProjectName && (
            <span className='cursor-pointer' onClick={() => onSelectProject(activePrompt!.projectID)}>
              {promptProjectName}
            </span>
          )}
          {promptProjectName && <span className='font-medium'>{' / '}</span>}
          {activePrompt ? (
            <div className='relative flex cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
              <span className='font-medium'>{activePrompt.name}</span>
              <img className='w-6 h-6 cursor-pointer' src={chevronIcon.src} />
              {isMenuExpanded && (
                <div className='absolute right-0 top-8'>
                  <PromptPopupMenu
                    prompt={activePrompt}
                    isMenuExpanded={isMenuExpanded}
                    setIsMenuExpanded={setIsMenuExpanded}
                    onRefresh={onRefreshPrompt}
                    setDialogPrompt={setDialogPrompt}
                    setPickNamePrompt={setPickNamePrompt}
                    setPickProjectPrompt={setPickProjectPrompt}
                  />
                </div>
              )}
            </div>
          ) : (
            <span className='font-medium'>{projectName ?? 'Prompts'}</span>
          )}
        </div>
        {activeProjectID !== undefined && (
          <TopBarButton title='New Prompt' icon={addIcon.src} onClick={() => onAddPrompt(activeProjectID)} />
        )}
      </div>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
      <PickNameDialog prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
      <PickProjectDialog
        key={pickProjectPrompt?.initialProjectID}
        projects={projects}
        prompt={pickProjectPrompt}
        setPrompt={setPickProjectPrompt}
      />
    </>
  )
}

function TopBarButton({ title, icon, onClick }: { title: string; icon?: string; onClick: () => void }) {
  return (
    <div
      className='flex items-center gap-1 py-1 pl-2 pr-4 text-sm font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100'
      onClick={onClick}>
      {icon && <img className='w-6 h-6' src={icon} />}
      <div>{title}</div>
    </div>
  )
}
