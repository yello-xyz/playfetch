import { ActiveProject } from '@/types'
import { Allotment } from 'allotment'
import ComparePane from './comparePane'

export default function CompareView({ project }: { project: ActiveProject }) {
  return (
    <Allotment>
      <Allotment.Pane>
        <ComparePane project={project} />
      </Allotment.Pane>
      <Allotment.Pane>
        <ComparePane project={project} />
      </Allotment.Pane>
    </Allotment>
  )
}
