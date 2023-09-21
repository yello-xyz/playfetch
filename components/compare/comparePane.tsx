import { ActiveProject } from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'
import { useEffect } from 'react'

export default function ComparePane({
  project,
  itemID,
  setItemID,
  versionID,
  setVersionID,
  itemCache,
}: {
  project: ActiveProject
  itemID?: number
  setItemID: (itemID: number) => void
  versionID?: number
  setVersionID: (versionID: number) => void
  itemCache: ActiveItemCache
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
    <div className='flex items-center gap-1 p-4'>
      <ProjectItemSelector
        className='w-full max-w-[200px]'
        project={project}
        selectedItemID={itemID}
        onSelectItemID={setItemID}
      />
      <VersionSelector
        className='w-full max-w-[240px]'
        projectItem={activeItem}
        selectedVersionID={versionID}
        onSelectVersionID={setVersionID}
      />
    </div>
  )
}
