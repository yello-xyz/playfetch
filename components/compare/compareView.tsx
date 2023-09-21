import { ActiveProject } from '@/types'
import { Allotment } from 'allotment'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useState } from 'react'
import { PromptTab } from '../prompts/promptPanel'

export default function CompareView({ project }: { project: ActiveProject }) {
  const [leftItemID, setLeftItemID] = useState<number>()
  const [rightItemID, setRightItemID] = useState<number>()
  const [leftVersionID, setLeftVersionID] = useState<number>()
  const [rightVersionID, setRightVersionID] = useState<number>()
  const [activePromptTab, setActivePromptTab] = useState<PromptTab>()

  const itemCache = useActiveItemCache(project, [
    ...(leftItemID ? [leftItemID] : []),
    ...(rightItemID ? [rightItemID] : []),
  ])

  const updateRightItemID = (itemID: number) => {
    if (itemID !== rightItemID) {
      setLeftItemID(itemID)
      setRightItemID(itemID)
    }
  }

  const updateRightVersionID = (versionID: number) => {
    if (versionID !== rightVersionID) {
      if (rightItemID && leftItemID === rightItemID) {
        const rightVersions = itemCache.itemForID(rightItemID)?.versions ?? []
        const rightVersion = [...rightVersions].find(version => version.id === versionID)
        setTimeout(() => setLeftVersionID(rightVersion?.previousID ?? versionID))
      }
      setRightVersionID(versionID)
    }
  }

  const minWidth = 300
  return (
    <Allotment>
      <Allotment.Pane minSize={minWidth}>
        <ComparePane
          project={project}
          itemID={leftItemID}
          setItemID={setLeftItemID}
          versionID={leftVersionID}
          setVersionID={setLeftVersionID}
          activePromptTab={activePromptTab}
          setActivePromptTab={setActivePromptTab}
          itemCache={itemCache}
          disabled={!leftItemID}
        />
      </Allotment.Pane>
      <Allotment.Pane minSize={minWidth}>
        <ComparePane
          project={project}
          itemID={rightItemID}
          setItemID={updateRightItemID}
          versionID={rightVersionID}
          setVersionID={updateRightVersionID}
          activePromptTab={activePromptTab}
          setActivePromptTab={setActivePromptTab}
          itemCache={itemCache}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
