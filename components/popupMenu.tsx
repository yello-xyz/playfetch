import { StaticImageData } from 'next/image'
import { ReactNode, RefObject, useEffect, useRef } from 'react'
import Icon from './icon'
import checkIcon from '@/public/check.svg'

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

function useOutsideDetector(ref: RefObject<HTMLDivElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        delay(1).then(callback)
      }
    }
    document.addEventListener('mouseup', handleClickOutside)
    return () => {
      document.removeEventListener('mouseup', handleClickOutside)
    }
  }, [ref, callback])
}

export default function PopupMenu({
  expanded,
  collapse,
  className,
  children,
}: {
  expanded: boolean
  collapse: () => void
  className?: string
  children: any
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  useOutsideDetector(menuRef, collapse)

  return expanded ? (
    <div
      onClick={event => event.stopPropagation()}
      className='relative z-20 overflow-hidden cursor-default'
      ref={menuRef}>
      <PopupContent className={className}>{children}</PopupContent>
    </div>
  ) : null
}

export function PopupContent({
  children,
  className,
  autoOverflow = true,
}: {
  children: any
  className?: string
  autoOverflow?: boolean
}) {
  const baseClass = 'bg-white border border-gray-200 rounded-lg select-none'
  const overflowClass = autoOverflow ? 'max-h-screen overflow-y-auto' : ''
  return <div className={`${baseClass} ${overflowClass} ${className}`}>{children}</div>
}

export function PopupLabelItem({
  label,
  icon,
  onClick,
  checked,
  disabled,
}: {
  label: string
  icon?: StaticImageData
  onClick: () => void
  disabled?: boolean
  checked?: boolean
}) {
  const disabledClass = disabled ? 'opacity-50' : ''
  return (
    <PopupItem className={`flex items-center gap-1 p-1 ${disabledClass}`} onClick={disabled ? undefined : onClick}>
      {icon && <Icon icon={icon} />}
      {label}
      {checked && <Icon className='ml-auto' icon={checkIcon} />}
    </PopupItem>
  )
}

export function PopupItem({
  onClick,
  className = '',
  children,
}: {
  onClick?: () => void
  className?: string
  children: ReactNode
}) {
  const cursorClass = onClick ? 'cursor-pointer' : ''
  return (
    <div className={`${className} ${cursorClass} rounded hover:bg-gray-100`} onClick={onClick}>
      {children}
    </div>
  )
}

export function PopupMenuItem({
  title,
  callback,
  destructive,
  separated,
  first,
  last,
}: {
  title: string
  callback: () => void
  destructive?: boolean
  separated?: boolean
  first?: boolean
  last?: boolean
}) {
  const baseClass = 'px-4 py-2 text-sm font-normal text-gray-700'
  const destructiveClass = destructive ? 'text-red-500' : ''
  const separatedClass = separated ? 'border-t border-gray-200' : ''
  const hoverClass = destructive ? 'hover:bg-red-400 hover:text-white' : 'hover:bg-blue-400 hover:text-white'
  const roundedClass = first && last ? 'rounded-lg' : first ? 'rounded-t-lg' : last ? 'rounded-b-lg' : ''

  return (
    <div
      onClick={callback}
      className={`${baseClass} ${destructiveClass} ${separatedClass} ${hoverClass} ${roundedClass}`}>
      {title}
    </div>
  )
}
