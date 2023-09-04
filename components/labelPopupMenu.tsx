import { ActivePrompt, Run, PromptVersion, ActiveChain, ChainVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent } from './popupMenu'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useState } from 'react'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import Icon from './icon'
import GlobalPopupMenu from './globalPopupMenu'

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
  const refreshActiveItem = useRefreshActiveItem()

  const loadPopup = (): [typeof LabelsPopup, LabelsPopupProps] => [
    LabelsPopup,
    { item, activeItem, refreshActiveItem },
  ]

  return <GlobalPopupMenu icon={labelIcon} loadPopup={loadPopup} />
}

export type LabelsPopupProps = {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
  refreshActiveItem: () => void
  onDismissGlobalPopup?: () => void
}

function LabelsPopup({
  item,
  activeItem,
  refreshActiveItem,
  onDismissGlobalPopup,
}: LabelsPopupProps) {
  const [newLabel, setNewLabel] = useState('')

  const trimmedLabel = newLabel.trim()

  const labels = activeItem.availableLabels

  const colors = AvailableLabelColorsForItem(activeItem)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const toggleLabel = (label: string) => {
    onDismissGlobalPopup?.()
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
