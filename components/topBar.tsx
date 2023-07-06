import { ActiveProject, ActivePrompt, Project, User } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import { ReactNode, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import { useRefreshProject, useRefreshPrompt } from './refreshContext'
import { UserAvatar } from './userSidebarItem'
import ProjectPopupMenu from './projectPopupMenu'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import { useLoggedInUser } from './userContext'

export default function TopBar({
  projects = [],
  activeProject,
  activePrompt,
  onAddPrompt,
  onSelectProject,
  showComments,
  setShowComments,
  children,
}: {
  projects: Project[]
  activeProject?: ActiveProject
  activePrompt?: ActivePrompt
  onAddPrompt: (projectID: number) => void
  onSelectProject: (projectID: number) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  children?: ReactNode
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshProject = useRefreshProject()
  const refreshPrompt = useRefreshPrompt()
  const onRefresh = activeProject ? refreshProject : refreshPrompt

  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name
  const promptHasComments = (activePrompt?.versions ?? []).some(version => version.comments.length > 0)

  const user = useLoggedInUser()

  return (
    <>
      <div className='flex flex-col'>
        <div className={`z-10 flex items-center justify-between gap-4 px-6 ${children ? 'pt-4' : 'py-3.5'}`}>
          <div className='relative flex gap-1 text-base justify-self-start'>
            <Icon icon={projectIcon} />
            {activePrompt && (
              <>
                <span className='cursor-pointer' onClick={() => onSelectProject(activePrompt.projectID)}>
                  {promptProjectName}
                </span>
                <span className='font-medium'>{' / '}</span>
              </>
            )}
            {activeProject && activeProject.id === user.id ? (
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
                      onDelete={() => onSelectProject(activePrompt.projectID)}
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
            {promptHasComments && <TopBarButton icon={commentIcon} onClick={() => setShowComments(!showComments)} />}
          </div>
        </div>
        <div className='flex items-center'>
          <Divider />
          {children}
          {showComments ? <CommentDivider /> : <Divider />}
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

const CommentDivider = () => (
  <div className='flex flex-1 h-full'>
    <Divider />
    <Divider width='w-[280px]' />
  </div>
)

const Divider = ({ width }: { width?: string }) => (
  <div className={`h-full ${width ?? 'flex-1'}`}>
    <div className='h-1/2' />
    <div className={`border-t border-gray-200 h-1/2 ${width ? 'border-l' : ''}`} />
  </div>
)

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
