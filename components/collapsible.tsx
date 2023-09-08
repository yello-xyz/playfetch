import { ReactNode } from 'react'
import chevronIcon from '@/public/chevron.svg'
import Icon from './icon'

export default function Collapsible({
  label,
  isExpanded,
  setExpanded,
  children,
}: {
  label: string
  isExpanded: boolean
  setExpanded?: (expanded: boolean) => void
  children: ReactNode
}) {
  const canToggle = setExpanded !== undefined
  const cursorClass = canToggle ? 'cursor-pointer' : ''
  return (
    <>
      <div
        className={`flex items-center font-medium text-gray-600 ${cursorClass}`}
        onClick={() => setExpanded?.(!isExpanded)}>
        {canToggle && <Icon className={`-ml-1 ${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />}
        {label}
      </div>
      {isExpanded && children}
    </>
  )
}
