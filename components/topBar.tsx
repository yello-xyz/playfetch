import { ActiveChain, ActiveProject, ActivePrompt, User } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import { ReactNode, useState } from 'react'
import { UserAvatar } from './userSidebarItem'
import ProjectPopupMenu from './projectPopupMenu'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import ProjectItemPopupMenu from './projectItemPopupMenu'

export default function TopBar({
  activeProject,
  activeItem,
  addLabel,
  onAddItem,
  onRefreshItem,
  onDeleteItem,
  showComments,
  setShowComments,
  children,
}: {
  activeProject: ActiveProject
  activeItem?: ActivePrompt | ActiveChain
  addLabel: string
  onAddItem: (projectID: number) => void
  onRefreshItem: () => void
  onDeleteItem: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  children?: ReactNode
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const promptHasComments =
    activeItem && 'versions' in activeItem && (activeItem?.versions ?? []).some(version => version.comments.length > 0)

  return (
    <>
      <div className='flex flex-col'>
        <div className={`z-10 flex items-center justify-between gap-4 px-6 ${children ? 'pt-4' : 'py-3.5'}`}>
          <div className='relative flex gap-1 text-base justify-self-start'>
            <Icon icon={projectIcon} />
            {activeItem && (
              <>
                <span className='cursor-pointer'>{activeProject.name}</span>
                <span className='font-medium'>{' / '}</span>
              </>
            )}
            <div className='relative flex cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
              <span className='font-medium'>{activeItem?.name ?? activeProject.name}</span>
              <Icon icon={chevronIcon} />
              <div className='absolute right-0 top-8'>
                {activeItem ? (
                  <ProjectItemPopupMenu
                    item={activeItem}
                    isMenuExpanded={isMenuExpanded}
                    setIsMenuExpanded={setIsMenuExpanded}
                    onRefresh={onRefreshItem}
                    onDelete={onDeleteItem}
                  />
                ) : (
                  <ProjectPopupMenu
                    project={activeProject!}
                    isMenuExpanded={isMenuExpanded}
                    setIsMenuExpanded={setIsMenuExpanded}
                  />
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            {<UserAvatars users={activeProject?.users ?? activeItem?.users ?? []} />}
            {activeProject && (
              <TopBarButton title={addLabel} icon={addIcon} onClick={() => onAddItem(activeProject.id)} />
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

export function UserAvatars({ users }: { users: User[] }) {
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

export function TopBarButton({
  title,
  icon,
  onClick,
}: {
  title?: string
  icon?: StaticImageData
  onClick: () => void
}) {
  return (
    <div
      className='flex items-center gap-1 px-2 py-1 font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100'
      onClick={onClick}>
      {icon && <Icon icon={icon} />}
      {title && <div className={icon ? 'pr-2' : 'px-2 py-0.5'}>{title}</div>}
    </div>
  )
}
