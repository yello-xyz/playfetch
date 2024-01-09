import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ActiveChain, ActivePrompt, ChainVersion, PromptVersion } from '@/types'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import VersionFilters, { BuildVersionFilter, VersionFilter } from './versionFilters'
import VersionCell from './versionCell'
import { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'

export default function VersionTimeline<Version extends PromptVersion | ChainVersion>({
  activeItem,
  versions,
  activeVersion,
  setActiveVersion,
  tabSelector,
  chainItemCache,
}: {
  activeItem: ActivePrompt | ActiveChain
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  tabSelector: (children?: ReactNode) => ReactNode
  chainItemCache?: ActiveItemCache
}) {
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForItem(activeItem)

  const identifierForVersion = useCallback((version: Version) => `v${version.id}`, [])

  useEffect(() => {
    const element = document.getElementById(identifierForVersion(activeVersion))
    if (element) {
      setTimeout(() => element.scrollIntoView({ behavior: 'auto', block: 'start' }), 100)
    }
  }, [activeVersion, identifierForVersion])

  const selectVersion = (version: Version) => {
    setActiveVersion(version)
  }

  const filteredVersions = versions.filter(BuildVersionFilter(filters))

  return (
    <div className='relative flex h-full'>
      {versions.length > 0 ? (
        <div className={`flex flex-col w-full ${filteredVersions.length > 0 ? 'overflow-hidden' : ''}`}>
          <VersionFilters
            users={activeItem.users}
            labelColors={labelColors}
            versions={versions}
            filters={filters}
            setFilters={setFilters}
            tabSelector={tabSelector}
          />
          <div className='flex flex-col px-3 pb-1.5 pt-3 overflow-y-auto gap-0'>
            {filteredVersions.map((version, index) => (
              <VersionCell
                key={index}
                identifier={identifierForVersion(version)}
                isLast={index === filteredVersions.length - 1}
                labelColors={labelColors}
                version={version}
                index={versions.findIndex(v => v.id === version.id)}
                isActiveVersion={version.id === activeVersion.id}
                compareVersion={versions.find(v => v.id === version.previousID)}
                activeItem={activeItem}
                onSelect={selectVersion}
                chainItemCache={chainItemCache}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className='flex flex-col w-full gap-4'>
          {tabSelector()}
          <div className='flex flex-col gap-4 px-4 overflow-y-hidden'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='min-h-[160px] bg-gray-50 rounded-lg ml-12'></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
