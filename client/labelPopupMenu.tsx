import { Project, Version } from '@/types'
import api from './api'
import PopupMenu from './popupMenu'
import IconButton from './iconButton'
import labelIcon from '@/public/label.svg'
import checkIcon from '@/public/check.svg'
import { useState } from 'react'

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

export default function LabelPopupMenu({
  version,
  project,
  onRefreshPrompt,
}: {
  version: Version
  project: Project
  onRefreshPrompt: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const labels = project.labels
  const colors = LabelColorsFromProject(project)

  const toggleLabel = (label: string) => {
    setIsMenuExpanded(false)
    const labels = version.labels.includes(label) ? version.labels.filter(l => l !== label) : [...version.labels, label]
    api.updateVersionLabels(version.id, project.id, labels).then(onRefreshPrompt)
  }

  return (
    <div className='relative flex'>
      <IconButton icon={labelIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute right-0 top-7'>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <div className='p-3'>
              <input className='w-full mb-3 border border-gray-300 rounded-lg px-3 py-1.5' placeholder='Add a label' />
              {labels.map((label, index) => (
                <div className='flex items-center gap-1 px-2 py-1 w-72' key={index} onClick={() => toggleLabel(label)}>
                  <div className={`w-2.5 h-2.5 m-2.5 rounded-full ${colors[label]}`} />
                  <div className='flex-1'>{label}</div>
                  {version.labels.includes(label) && <img className='w-6 h-6' src={checkIcon.src} />}
                </div>
              ))}
            </div>
          </PopupMenu>
        </div>
      )}
    </div>
  )
}
