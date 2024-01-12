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
  const baseClass = 'flex items-center justify-between gap-1 px-2 rounded-md h-8 border border-gray-300 '
  const disabledClass = disabled ? 'opacity-40 select-none' : 'cursor-pointer hover:bg-gray-100'

  return (
    <CustomPopupButton
      onSetPopup={onSetPopup}
      fixedWidth={fixedWidth}
      popUpAbove={popUpAbove}
      disabled={disabled}
      className={`${baseClass} ${disabledClass} ${className}`}>
      {children}
      <Icon icon={chevronIcon} />
    </CustomPopupButton>
  )
}

export function CustomPopupButton({
  onSetPopup,
  className = '',
  disabled,
  fixedWidth,
  popUpAbove,
  alignRight,
  children,
}: {
  onSetPopup: (location: GlobalPopupLocation) => void
  className?: string
  disabled?: boolean
  fixedWidth?: boolean
  popUpAbove?: boolean
  alignRight?: boolean
  children: ReactNode
}) {
  const buttonRef = useRef<HTMLDivElement>(null)

  const togglePopup = disabled
    ? undefined
    : () => {
        const iconRect = buttonRef.current?.getBoundingClientRect()!
        onSetPopup({
          top: !popUpAbove ? iconRect.y + 48 : undefined,
          left: (!alignRight && !popUpAbove) || fixedWidth ? iconRect.x : undefined,
          bottom: popUpAbove ? iconRect.y - 10 : undefined,
          right: alignRight || popUpAbove || fixedWidth ? iconRect.x + iconRect.width : undefined,
        })
      }

  return (
    <div className={className} ref={buttonRef} onClick={togglePopup}>
      {children}
    </div>
  )
}
