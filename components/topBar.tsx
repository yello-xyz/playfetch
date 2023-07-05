import { ActiveProject, ActivePrompt, Comment, Project, User } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import commentIcon from '@/public/comment.svg'
import chevronIcon from '@/public/chevron.svg'
import { ReactNode, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import { useRefreshProject, useRefreshPrompt } from './refreshContext'
import { UserAvatar } from './userSidebarItem'
import ProjectPopupMenu from './projectPopupMenu'
import Icon from './icon'
import { StaticImageData } from 'next/image'

export default function TopBar({
  projects = [],
  activeProject,
  activePrompt,
  onAddPrompt,
  onSelectProject,
  onToggleComments,
  children,
}: {
  projects: Project[]
  activeProject?: ActiveProject
  activePrompt?: ActivePrompt
  onAddPrompt: (projectID: number) => void
  onSelectProject: (projectID: number) => void
  onToggleComments: () => void
  children?: ReactNode
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshProject = useRefreshProject()
  const refreshPrompt = useRefreshPrompt()
  const onRefresh = activeProject ? refreshProject : refreshPrompt

  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name
  const promptHasComments = (activePrompt?.versions ?? []).some(version => version.comments.length > 0)

  return (
    <>
      <div className='flex flex-col'>
        <div className={`z-10 flex items-center justify-between gap-4 px-6 ${children ? 'pt-4' : 'py-4'}`}>
          <div className='relative flex gap-1 py-2 text-base justify-self-start'>
            <Icon icon={projectIcon} />
            {activePrompt && (
              <>
                <span className='cursor-pointer' onClick={() => onSelectProject(activePrompt.projectID)}>
                  {promptProjectName}
                </span>
                <span className='font-medium'>{' / '}</span>
              </>
            )}
            {activeProject && activeProject.isUserProject ? (
              <span className='font-medium'>{activeProject.name}</span>
            ) : (
              <div className='relative flex cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
                <span className='font-medium'>{activeProject?.name ?? activePrompt?.name}</span>
                <Icon icon={chevronIcon} />
                <div className='absolute right-0 top-8'>
                  {activePrompt && (
                    <PromptPopupMenu
                      prompt={activePrompt}
                      projects={projects}
                      isMenuExpanded={isMenuExpanded}
                      setIsMenuExpanded={setIsMenuExpanded}
                      onRefresh={onRefresh}
                    />
                  )}
                  {activeProject && (
                    <ProjectPopupMenu
                      project={activeProject!}
                      isMenuExpanded={isMenuExpanded}
                      setIsMenuExpanded={setIsMenuExpanded}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div className='flex items-center gap-4'>
            {<UserAvatars users={activeProject?.users ?? activePrompt?.users ?? []} />}
            {activeProject && (
              <TopBarButton title='New Prompt' icon={addIcon} onClick={() => onAddPrompt(activeProject.id)} />
            )}
            {promptHasComments && <TopBarButton icon={commentIcon} onClick={onToggleComments} />}
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

function TopBarButton({ title, icon, onClick }: { title?: string; icon?: StaticImageData; onClick: () => void }) {
  return (
    <div
      className='flex items-center gap-1 px-2 py-1 font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100'
      onClick={onClick}>
      {icon && <Icon icon={icon} />}
      {title && <div className='pr-2'>{title}</div>}
    </div>
  )
}
