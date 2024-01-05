import Icon from './icon'
import backIcon from '@/public/back.svg'
import { ReactNode } from 'react'
import Button from './button'

export default function TopBar({ children }: { children: ReactNode }) {
  return (
    <div className='z-20 flex items-center justify-between w-full py-2 pl-2 pr-4 border-b border-gray-200'>
      {children}
    </div>
  )
}

export const TopBarBackItem = ({
  title,
  onNavigateBack,
  children,
}: {
  title?: string
  onNavigateBack: () => void
  children?: ReactNode
}) => (
  <TopBarAccessoryItem className='flex gap-2.5'>
    <Button type='outline' onClick={onNavigateBack}>
      <Icon icon={backIcon} />
      <span className='font-normal'>{title ?? 'Back'}</span>
    </Button>
    {children}
  </TopBarAccessoryItem>
)

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
