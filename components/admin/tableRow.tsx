import { ReactNode } from 'react'

export const TableRow = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <div className='cursor-pointer contents group' onClick={onClick}>
    {children}
  </div>
)

export const TableCell = ({ children, center }: { children: ReactNode; center?: boolean }) => (
  <div
    className={`flex items-center h-10 gap-2 px-2 font-medium group-hover:bg-gray-50 ${
      center ? 'justify-center' : ''
    }`}>
    {children}
  </div>
)

export const TruncatedSpan = ({ children }: { children: ReactNode }) => (
  <span className='overflow-hidden whitespace-nowrap text-ellipsis'>{children}</span>
)

export default TableRow
