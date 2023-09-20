import { ReactNode } from 'react'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import Link from 'next/link'
import feedbackIcon from '@/public/feedback.svg'

export default function Sidebar({ children }: { children: ReactNode }) {
  return (
    <div className='flex flex-col gap-4 px-2 pt-2 pb-4 overflow-y-auto border-r border-gray-200'>
      {children}
      <FeedbackSection />
    </div>
  )
}

export function FeedbackSection() {
  return (
    <SidebarSection>
      <SidebarButton title='Feedback' icon={feedbackIcon} link='mailto:hello@yello.xyz?subject=PlayFetch Feedback' />
    </SidebarSection>
  )
}

export function SidebarSection({
  className = '',
  title,
  children,
  actionComponent,
}: {
  className?: string
  title?: string
  children: ReactNode
  actionComponent?: ReactNode
}) {
  return (
    <div className={`${className} flex flex-col gap-0.5`}>
      {title && (
        <div className='flex items-center justify-between p-1 pl-4 text-xs font-medium text-gray-400'>
          {title}
          {actionComponent}
        </div>
      )}
      {children}
    </div>
  )
}

export function SidebarButton({
  title,
  icon,
  active = false,
  onClick,
  link,
  actionComponent,
}: {
  title: string
  icon?: StaticImageData
  active?: boolean
  onClick?: () => void
  link?: string
  actionComponent?: ReactNode
}) {
  const activeClass = 'bg-blue-50 '
  const baseHoverClass = 'hover:bg-gray-100'
  const baseClass = 'flex gap-1 items-center pl-3 p-1 cursor-pointer select-none rounded-lg group w-[220px]'
  const className = `${active ? activeClass : baseHoverClass} ${baseClass}`
  return (
    <LinkWrapper link={link}>
      <div className={className} onClick={onClick}>
        {icon && <Icon icon={icon} />}
        <div className='flex-1 w-40 overflow-hidden font-normal text-gray-700 text-ellipsis whitespace-nowrap'>
          {title}
        </div>
        {actionComponent}
      </div>
    </LinkWrapper>
  )
}

function LinkWrapper({ link, children }: { link?: string; children: ReactNode }) {
  return link ? <Link href={link}>{children}</Link> : <>{children}</>
}
