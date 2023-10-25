import { ActivePrompt, Run, PromptVersion, ActiveChain, ChainVersion, ActiveProject } from '@/types'
import api from '@/src/client/api'
import { PopupContent } from './popupMenu'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useState } from 'react'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/refreshContext'
import Icon from './icon'
import GlobalPopupMenu from './globalPopupMenu'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

const projectLabelColors = [
  'bg-purple-300 text-white',
  'bg-blue-300 text-white',
  'bg-orange-300 text-white',
  'bg-red-300 text-white',
  'bg-green-300 text-white',
  'bg-yellow-300 text-white',
]

export const AvailableLabelColorsForItem = (prompt: ActivePrompt | ActiveChain | ActiveProject) =>
  Object.fromEntries(
    prompt.availableLabels.map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

export default function LabelPopupMenu({
  item,
  activeItem,
  selectedCell = false,
}: {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
  selectedCell?: boolean
}) {
  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const refresh = () => refreshActiveItem().then(refreshProject)

  const loadPopup = (): [typeof LabelsPopup, LabelsPopupProps] => [LabelsPopup, { item, activeItem, refresh }]

  return <GlobalPopupMenu icon={labelIcon} loadPopup={loadPopup} selectedCell={selectedCell} />
}

export type LabelsPopupProps = {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
  refresh: () => void
}

const IsVersion = (item: LabelsPopupProps['item']): item is PromptVersion | ChainVersion => 'runs' in item

function LabelsPopup({ item, activeItem, refresh, withDismiss }: LabelsPopupProps & WithDismiss) {
  const [newLabel, setNewLabel] = useState('')

  const trimmedLabel = newLabel.trim()

  const labels = activeItem.availableLabels

  const colors = AvailableLabelColorsForItem(activeItem)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const itemComments = IsVersion(item)
    ? item.comments
    : activeItem.versions.flatMap(version => version.comments).filter(comment => comment.runID === item.id)

  const toggleLabel = (label: string) => {
    setNewLabel('')
    const checked = !item.labels.includes(label)
    const replyTo = itemComments.findLast(
      comment => comment.text === label && comment.action === (checked ? 'removeLabel' : 'addLabel')
    )?.id
    if (IsVersion(item)) {
      api.toggleVersionLabel(item.id, activeItem.projectID, label, checked, replyTo).then(refresh)
    } else {
      api.toggleRunLabel(item.id, activeItem.projectID, label, checked, replyTo).then(refresh)
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
        <div
          className='flex items-center gap-1 p-1 cursor-pointer'
          onClick={withDismiss(() => toggleLabel(trimmedLabel))}>
          <Icon icon={addIcon} />
          Create new label <span className='font-medium'>“{trimmedLabel}”</span>
        </div>
      ) : (
        labels.map((label, index) => (
          <div
            className='flex items-center gap-1 px-2 py-1 cursor-pointer'
            key={index}
            onClick={withDismiss(() => toggleLabel(label))}>
            <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${colors[label]}`} />
            <div className='flex-1'>{label}</div>
            {item.labels.includes(label) && <Icon icon={checkIcon} />}
          </div>
        ))
      )}
    </PopupContent>
  )
}
