import { ActiveProject, ItemsInProject } from '@/types'
import { Allotment } from 'allotment'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useState } from 'react'
import { PromptTab } from '../prompts/promptPanel'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import SegmentedControl, { Segment } from '../segmentedControl'

export default function CompareView({ project }: { project: ActiveProject }) {
  const router = useRouter()
  const { i: itemID, v: versionID, p: previousVersionID } = ParseNumberQuery(router.query)

  const [isDiffMode, setDiffMode] = useState(false)
  const [rightItemID, setRightItemID] = useState(itemID)
  const [rightVersionID, setRightVersionID] = useState(versionID)
  const [leftItemID, setLeftItemID] = useState(itemID)
  const [leftVersionID, setLeftVersionID] = useState(previousVersionID)
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
  return ItemsInProject(project).length > 0 ? (
    <>
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
      {leftVersionID && rightVersionID && (
        <SegmentedControl className='absolute z-30 bottom-4 right-4' selected={isDiffMode} callback={setDiffMode}>
          <Segment title='Diff' value={true} />
          <Segment title='Responses' value={false} />
        </SegmentedControl>
      )}
    </>
  ) : (
    <EmptyCompareView />
  )
}

function EmptyCompareView() {
  return (
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 rounded-lg bg-gray-25'>
        <span className='font-medium'>No Prompts or Chains</span>
        <span className='text-sm text-center text-gray-400 w-60'>
          <span>Come back here later to compare existing prompt or chain versions.</span>
        </span>
      </div>
    </div>
  )
}
