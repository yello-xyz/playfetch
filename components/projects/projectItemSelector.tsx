import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import { ActiveProject, Chain, Prompt } from '@/types'
import { useRef } from 'react'
import { PopupContent, PopupItem } from '../popupMenu'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import chevronIcon from '@/public/chevron.svg'
import Icon from '../icon'

export default function ProjectItemSelector({
  project,
  selectedItemID,
  onSelectItemID,
  disabled,
  fixedWidth,
  className = '',
}: {
  project: ActiveProject
  selectedItemID?: number
  onSelectItemID: (itemID: number) => void
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
}) {
  const buttonRef = useRef<HTMLDivElement>(null)

  const setPopup = useGlobalPopup<PropjectItemSelectorPopupProps>()

  const togglePopup = disabled
    ? undefined
    : () => {
        const iconRect = buttonRef.current?.getBoundingClientRect()!
        setPopup(
          PropjectItemSelectorPopup,
          { project, selectItem: item => onSelectItemID(item.id) },
          { top: iconRect.y + 48, left: iconRect.x, right: fixedWidth ? iconRect.x + iconRect.width : undefined }
        )
      }

  const selectedItem = [...project.prompts, ...project.chains].find(item => item.id === selectedItemID)
  const isPrompt = selectedItem && project.prompts.some(prompt => prompt.id === selectedItemID)
  const baseClass = 'flex items-center justify-between gap-1 px-2 rounded-md h-9 border border-gray-300'
  const disabledClass = disabled ? 'opacity-40' : 'cursor-pointer'

  return (
    <div className={`${baseClass} ${disabledClass} ${className}`} ref={buttonRef} onClick={togglePopup}>
      {selectedItem && <Icon icon={isPrompt ? promptIcon : chainIcon} />}
      <span className='flex-1 overflow-hidden whitespace-nowrap text-ellipsis'>
        {selectedItem?.name ?? 'Select a Prompt or Chain'}
      </span>
      <Icon icon={chevronIcon} />
    </div>
  )
}

type PropjectItemSelectorPopupProps = {
  project: ActiveProject
  selectItem: (item: Prompt | Chain) => void
}

function PropjectItemSelectorPopup({ project, selectItem, withDismiss }: PropjectItemSelectorPopupProps & WithDismiss) {
  const titleClass = 'p-1.5 text-xs font-medium text-gray-400'
  return (
    <PopupContent className='p-3'>
      <div className={titleClass}>Prompts</div>
      {project.prompts.map((prompt, index) => (
        <PopupItem key={index} label={prompt.name} icon={promptIcon} onClick={withDismiss(() => selectItem(prompt))} />
      ))}
      <div className={titleClass}>Chains</div>
      {project.chains.map((chain, index) => (
        <PopupItem key={index} label={chain.name} icon={chainIcon} onClick={withDismiss(() => selectItem(chain))} />
      ))}
    </PopupContent>
  )
}
