import { Project, Prompt } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import chevronIcon from '@/public/chevron.svg'
import { ReactNode, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import ModalDialog, { DialogPrompt } from './modalDialog'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import PickProjectDialog, { PickProjectPrompt } from './pickProjectDialog'

export default function TopBar({
  projects = [],
  activeProjectID,
  activePrompt,
  onSelectProject,
  onAddPrompt,
  onRefreshPrompt,
  children,
}: {
  projects?: Project[]
  activeProjectID: number | null | undefined
  activePrompt?: Prompt
  onSelectProject: (projectID: number | null) => void
  onAddPrompt: (projectID: number | null) => void
  onRefreshPrompt: () => void
  children?: ReactNode
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()
  const [pickProjectPrompt, setPickProjectPrompt] = useState<PickProjectPrompt>()

  const projectName = projects.find(p => p.id === activeProjectID)?.name
  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name

  return (
    <>
      <div className='flex flex-col'>
        <div className={`z-10 flex items-center justify-between gap-4 px-6 ${children ? 'pt-4' : 'py-4'}`}>
          <div className='relative flex gap-1 py-2 text-base justify-self-start'>
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
        <div className='flex items-center'>
          <Divider />
          {children}
          <Divider />
        </div>
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

const Divider = () => <div className='flex-1 h-px bg-gray-200' />

function TopBarButton({ title, icon, onClick }: { title: string; icon?: string; onClick: () => void }) {
  return (
    <div
      className='flex items-center gap-1 py-1 pl-2 pr-4 font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100'
      onClick={onClick}>
      {icon && <img className='w-6 h-6' src={icon} />}
      <div>{title}</div>
    </div>
  )
}
