import Icon from './icon'
import backIcon from '@/public/back.svg'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

export default function TopBar({ children }: { children: ReactNode }) {
  return (
    <div className='z-10 flex items-center justify-between w-full px-4 py-3 border-b border-gray-200'>{children}</div>
  )
}

export function TopBarBackItem({ title, onNavigateBack }: { title?: string; onNavigateBack?: () => void }) {
  const router = useRouter()

  const navigateBack = onNavigateBack ?? (() => router.back())

  return (
    <TopBarAccessoryItem className='flex items-center gap-1 py-1 cursor-pointer' onClick={navigateBack}>
      <Icon icon={backIcon} />
      {title ?? 'Back'}
    </TopBarAccessoryItem>
  )
}

export function TopBarAccessoryItem({
  className,
  onClick,
  children,
}: {
  className?: string
  onClick?: () => void
  children?: ReactNode
}) {
  return (
    <div className={`${className ?? ''} min-w-[30%]`} onClick={onClick}>
      {children}
    </div>
  )
}
