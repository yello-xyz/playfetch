import { Endpoint, ItemsInProject, LogEntry } from '@/types'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useCallback, useEffect, useState } from 'react'
import { ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import SegmentedControl, { Segment } from '../segmentedControl'
import DiffPane from './diffPane'
import useDiffContent from '@/src/client/hooks/useDiffContent'
import { IsEndpoint } from '@/src/common/activeItem'
import { useActiveProject } from '@/src/client/context/projectContext'

export default function CompareView({ logEntries = [] }: { logEntries?: LogEntry[] }) {
  const router = useRouter()
  const { i: itemID, v: versionID, p: previousVersionID } = ParseNumberQuery(router.query)

  const [isDiffMode, setDiffMode] = useState(false)
  const [rightItemID, setRightItemID] = useState(itemID)
  const [rightVersionID, setRightVersionID] = useState(versionID)
  const [leftItemID, setLeftItemID] = useState(itemID)
  const [leftVersionID, setLeftVersionID] = useState(previousVersionID)

  const activeProject = useActiveProject()
  const endpointForID = (endpointID: number) => activeProject.endpoints.find(endpoint => endpoint.id === endpointID)

  const itemCache = useActiveItemCache(activeProject, [
    ...(leftItemID && !endpointForID(leftItemID) ? [leftItemID] : []),
    ...(rightItemID && !endpointForID(rightItemID) ? [rightItemID] : []),
  ])

  const loadItem = (itemID: number | undefined) =>
    itemID ? endpointForID(itemID) ?? itemCache.itemForID(itemID) : undefined
  const leftItem = loadItem(leftItemID)
  const rightItem = loadItem(rightItemID)

  const loadVersion = (item: typeof leftItem, versionID: number | undefined) =>
    item && !IsEndpoint(item) ? [...item.versions].find(version => version.id === versionID) : undefined
  const leftVersion = loadVersion(leftItem, leftVersionID)
  const rightVersion = loadVersion(rightItem, rightVersionID)

  const [leftContent, rightContent] = useDiffContent(activeProject, leftItem, rightItem, leftVersion, rightVersion)

  const updateRightItemID = (itemID: number) => {
    if (itemID !== rightItemID) {
      if (endpointForID(itemID)) {
        const endpoint = loadItem(itemID) as Endpoint
        const compareEndpoint =
          activeProject.endpoints.find(e => e.urlPath === endpoint.urlPath && e.flavor !== endpoint.flavor) ??
          activeProject.endpoints.find(e => e.id !== itemID && e.id === leftItemID) ??
          activeProject.endpoints.find(e => e.urlPath !== endpoint.urlPath) ??
          endpoint
        setLeftItemID(compareEndpoint.id)
      } else {
        setLeftItemID(itemID)
      }
      setRightItemID(itemID)
    }
  }

  const updateRightVersionID = useCallback(
    (versionID: number) => {
      if (versionID !== rightVersionID) {
        if (rightItemID && leftItemID === rightItemID) {
          const rightVersions = itemCache.itemForID(rightItemID)?.versions ?? []
          const rightVersion = [...rightVersions].find(version => version.id === versionID)
          const leftVersionID = rightVersion?.previousID ?? versionID
          setTimeout(() => {
            setLeftVersionID(leftVersionID)
          })
        }
        setRightVersionID(versionID)
      }
    },
    [itemCache, leftItemID, rightItemID, rightVersionID]
  )

  useEffect(() => {
    if (leftItem && !IsEndpoint(leftItem) && !leftVersion) {
      setLeftVersionID(leftItem.versions.slice(-1)[0].id)
    }
    if (rightItem && !IsEndpoint(rightItem) && !rightVersion) {
      updateRightVersionID(rightItem.versions.slice(-1)[0].id)
    }
  }, [leftItem, leftVersion, rightItem, rightVersion, updateRightVersionID])

  return ItemsInProject(activeProject).length > 0 ? (
    <>
      <div className='flex flex-col h-full'>
        <div className={isDiffMode ? 'flex' : 'flex h-full'}>
          <ComparePane
            project={activeProject}
            logEntries={logEntries}
            activeItem={leftItem}
            activeVersion={leftVersion}
            setItemID={setLeftItemID}
            setVersionID={setLeftVersionID}
            disabled={!leftItemID}
            includeResponses={!isDiffMode}
          />
          <div className='h-full border-l border-gray-200' />
          <ComparePane
            project={activeProject}
            logEntries={logEntries}
            activeItem={rightItem}
            activeVersion={rightVersion}
            setItemID={updateRightItemID}
            setVersionID={updateRightVersionID}
            includeResponses={!isDiffMode}
          />
        </div>
        {isDiffMode && leftContent && rightContent && (
          <DiffPane leftContent={leftContent} rightContent={rightContent} />
        )}
      </div>
      {(IsEndpoint(leftItem) || leftVersionID) && (IsEndpoint(rightItem) || rightVersionID) && (
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
