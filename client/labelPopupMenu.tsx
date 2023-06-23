import { Project, Version } from '@/types'
import api from './api'
import PopupMenu from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useState } from 'react'
import { useRefreshProjects, useRefreshPrompt } from './refreshContext'

const projectLabelColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
]

export const LabelColorsFromProject = (project?: Project) =>
  Object.fromEntries(
    (project?.labels ?? []).map((label, index) => [label, projectLabelColors[index % projectLabelColors.length]])
  )

export default function LabelPopupMenu({ version, project }: { version: Version; project: Project }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const trimmedLabel = newLabel.trim()

  const labels = project.labels
  const colors = LabelColorsFromProject(project)

  const addingNewLabel = trimmedLabel.length > 0 && !labels.includes(trimmedLabel)

  const refreshPrompt = useRefreshPrompt()
  const refreshProjects = useRefreshProjects()

  const toggleLabel = (label: string) => {
    setIsMenuExpanded(false)
    setNewLabel('')
    const labels = version.labels.includes(label) ? version.labels.filter(l => l !== label) : [...version.labels, label]
    api.updateVersionLabels(version.id, project.id, labels).then(() => {
      refreshPrompt()
      if (addingNewLabel) {
        refreshProjects()
      }
    })
  }

  return (
    <div className='relative flex'>
      <IconButton icon={labelIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute right-0 top-7'>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <div className='p-3 w-80'>
              <input
                type='text'
                className='w-full text-sm mb-3 border border-gray-300 rounded-lg px-3 py-1.5'
                placeholder='Add a label'
                value={newLabel}
                onChange={event => setNewLabel(event.target.value)}
              />

              {addingNewLabel ? (
                <div className='flex items-center gap-1 p-1' onClick={() => toggleLabel(trimmedLabel)}>
                  <img className='w-6 h-6' src={addIcon.src} />
                  Create new label <span className='font-medium'>“{trimmedLabel}”</span>
                </div>
              ) : (
                labels.map((label, index) => (
                  <div className='flex items-center gap-1 px-2 py-1' key={index} onClick={() => toggleLabel(label)}>
                    <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${colors[label]}`} />
                    <div className='flex-1'>{label}</div>
                    {version.labels.includes(label) && <img className='w-6 h-6' src={checkIcon.src} />}
                  </div>
                ))
              )}
            </div>
          </PopupMenu>
        </div>
      )}
    </div>
  )
}
