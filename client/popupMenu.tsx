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
  children,
}: {
  expanded: boolean
  collapse: () => void
  children: any
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  useOutsideDetector(menuRef, collapse)

  return expanded ? (
    <div className='' ref={menuRef}>
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
  return (
    <div onClick={callback} className=''>
      {title}
    </div>
  )
}
