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

export const CalculatePopupOffset = (
  ref: RefObject<HTMLDivElement>,
  containerRect?: DOMRect,
  contentRect?: DOMRect
) => {
  const iconRect = ref.current?.getBoundingClientRect()
  const right = (containerRect?.right ?? 0) - (iconRect?.right ?? 0)
  const top = Math.max(0, (iconRect?.top ?? 0) - (containerRect?.top ?? 0) + 28)
  const useBottom = contentRect && containerRect && top + contentRect.height > containerRect.height
  return useBottom ? { right, bottom: 0 } : { right, top }
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
      className={`${className} cursor-default relative z-20 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm gap-0.5 select-none`}
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
  const baseClass = 'px-4 py-2 text-sm font-normal antialiased text-dark-gray-700'
  const destructiveClass = destructive ? 'text-red-500' : ''
  const separatedClass = separated ? 'border-t border-gray-200' : ''
  const hoverClass = destructive ? 'hover:bg-red-400 hover:text-white' : 'hover:bg-blue-400 hover:text-white'

  return (
    <div onClick={callback} className={`${baseClass} ${destructiveClass} ${separatedClass} ${hoverClass}`}>
      {title}
    </div>
  )
}
