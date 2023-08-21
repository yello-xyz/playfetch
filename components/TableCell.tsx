import { ReactNode } from 'react'

export default function TableCell({
  children,
  header,
  first,
  last,
  center,
  active,
  callback,
}: {
  children: ReactNode
  header?: boolean
  first?: boolean
  last?: boolean
  center?: boolean
  active?: boolean
  callback?: () => void
}) {
  const baseClass = 'px-3 py-2 text-ellipsis overflow-hidden border-gray-200 flex'
  const borderClass = header
    ? first
      ? 'border-y border-l'
      : last
      ? 'border-y border-r'
      : 'border-y'
    : first
    ? 'border-b border-l'
    : last
    ? 'border-b border-r'
    : 'border-b'
  const textClass = header ? 'font-medium text-gray-700' : ''
  const bgClass = active ? 'bg-blue-25' : 'bg-white'
  const layoutClass = center ? 'flex justify-center' : ''
  const cursorClass = callback ? 'cursor-pointer' : ''
  const className = `${baseClass} ${borderClass} ${textClass} ${bgClass} ${layoutClass} ${cursorClass}`
  return (
    <div className={className} onClick={callback}>
      {children}
    </div>
  )
}

export const TableHeader = ({ children, first, last }: { children: ReactNode; first?: boolean; last?: boolean }) => (
  <TableCell header first={first} last={last}>
    {children}
  </TableCell>
)
