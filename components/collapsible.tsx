import { ReactNode, useState } from 'react'
import chevronIcon from '@/public/chevron.svg'
import Icon from './icon'

export default function Collapsible({
  title,
  className = 'ml-6',
  titleClassName = '',
  initiallyExpanded = false,
  rightHandItems,
  children,
}: {
  title?: string
  className?: string
  titleClassName?: string
  initiallyExpanded?: boolean
  rightHandItems?: ReactNode
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)

  return (
    <div className='flex flex-col'>
      <div className={`${titleClassName} flex items-center cursor-pointer`} onClick={() => setExpanded(!isExpanded)}>
        <Icon className={isExpanded ? '' : '-rotate-90'} icon={chevronIcon} />
        <span className='flex-1 font-medium text-gray-700'>{title}</span>
        {rightHandItems && <div className='self-end'>{rightHandItems}</div>}
      </div>
      {isExpanded && <div className={className}>{children}</div>}
    </div>
  )
}
