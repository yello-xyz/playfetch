import { ActiveProject, Chain, Prompt } from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import { useState } from 'react'

export default function ComparePane({ project }: { project: ActiveProject }) {
  const [selectedItem, setSelectedItem] = useState<Prompt | Chain>()
  return (
    <div className='flex items-center gap-1 p-4'>
      <ProjectItemSelector
        className='w-full max-w-[200px]'
        project={project}
        selectedItemID={selectedItem?.id}
        onSelectItemID={itemID =>
          setSelectedItem([...project.prompts, ...project.chains].find(item => item.id === itemID))
        }
      />
    </div>
  )
}
