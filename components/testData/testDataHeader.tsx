import { useState } from 'react'
import { EditableItem } from '../headerItem'
import chevronIcon from '@/public/chevron.svg'
import GlobalPopupMenu from '../globalPopupMenu'

export default function TestDataHeader({
  variable,
  variables,
  staticVariables,
  onRename,
  grow,
  isFirst,
  isLast,
}: {
  variable: string
  variables: string[]
  staticVariables: string[]
  onRename?: (name: string) => void
  grow?: boolean
  isFirst?: boolean
  isLast?: boolean
}) {
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => {
    onRename?.(name)
    setLabel(undefined)
  }

  const isInUse = variables.includes(variable)
  const isStatic = staticVariables.includes(variable)
  const bgColor = isStatic ? 'bg-pink-25' : isInUse ? 'bg-purple-25' : ''
  const textColor = isStatic ? 'text-pink-400' : isInUse ? 'text-purple-400' : ''

  const baseClass = 'flex items-center px-3 py-1 border-b border-gray-200 h-8'

  return (
    <div
      className={`${baseClass} ${isFirst ? '' : 'border-l'} ${grow ? 'grow' : ''}  ${bgColor}`}
      onClick={isInUse || !onRename ? undefined : () => setLabel(variable)}>
      <span className={`flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis ${textColor}`}>
        {label !== undefined ? (
          <EditableItem
            className='pl-0.5 leading-6 select-none bg-blue-25 whitespace-nowrap'
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          `${isStatic ? `{{${variable}}}` : variable}`
        )}
      </span>
    </div>
  )
}
