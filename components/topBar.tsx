import Icon from './icon'
import backIcon from '@/public/back.svg'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

export default function TopBar({ children }: { children: ReactNode }) {
  return (
    <div className='flex items-center justify-between w-full py-2 pl-2 pr-4 border-b border-gray-200 z-20'>
      {children}
    </div>
  )
}

export function TopBarBackItem({ title, onNavigateBack }: { title?: string; onNavigateBack?: () => void }) {
  const router = useRouter()

  const navigateBack = onNavigateBack ?? (() => router.back())

  return (
    <TopBarAccessoryItem className='flex items-center gap-1 py-1 cursor-pointer' onClick={navigateBack}>
      <div className='hover:bg-gray-100 flex items-center gap-0.5 py-1 pl-1.5 pr-3 rounded-lg'>
        <Icon icon={backIcon} />
        {title ?? 'Back'}
      </div>
    </TopBarAccessoryItem>
  )
}

export function TopBarAccessoryItem({
  className = '',
  onClick,
  children,
}: {
  className?: string
  onClick?: () => void
  children?: ReactNode
}) {
  return (
    <div className={`${className} min-w-[30%]`} onClick={onClick}>
      {children}
    </div>
  )
}
