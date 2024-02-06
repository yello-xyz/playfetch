import { PopupContent } from '../popupMenu'
import addIcon from '@/public/add.svg'
import checkIcon from '@/public/check.svg'
import { useState } from 'react'
import Icon from '../icon'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

const projectLabelColors = [
  'bg-purple-300 text-white',
  'bg-blue-300 text-white',
  'bg-orange-300 text-white',
  'bg-red-300 text-white',
  'bg-green-300 text-white',
  'bg-yellow-300 text-white',
]

export const AvailableLabelColorsForItem = (item: { availableLabels: string[] }) =>
  Object.fromEntries(
    item.availableLabels.map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

export type LabelsPopupProps = {
  activeLabels: string[]
  availableLabels: string[]
  labelColors: Record<string, string>
  toggleLabel: (label: string) => void
}

export default function LabelsPopup({
  activeLabels,
  availableLabels,
  labelColors,
  toggleLabel,
  withDismiss,
}: LabelsPopupProps & WithDismiss) {
  const [newLabel, setNewLabel] = useState('')

  const trimmedLabel = newLabel.trim()

  const addingNewLabel = trimmedLabel.length > 0 && !availableLabels.includes(trimmedLabel)

  const toggle = (label: string) => {
    setNewLabel('')
    toggleLabel(label)
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
        <div
          className='flex items-center gap-1 p-1 cursor-pointer'
          onClick={withDismiss(() => toggleLabel(trimmedLabel))}>
          <Icon icon={addIcon} />
          Create new label <span className='font-medium'>“{trimmedLabel}”</span>
        </div>
      ) : (
        availableLabels.map((label, index) => (
          <div
            className='flex items-center gap-1 px-2 py-1 cursor-pointer'
            key={index}
            onClick={withDismiss(() => toggle(label))}>
            <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${labelColors[label]}`} />
            <div className='flex-1'>{label}</div>
            {activeLabels.includes(label) && <Icon icon={checkIcon} />}
          </div>
        ))
      )}
    </PopupContent>
  )
}
