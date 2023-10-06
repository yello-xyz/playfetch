import Label from '../label'
import { ReactNode } from 'react'

export default function SettingsPane({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <>
      <Label>{title}</Label>
      <span>{description}</span>
      <div className='flex flex-col w-full gap-3'>{children}</div>
    </>
  )
}
