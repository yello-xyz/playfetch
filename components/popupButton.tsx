import { GlobalPopupLocation } from '@/src/client/context/globalPopupContext'
import { ReactNode, useRef } from 'react'
import Icon from './icon'
import chevronIcon from '@/public/chevron.svg'

export function PopupButton({
  onSetPopup,
  disabled,
  fixedWidth,
  className = '',
  children,
}: {
  onSetPopup: (location: GlobalPopupLocation) => void
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
  children: ReactNode
}) {
  const buttonRef = useRef<HTMLDivElement>(null)

  const togglePopup = disabled
    ? undefined
    : () => {
        const iconRect = buttonRef.current?.getBoundingClientRect()!
        onSetPopup({
          top: iconRect.y + 48,
          left: iconRect.x,
          right: fixedWidth ? iconRect.x + iconRect.width : undefined,
        })
      }

  const baseClass = 'flex items-center justify-between gap-1 px-2 rounded-md h-9 border border-gray-300'
  const disabledClass = disabled ? 'opacity-40' : 'cursor-pointer'

  return (
    <div className={`${baseClass} ${disabledClass} ${className}`} ref={buttonRef} onClick={togglePopup}>
      {children}
      <Icon icon={chevronIcon} />
    </div>
  )
}
