import { ActivePrompt, Run, PromptVersion } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useCallback, useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import Icon from './icon'

const projectLabelColors = [
  'bg-red-300 text-white',
  'bg-orange-300 text-white',
  'bg-purple-300 text-white',
  'bg-green-300 text-white',
  'bg-blue-300 text-white',
  'bg-yellow-300 text-white',
]

export const AvailableLabelColorsForPrompt = (prompt: ActivePrompt) =>
  Object.fromEntries(
    prompt.availableLabels.map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

function useClientRect(): readonly [DOMRect | undefined, (node: HTMLDivElement) => void] {
  const [rect, setRect] = useState<DOMRect>()
  const ref = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      setRect(node.getBoundingClientRect())
    }
  }, [])
  return [rect, ref]
}

export default function LabelPopupMenu({
  item,
  prompt,
  containerRect,
}: {
  item: PromptVersion | Run
  prompt: ActivePrompt
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const trimmedLabel = newLabel.trim()

  const labels = prompt.availableLabels
  const colors = AvailableLabelColorsForPrompt(prompt)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const refreshPrompt = useRefreshPrompt()

  const iconRef = useRef<HTMLDivElement>(null)
  const [popupRect, popupRef] = useClientRect()

  const toggleLabel = (label: string) => {
    setMenuExpanded(false)
    setNewLabel('')
    const checked = !item.labels.includes(label)
    const itemIsVersion = 'runs' in item
    if (itemIsVersion) {
      api.toggleVersionLabel(item.id, prompt.projectID, label, checked).then(_ => refreshPrompt())
    } else {
      api.toggleRunLabel(item.id, prompt.projectID, label, checked).then(_ => refreshPrompt())
    }
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton icon={labelIcon} onClick={() => setMenuExpanded(!isMenuExpanded)} />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect, popupRect)}>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
            <div ref={popupRef} className='p-3 w-80'>
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
            </div>
          </PopupMenu>
        </div>
      )}
    </>
  )
}
