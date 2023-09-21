import { ActiveProject } from '@/types'
import { Allotment } from 'allotment'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useState } from 'react'

export default function CompareView({ project }: { project: ActiveProject }) {
  const [leftItemID, setLeftItemID] = useState<number>()
  const [rightItemID, setRightItemID] = useState<number>()
  const [leftVersionID, setLeftVersionID] = useState<number>()
  const [rightVersionID, setRightVersionID] = useState<number>()

  const itemCache = useActiveItemCache(project, [
    ...(leftItemID ? [leftItemID] : []),
    ...(rightItemID ? [rightItemID] : []),
  ])

  return (
    <Allotment>
      <Allotment.Pane>
        <ComparePane
          project={project}
          itemID={leftItemID}
          setItemID={setLeftVersionID}
          versionID={leftVersionID}
          setVersionID={setLeftVersionID}
          itemCache={itemCache}
        />
      </Allotment.Pane>
      <Allotment.Pane>
        <ComparePane
          project={project}
          itemID={rightItemID}
          setItemID={setRightItemID}
          versionID={rightVersionID}
          setVersionID={setRightVersionID}
          itemCache={itemCache}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
