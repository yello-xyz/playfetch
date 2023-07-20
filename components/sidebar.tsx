import { ReactNode } from 'react'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import Link from 'next/link'

export default function Sidebar({ children }: { children: ReactNode }) {
  return <div className='flex flex-col gap-6 px-2 py-4 overflow-y-auto border-r border-gray-200'>{children}</div>
}

export function SidebarSection({
  className,
  title,
  children,
}: {
  className?: string
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`${className ?? ''} flex flex-col gap-0.5`}>
      {title && <div className='px-4 py-1 text-xs font-medium text-gray-400'>{title}</div>}
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
}: {
  title: string
  icon?: StaticImageData
  active?: boolean
  onClick?: () => void
  link?: string
}) {
  const activeClass = 'bg-gray-100 rounded-lg'
  const baseClass = 'flex gap-1 items-center px-4 py-1 cursor-pointer'
  const className = `${baseClass} ${active ? activeClass : ''} hover:${activeClass}`
  const LinkWrapper = ({ children }: { children: ReactNode }) =>
    link ? <Link href={link}>{children}</Link> : <>{children}</>
  return (
    <LinkWrapper>
      <div className={className} onClick={onClick}>
        {icon && <Icon icon={icon} />}
        <div className='w-40 overflow-hidden font-normal text-ellipsis whitespace-nowrap'>{title}</div>
      </div>
    </LinkWrapper>
  )
}
