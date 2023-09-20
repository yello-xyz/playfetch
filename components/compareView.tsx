import { ActiveProject } from '@/types'
import { Allotment } from 'allotment'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'

export default function CompareView({ project }: { project: ActiveProject }) {
  const router = useRouter()
  const { l: showLogs, p: newParentID, v: newVersionID } = ParseNumberQuery(router.query)

  return (
    <Allotment>
      <Allotment.Pane>

      </Allotment.Pane>
      <Allotment.Pane>
        
      </Allotment.Pane>
    </Allotment>
  )
}
