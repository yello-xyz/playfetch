import { RefObject, useEffect, useRef } from 'react'

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

export const CalculatePopupOffset = (ref: RefObject<HTMLDivElement>, containerRect?: DOMRect) => {
  const iconRect = ref.current?.getBoundingClientRect()
  return {
    right: (containerRect?.right ?? 0) - (iconRect?.right ?? 0),
    top: (iconRect?.top ?? 0) - (containerRect?.top ?? 0) + 28,
  }
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
      className={`${className} cursor-default relative z-20 overflow-hidden bg-white border border-gray-300 rounded-lg drop-shadow`}
      ref={menuRef}>
      {children}
    </div>
  ) : null
}

export function PopupMenuItem({
  title,
  callback,
  destructive,
  separated,
}: {
  title: string
  callback: () => void
  destructive?: boolean
  separated?: boolean
}) {
  const baseClass = 'px-4 py-2 text-sm font-normal'
  const destructiveClass = destructive ? 'text-red-500' : ''
  const separatedClass = separated ? 'border-t border-gray-300' : ''
  const hoverClass = destructive ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-blue-600 hover:text-white'

  return (
    <div onClick={callback} className={`${baseClass} ${destructiveClass} ${separatedClass} ${hoverClass}`}>
      {title}
    </div>
  )
}
