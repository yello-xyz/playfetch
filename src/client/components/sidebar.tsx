import { HTMLAttributeAnchorTarget, ReactNode, useState } from 'react'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import Link from 'next/link'
import documentationIcon from '@/public/help.svg'
import feedbackIcon from '@/public/feedback.svg'
import { EditableItem } from './headerItem'

export default function Sidebar({ children, rightBorder }: { children: ReactNode; rightBorder?: boolean }) {
  const borderClass = rightBorder ? 'border-r border-gray-200' : ''
  return (
    <div className={`flex flex-col h-full gap-3 px-1.5 pt-1.5 pb-1.5 overflow-y-auto ${borderClass}`}>
      {children}
      <FeedbackSection />
    </div>
  )
}

export function FeedbackSection() {
  return (
    <SidebarSection>
      {process.env.NEXT_PUBLIC_DOCS_URL && (
        <SidebarButton
          title='Documentation'
          icon={documentationIcon}
          target='_blank'
          link={process.env.NEXT_PUBLIC_DOCS_URL}
        />
      )}
      {!!process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
        <SidebarButton
          title='Support'
          icon={feedbackIcon}
          link={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}?subject=PlayFetch Feedback`}
        />
      )}
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
        <div className='flex items-center justify-between p-1 pl-2.5 pr-0 text-xs font-medium text-gray-400'>
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
  target,
  actionComponent,
  prefetch = true,
  onRename,
}: {
  title: string
  icon?: StaticImageData
  active?: boolean
  onClick?: () => void
  link?: string
  target?: HTMLAttributeAnchorTarget
  actionComponent?: ReactNode
  prefetch?: boolean
  onRename?: (name: string) => Promise<void>
}) {
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => onRename?.(name).then(() => setLabel(undefined))

  const activeClass = 'bg-blue-50'
  const baseHoverClass = 'hover:bg-gray-100'
  const baseClass = 'flex gap-1 items-center pl-3 p-1 cursor-pointer select-none rounded-lg group w-[196px] h-8'
  const className = `${active ? activeClass : baseHoverClass} ${baseClass}`
  return (
    <LinkWrapper link={link} target={target} prefetch={prefetch}>
      <div className={className} onClick={active && onRename ? () => setLabel(title) : onClick}>
        {icon && <Icon icon={icon} />}
        {label !== undefined ? (
          <EditableItem
            className='pl-0.5 leading-6 select-none bg-blue-25 whitespace-nowrap'
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          <>
            <div className='flex-1 w-40 overflow-hidden font-normal text-gray-700 text-ellipsis whitespace-nowrap'>
              {title}
            </div>
            {actionComponent}
          </>
        )}
      </div>
    </LinkWrapper>
  )
}

function LinkWrapper({
  link,
  target,
  children,
  prefetch,
}: {
  link?: string
  target?: HTMLAttributeAnchorTarget
  children: ReactNode
  prefetch: boolean
}) {
  return link ? (
    <Link href={link} target={target} prefetch={prefetch ? undefined : false}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  )
}
