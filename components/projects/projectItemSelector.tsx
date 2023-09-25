import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { ActiveProject, ItemsInProject } from '@/types'
import { PopupContent, PopupLabelItem } from '../popupMenu'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from '../icon'
import { PopupButton } from '../popupButton'

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
  const setPopup = useGlobalPopup<PropjectItemSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(PropjectItemSelectorPopup, { project, onSelectItemID }, location)

  const items = ItemsInProject(project)
  const selectedItem = items.find(item => item.id === selectedItemID)
  const isPrompt = selectedItem && project.prompts.some(prompt => prompt.id === selectedItemID)

  return (
    <PopupButton
      disabled={disabled || items.length === 0}
      fixedWidth={fixedWidth}
      className={className}
      onSetPopup={onSetPopup}>
      {selectedItem && <Icon icon={isPrompt ? promptIcon : chainIcon} />}
      <span className='flex-1 overflow-hidden whitespace-nowrap text-ellipsis'>
        {selectedItem?.name ?? 'Select a Prompt or Chain'}
      </span>
    </PopupButton>
  )
}

type PropjectItemSelectorPopupProps = {
  project: ActiveProject
  onSelectItemID: (itemID: number) => void
}

function PropjectItemSelectorPopup({
  project,
  onSelectItemID,
  withDismiss,
}: PropjectItemSelectorPopupProps & WithDismiss) {
  const titleClass = 'p-1.5 text-xs font-medium text-gray-400'
  return (
    <PopupContent className='p-3'>
      {project.prompts.length > 0 && <div className={titleClass}>Prompts</div>}
      {project.prompts.map((prompt, index) => (
        <PopupLabelItem
          key={index}
          label={prompt.name}
          icon={promptIcon}
          onClick={withDismiss(() => onSelectItemID(prompt.id))}
        />
      ))}
      {project.chains.length > 0 && <div className={titleClass}>Chains</div>}
      {project.chains.map((chain, index) => (
        <PopupLabelItem
          key={index}
          label={chain.name}
          icon={chainIcon}
          onClick={withDismiss(() => onSelectItemID(chain.id))}
        />
      ))}
    </PopupContent>
  )
}
