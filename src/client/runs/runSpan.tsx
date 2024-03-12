import { MouseEventHandler, ReactNode } from 'react'

export default function RunSpan({
  children,
  onSelect,
}: {
  children: ReactNode
  onSelect?: MouseEventHandler<HTMLSpanElement>
}) {
  const commentStyle = 'underline cursor-pointer bg-blue-50 decoration-blue-100 decoration-2 underline-offset-2'
  return (
    <span className={`break-words ${onSelect ? commentStyle : ''}`} onClick={onSelect}>
      {children}
    </span>
  )
}
