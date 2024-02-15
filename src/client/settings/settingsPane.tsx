import Label from '@/src/client/components/label'
import { ReactNode } from 'react'

export default function SettingsPane({
  title,
  description,
  scopeDescription,
  children,
}: {
  title: string
  description: string
  scopeDescription?: string
  children: ReactNode
}) {
  return (
    <>
      <Label>{title}</Label>
      <span>{description}</span>
      {scopeDescription && <span>{scopeDescription}</span>}
      <div className='flex flex-col w-full gap-3'>{children}</div>
    </>
  )
}
