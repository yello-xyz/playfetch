import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ActiveChain, ActivePrompt, ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import VersionFilters, { BuildVersionFilter, VersionFilter } from './versionFilters'
import VersionCell from './versionCell'
import useScrollDetection from '@/src/client/hooks/useScrollDetection'

export const ShouldShowVersions = <Version extends PromptVersion | ChainVersion>(versions: Version[]) =>
  versions.length > 1 || versions[0].runs.length > 0 || (!IsPromptVersion(versions[0]) && versions[0].items.length > 0)

export default function VersionTimeline<Version extends PromptVersion | ChainVersion>({
  activeItem,
  versions,
  activeVersion,
  setActiveVersion,
  tabSelector,
}: {
  activeItem: ActivePrompt | ActiveChain
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForItem(activeItem)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [, forceStateUpdate] = useState(0)
  useScrollDetection(forceStateUpdate, scrollRef)

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
  const previousPromptVersion = (version: Version) => {
    const previousVersion = versions.find(v => v.id === version.previousID)
    return previousVersion && IsPromptVersion(previousVersion) ? previousVersion : undefined
  }

  return (
    <div className='relative flex h-full'>
      {ShouldShowVersions(versions) ? (
        <div className={`flex flex-col w-full ${filteredVersions.length > 0 ? 'overflow-hidden' : ''}`}>
          <VersionFilters
            users={activeItem.users}
            labelColors={labelColors}
            versions={versions}
            filters={filters}
            setFilters={setFilters}
            tabSelector={tabSelector}
          />
          <div ref={scrollRef} className='flex flex-col px-4 pb-1.5 pt-3 overflow-y-auto gap-0'>
            {filteredVersions.map((version, index) => (
              <VersionCell
                key={index}
                identifier={identifierForVersion(version)}
                isLast={index === filteredVersions.length - 1}
                labelColors={labelColors}
                version={version}
                index={versions.findIndex(v => v.id === version.id)}
                isActiveVersion={version.id === activeVersion.id}
                compareVersion={previousPromptVersion(version)}
                activeItem={activeItem}
                onSelect={selectVersion}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className='flex flex-col w-full gap-4'>
          {tabSelector()}
          <div className='flex flex-col gap-4 px-4'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='min-h-[160px] bg-gray-50 rounded-lg ml-12'></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
