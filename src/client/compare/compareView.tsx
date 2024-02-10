import { Endpoint, LogEntry } from '@/types'
import ComparePane from './comparePane'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import DiffPane from './diffPane'
import useDiffContent from '@/src/client/hooks/useDiffContent'
import { IsEndpoint } from '@/src/common/activeItem'
import { useActiveProject } from '@/src/client/projects/projectContext'
import TabsHeader from '../components/tabsHeader'
import { Filter } from '../filters/filters'
import { RunSortOption } from '@/src/client/runs/runMerging'
import RunFiltersHeader from '../runs/runFiltersHeader'

export default function CompareView({
  logEntries = [],
  setRefreshItems,
}: {
  logEntries?: LogEntry[]
  setRefreshItems: (refresh: () => void) => void
}) {
  const router = useRouter()
  const { i: itemID, v: versionID, p: previousVersionID } = ParseNumberQuery(router.query)

  type CompareTab = 'Diff' | 'Responses'
  const [activeTab, setActiveTab] = useState<CompareTab>('Responses')
  const [runSortOption, setRunSortOption] = useState<RunSortOption>('Date')
  const [runFilters, setRunFilters] = useState<Filter[]>([])

  const [rightItemID, setRightItemID] = useState(itemID)
  const [rightVersionID, setRightVersionID] = useState(versionID)
  const [leftItemID, setLeftItemID] = useState(itemID)
  const [leftVersionID, setLeftVersionID] = useState(previousVersionID)

  const activeProject = useActiveProject()
  const endpointForID = useCallback(
    (endpointID: number) => activeProject.endpoints.find(endpoint => endpoint.id === endpointID),
    [activeProject]
  )

  const itemCache = useActiveItemCache(activeProject, [
    ...(leftItemID && !endpointForID(leftItemID) ? [leftItemID] : []),
    ...(rightItemID && !endpointForID(rightItemID) ? [rightItemID] : []),
  ])

  const refreshItem = useCallback(
    (itemID: number) => itemCache.refreshItem(itemID),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    setRefreshItems(() => () => {
      if (leftItemID && !endpointForID(leftItemID)) {
        refreshItem(leftItemID)
      }
      if (rightItemID !== leftItemID && rightItemID && !endpointForID(rightItemID)) {
        refreshItem(rightItemID)
      }
    })
  }, [leftItemID, rightItemID, setRefreshItems, endpointForID, refreshItem])

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

  const comparableItems = [...activeProject.prompts, ...activeProject.chains, ...activeProject.endpoints]
  const tabSelector = (children?: ReactNode) => (
    <TabsHeader tabs={['Diff', 'Responses']} activeTab={activeTab} setActiveTab={setActiveTab}>
      {children}
    </TabsHeader>
  )

  return comparableItems.length > 0 ? (
    <>
      <div className='flex flex-col h-full bg-gray-25'>
        {activeTab === 'Diff' ? (
          tabSelector()
        ) : (
          <RunFiltersHeader
            activeItem={activeProject}
            runs={[...(leftVersion?.runs ?? []), ...(rightVersion?.runs ?? [])]}
            filters={runFilters}
            setFilters={setRunFilters}
            sortOption={runSortOption}
            setSortOption={setRunSortOption}
            tabSelector={tabSelector}
          />
        )}
        <div className={activeTab === 'Diff' ? 'flex' : 'flex min-h-0'}>
          <ComparePane
            project={activeProject}
            comparableItems={comparableItems}
            logEntries={logEntries}
            activeItem={leftItem}
            activeVersion={leftVersion}
            setItemID={setLeftItemID}
            setVersionID={setLeftVersionID}
            disabled={!leftItemID}
            includeResponses={activeTab === 'Responses'}
            runFilters={runFilters}
            runSortOption={runSortOption}
          />
          <div className='h-full border-l border-gray-200' />
          <ComparePane
            project={activeProject}
            comparableItems={comparableItems}
            logEntries={logEntries}
            activeItem={rightItem}
            activeVersion={rightVersion}
            setItemID={updateRightItemID}
            setVersionID={updateRightVersionID}
            includeResponses={activeTab === 'Responses'}
            runFilters={runFilters}
            runSortOption={runSortOption}
          />
        </div>
        {activeTab === 'Diff' && leftContent && rightContent && (
          <div className='overflow-y-auto'>
            <DiffPane leftContent={leftContent} rightContent={rightContent} />
          </div>
        )}
      </div>
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
