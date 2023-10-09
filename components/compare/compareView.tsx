import { ActiveProject, ItemsInProject } from '@/types'
import { Allotment } from 'allotment'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useEffect, useState } from 'react'
import { PromptTab } from '../prompts/promptPanel'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import SegmentedControl, { Segment } from '../segmentedControl'
import DiffPane from './diffPane'

export default function CompareView({ project }: { project: ActiveProject }) {
  const router = useRouter()
  const { i: itemID, v: versionID, p: previousVersionID } = ParseNumberQuery(router.query)

  const [isDiffMode, setDiffMode] = useState(false)
  const [rightItemID, setRightItemID] = useState(itemID)
  const [rightVersionID, setRightVersionID] = useState(versionID)
  const [leftItemID, setLeftItemID] = useState(itemID)
  const [leftVersionID, setLeftVersionID] = useState(previousVersionID)
  const [activePromptTab, setActivePromptTab] = useState('main' as PromptTab)

  const itemCache = useActiveItemCache(project, [
    ...(leftItemID ? [leftItemID] : []),
    ...(rightItemID ? [rightItemID] : []),
  ])

  const leftItem = leftItemID ? itemCache.itemForID(leftItemID) : undefined
  const leftVersion = leftItem ? [...leftItem.versions].find(version => version.id === leftVersionID) : undefined

  const rightItem = rightItemID ? itemCache.itemForID(rightItemID) : undefined
  const rightVersion = rightItem ? [...rightItem.versions].find(version => version.id === rightVersionID) : undefined

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

  useEffect(() => {
    if (leftItem && !leftVersion) {
      setLeftVersionID(leftItem.versions.slice(-1)[0].id)
    }
    if (rightItem && !rightVersion) {
      updateRightVersionID(rightItem.versions.slice(-1)[0].id)
    }
  }, [leftItem, leftVersion, rightItem, rightVersion])

  return ItemsInProject(project).length > 0 ? (
    <>
      <div className='flex flex-col h-full'>
        <div className='flex h-full'>
          <ComparePane
            project={project}
            activeItem={leftItem}
            activeVersion={leftVersion}
            setItemID={setLeftItemID}
            setVersionID={setLeftVersionID}
            activePromptTab={activePromptTab}
            setActivePromptTab={setActivePromptTab}
            disabled={!leftItemID}
            includeResponses={!isDiffMode}
          />
          <div className='h-full border-l border-gray-200'/>
          <ComparePane
            project={project}
            activeItem={rightItem}
            activeVersion={rightVersion}
            setItemID={updateRightItemID}
            setVersionID={updateRightVersionID}
            activePromptTab={activePromptTab}
            setActivePromptTab={setActivePromptTab}
            includeResponses={!isDiffMode}
          />
        </div>
        {isDiffMode && leftVersion && rightVersion && (
          <DiffPane leftVersion={leftVersion} rightVersion={rightVersion} activePromptTab={activePromptTab} />
        )}
      </div>
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
