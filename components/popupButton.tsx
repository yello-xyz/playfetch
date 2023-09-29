import { GlobalPopupLocation } from '@/src/client/context/globalPopupContext'
import { ReactNode, useRef } from 'react'
import Icon from './icon'
import chevronIcon from '@/public/chevron.svg'

export function PopupButton({
  onSetPopup,
  disabled,
  fixedWidth,
  popUpAbove,
  className = '',
  children,
}: {
  onSetPopup: (location: GlobalPopupLocation) => void
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
  popUpAbove?: boolean
  children: ReactNode
}) {
  const buttonRef = useRef<HTMLDivElement>(null)

  const togglePopup = disabled
    ? undefined
    : () => {
        const iconRect = buttonRef.current?.getBoundingClientRect()!
        onSetPopup({
          top: !popUpAbove ? iconRect.y + 48 : undefined,
          left: !popUpAbove || fixedWidth ? iconRect.x : undefined,
          bottom: popUpAbove ? iconRect.y - 10 : undefined,
          right: popUpAbove || fixedWidth ? iconRect.x + iconRect.width : undefined,
        })
      }

  const baseClass = 'flex items-center justify-between gap-1 px-2 rounded-md h-9 border border-gray-300'
  const disabledClass = disabled ? 'opacity-40' : 'cursor-pointer hover:bg-gray-100'

  return (
    <div className={`${baseClass} ${disabledClass} ${className}`} ref={buttonRef} onClick={togglePopup}>
      {children}
      <Icon icon={chevronIcon} />
    </div>
  )
}
