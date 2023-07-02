import { ActivePrompt, Version } from '@/types'
import api from '../src/client/api'
import PopupMenu from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { RefObject, useRef, useState } from 'react'
import { useRefreshProjects, useRefreshPrompt } from './refreshContext'
import Icon from './icon'

const projectLabelColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
]

export const AvailableLabelColorsForPrompt = (prompt: ActivePrompt) =>
  Object.fromEntries(
    prompt.availableLabels.map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

export const CalculatePopupOffset = (ref: RefObject<HTMLDivElement>, containerRect?: DOMRect) => {
  const iconRect = ref.current?.getBoundingClientRect()
  return {
    right: (containerRect?.right ?? 0) - (iconRect?.right ?? 0),
    top: (iconRect?.top ?? 0) - (containerRect?.top ?? 0) + 28,
  }
}

export default function LabelPopupMenu({
  version,
  prompt,
  containerRect,
}: {
  version: Version
  prompt: ActivePrompt,
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const trimmedLabel = newLabel.trim()

  const labels = prompt.availableLabels
  const colors = AvailableLabelColorsForPrompt(prompt)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const refreshPrompt = useRefreshPrompt()
  const refreshProjects = useRefreshProjects()

  const iconRef = useRef<HTMLDivElement>(null)

  const toggleLabel = (label: string) => {
    setIsMenuExpanded(false)
    setNewLabel('')
    const labels = version.labels.includes(label) ? version.labels.filter(l => l !== label) : [...version.labels, label]
    api.updateVersionLabels(version.id, prompt.projectID, labels).then(() => {
      refreshPrompt()
      if (addingNewLabel) {
        refreshProjects()
      }
    })
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton icon={labelIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect)}>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <div className='p-3 w-80'>
              <input
                type='text'
                className='w-full text-sm mb-3 border border-gray-300 outline-none rounded-lg px-3 py-1.5'
                placeholder='Add a label'
                value={newLabel}
                onChange={event => setNewLabel(event.target.value)}
              />

              {addingNewLabel ? (
                <div className='flex items-center gap-1 p-1' onClick={() => toggleLabel(trimmedLabel)}>
                  <Icon icon={addIcon} />
                  Create new label <span className='font-medium'>“{trimmedLabel}”</span>
                </div>
              ) : (
                labels.map((label, index) => (
                  <div className='flex items-center gap-1 px-2 py-1' key={index} onClick={() => toggleLabel(label)}>
                    <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${colors[label]}`} />
                    <div className='flex-1'>{label}</div>
                    {version.labels.includes(label) && <Icon icon={checkIcon} />}
                  </div>
                ))
              )}
            </div>
          </PopupMenu>
        </div>
      )}
    </>
  )
}
