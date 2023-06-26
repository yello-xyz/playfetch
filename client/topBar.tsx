import { ActiveProject, Project, Prompt, User } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import chevronIcon from '@/public/chevron.svg'
import { ReactNode, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import { useRefreshProject, useRefreshPrompt, useSelectProject } from './refreshContext'
import { UserAvatar } from './userSidebarItem'

export default function TopBar({
  projects = [],
  activeProject,
  activePrompt,
  onAddPrompt,
  children,
}: {
  projects: Project[]
  activeProject?: ActiveProject
  activePrompt?: Prompt
  onAddPrompt: (projectID: number) => void
  children?: ReactNode
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const onRefresh = activeProject ? useRefreshProject() : useRefreshPrompt()
  const selectProject = useSelectProject()

  const projectName = projects.find(p => p.id === activeProject?.id)?.name
  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name

  return (
    <>
      <div className='flex flex-col'>
        <div className={`z-10 flex items-center justify-between gap-4 px-6 ${children ? 'pt-4' : 'py-4'}`}>
          <div className='relative flex gap-1 py-2 text-base justify-self-start'>
            {(projectName || promptProjectName) && <img className='w-6 h-6' src={projectIcon.src} />}
            {activePrompt && promptProjectName && (
              <span className='cursor-pointer' onClick={() => selectProject(activePrompt.projectID)}>
                {promptProjectName}
              </span>
            )}
            {promptProjectName && <span className='font-medium'>{' / '}</span>}
            {activePrompt ? (
              <div className='relative flex cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
                <span className='font-medium'>{activePrompt.name}</span>
                <img className='w-6 h-6' src={chevronIcon.src} />
                <div className='absolute right-0 top-8'>
                  <PromptPopupMenu
                    prompt={activePrompt}
                    projects={projects}
                    isMenuExpanded={isMenuExpanded}
                    setIsMenuExpanded={setIsMenuExpanded}
                    onRefresh={onRefresh}
                  />
                </div>
              </div>
            ) : (
              <span className='font-medium'>{projectName ?? 'Prompts'}</span>
            )}
          </div>
          <div className='flex items-center gap-4'>
            {activeProject && <UserAvatars users={activeProject.users} />}
            {activeProject && (
              <TopBarButton title='New Prompt' icon={addIcon.src} onClick={() => onAddPrompt(activeProject.id)} />
            )}
          </div>
        </div>
        <div className='flex items-center'>
          <Divider />
          {children}
          <Divider />
        </div>
      </div>
    </>
  )
}

function UserAvatars({ users }: { users: User[] }) {
  return users.length > 1 ? (
    <div
      className='flex flex-row-reverse space-x-reverse -space-x-[50px]'
      style={{ marginRight: `${(users.length - 1) * 22}px` }}>
      {users.map((user, index) => (
        <div key={index}>
          <UserAvatar user={user} border />
        </div>
      ))}
    </div>
  ) : null
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
