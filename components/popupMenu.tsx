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
  title,
  description,
  icon,
  label,
  onClick,
  checked,
  disabled,
}: {
  title: string
  description?: string
  icon?: StaticImageData
  label?: ReactNode
  onClick: () => void
  disabled?: boolean
  checked?: boolean
}) {
  const disabledClass = disabled ? 'opacity-50' : ''
  return (
    <PopupItem className={`flex flex-col gap-1 ${disabledClass}`} onClick={disabled ? undefined : onClick}>
      <div className={`flex items-center gap-1 ${description ? 'py-2 px-3' : 'p-1'}`}>
        {icon && <Icon icon={icon} />}
        {title}
        {label}
        {checked && <Icon className='ml-auto' icon={checkIcon} />}
      </div>
      {description && <span className='px-3 pb-2 -mt-2 text-gray-400'>{description}</span>}
    </PopupItem>
  )
}

export const PopupSectionTitle = ({ children }: { children: string }) => (
  <div className='p-1.5 text-xs font-medium text-gray-400'>{children}</div>
)

export const PopupSectionDivider = () => (
  <div className='pt-1 pb-1'>
    <div className='h-px bg-gray-200' />
  </div>
)

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
