import { ReactNode } from 'react'

export default function TableCell({
  children,
  header,
  first,
  center,
  active,
  callback,
}: {
  children: ReactNode
  header?: boolean
  first?: boolean
  center?: boolean
  active?: boolean
  callback?: () => void
}) {
  const baseClass = 'px-3 py-2 text-ellipsis overflow-hidden border-gray-100'
  const borderClass = header
    ? first
      ? 'border'
      : 'border-r border-y'
    : first
    ? 'border-b border-x'
    : 'border-b border-r'
  const textClass = header ? 'font-medium text-gray-800' : ''
  const bgClass = active ? 'bg-blue-25' : ''
  const layoutClass = center ? 'flex justify-center' : ''
  const cursorClass = callback ? 'cursor-pointer' : ''
  const className = `${baseClass} ${borderClass} ${textClass} ${bgClass} ${layoutClass} ${cursorClass}`
  return (
    <div className={className} onClick={callback}>
      {children}
    </div>
  )
}

export const TableHeader = ({ children, first }: { children: ReactNode; first?: boolean }) => (
  <TableCell header first={first}>
    {children}
  </TableCell>
)
