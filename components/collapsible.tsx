import { MouseEvent, ReactNode } from 'react'
import chevronIcon from '@/public/chevron.svg'
import Icon from './icon'
import useInitialState from '@/src/client/hooks/useInitialState'

export default function Collapsible({
  title,
  className = '',
  contentClassName = 'ml-6',
  titleClassName = '',
  initiallyExpanded = false,
  onSetExpanded,
  rightHandItems,
  children,
}: {
  title?: string
  className?: string
  contentClassName?: string
  titleClassName?: string
  initiallyExpanded?: boolean
  onSetExpanded?: (expanded: boolean, shiftClick: boolean) => void
  rightHandItems?: ReactNode
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useInitialState(initiallyExpanded)

  const toggleExpanded = (event: MouseEvent) => {
    setExpanded(!isExpanded)
    onSetExpanded?.(!isExpanded, event.shiftKey)
  }

  return (
    <div className={className}>
      <div className={`${titleClassName} flex items-center cursor-pointer`} onClick={toggleExpanded}>
        <Icon className={isExpanded ? '' : '-rotate-90'} icon={chevronIcon} />
        <span className='flex-1 font-medium text-gray-700'>{title}</span>
        {rightHandItems && <div className='self-end'>{rightHandItems}</div>}
      </div>
      {isExpanded && <div className={contentClassName}>{children}</div>}
    </div>
  )
}
