import { ActiveProject } from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'
import { useEffect } from 'react'
import RunTimeline from '../runs/runTimeline'

export default function ComparePane({
  project,
  itemID,
  setItemID,
  versionID,
  setVersionID,
  itemCache,
  disabled,
}: {
  project: ActiveProject
  itemID?: number
  setItemID: (itemID: number) => void
  versionID?: number
  setVersionID: (versionID: number) => void
  itemCache: ActiveItemCache
  disabled?: boolean
}) {
  const activeItem = itemID ? itemCache.itemForID(itemID) : undefined
  const activeVersion =
    activeItem && versionID ? [...activeItem.versions].find(version => version.id === versionID) : undefined

  useEffect(() => {
    if (activeItem && !activeVersion) {
      setVersionID(activeItem.versions.slice(-1)[0].id)
    }
  }, [activeItem, activeVersion, setVersionID])

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center gap-1 p-4 border-b border-gray-200'>
        <ProjectItemSelector
          className='w-full max-w-[240px]'
          project={project}
          selectedItemID={itemID}
          onSelectItemID={setItemID}
          disabled={disabled}
        />
        <VersionSelector
          className='w-full max-w-[240px]'
          projectItem={activeItem}
          selectedVersionID={versionID}
          onSelectVersionID={setVersionID}
          disabled={disabled}
        />
      </div>
      {activeVersion && (
        <div className='overflow-y-auto'>
          <RunTimeline runs={activeVersion.runs} activeItem={activeItem} version={activeVersion} skipHeader />
        </div>
      )}
    </div>
  )
}
