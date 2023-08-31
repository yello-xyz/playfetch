import { ActivePrompt, Run, PromptVersion, ActiveChain, ChainVersion } from '@/types'
import api from '@/src/client/api'
import PopupMenu, { CalculatePopupOffset, PopupContent } from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useCallback, useRef, useState } from 'react'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import Icon from './icon'
import useGlobalPopup from '@/src/client/context/globalPopupContext'

const projectLabelColors = [
  'bg-red-300 text-white',
  'bg-orange-300 text-white',
  'bg-purple-300 text-white',
  'bg-green-300 text-white',
  'bg-blue-300 text-white',
  'bg-yellow-300 text-white',
]

export const AvailableLabelColorsForItem = (prompt: ActivePrompt | ActiveChain) =>
  Object.fromEntries(
    prompt.availableLabels.map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

export default function LabelPopupMenu({
  item,
  activeItem,
}: {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
}) {
  const iconRef = useRef<HTMLDivElement>(null)
  const iconRect = iconRef.current?.getBoundingClientRect()

  const [setPopup, setPopupProps, setPopupLocation] = useGlobalPopup<LabelsPopupProps>()

  const togglePopup = () => {
    setPopup(LabelsPopup)
    setPopupProps({ item, activeItem })
    setPopupLocation({ left: (iconRect?.right ?? 0) - 320, top: iconRect?.bottom })
  }

  return (
    <div ref={iconRef}>
      <IconButton icon={labelIcon} onClick={togglePopup} />
    </div>
  )
}

export type LabelsPopupProps = {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
  onDismiss?: () => void
}

function LabelsPopup({ item, activeItem, onDismiss }: LabelsPopupProps) {
  const [newLabel, setNewLabel] = useState('')
  const trimmedLabel = newLabel.trim()

  const labels = activeItem.availableLabels

  const colors = AvailableLabelColorsForItem(activeItem)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const refreshActiveItem = useRefreshActiveItem()

  const toggleLabel = (label: string) => {
    onDismiss?.()
    setNewLabel('')
    const checked = !item.labels.includes(label)
    const itemIsVersion = 'runs' in item
    if (itemIsVersion) {
      api.toggleVersionLabel(item.id, activeItem.projectID, label, checked).then(_ => refreshActiveItem())
    } else {
      api.toggleRunLabel(item.id, activeItem.projectID, label, checked).then(_ => refreshActiveItem())
    }
  }

  return (
    <PopupContent className='p-3 w-80'>
      <input
        type='text'
        className='w-full text-sm mb-3 border border-gray-300 outline-none rounded-lg px-3 py-1.5'
        placeholder='Add a label'
        value={newLabel}
        onChange={event => setNewLabel(event.target.value)}
      />
      {addingNewLabel ? (
        <div className='flex items-center gap-1 p-1 cursor-pointer' onClick={() => toggleLabel(trimmedLabel)}>
          <Icon icon={addIcon} />
          Create new label <span className='font-medium'>“{trimmedLabel}”</span>
        </div>
      ) : (
        labels.map((label, index) => (
          <div
            className='flex items-center gap-1 px-2 py-1 cursor-pointer'
            key={index}
            onClick={() => toggleLabel(label)}>
            <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${colors[label]}`} />
            <div className='flex-1'>{label}</div>
            {item.labels.includes(label) && <Icon icon={checkIcon} />}
          </div>
        ))
      )}
    </PopupContent>
  )
}
