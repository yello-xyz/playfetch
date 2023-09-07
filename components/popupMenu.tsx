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

export function PopupContent({ children, className }: { children: any; className?: string }) {
  return <div className={`${className} bg-white border border-gray-200 rounded-lg gap-0.5 select-none`}>{children}</div>
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
