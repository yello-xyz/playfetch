import { ReactNode, useEffect, useRef, useState } from 'react'
import { ActivePrompt, Version } from '@/types'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import VersionFilters, { BuildVersionFilter, VersionFilter } from './versionFilters'
import VersionCell from './versionCell'
import useScrollDetection from './useScrollDetection'
import useContainerRect from './useContainerRect'

export default function VersionTimeline({
  prompt,
  activeVersion,
  setActiveVersion,
  tabSelector,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  tabSelector: ReactNode
}) {
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForPrompt(prompt)

  const [containerRect, containerRef] = useContainerRect()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [_, forceStateUpdate] = useState(0)
  useScrollDetection(forceStateUpdate, scrollRef)

  const identifierForVersion = (version: Version) => `v${version.id}`

  useEffect(() => {
    const element = document.getElementById(identifierForVersion(activeVersion))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeVersion])

  const selectVersion = (version: Version) => {
    setActiveVersion(version)
  }

  const versions = prompt.versions
  const filteredVersions = versions.filter(BuildVersionFilter(filters))

  return versions.length > 1 || versions[0].runs.length > 0 ? (
    <div ref={containerRef} className='relative flex h-full'>
      <div className={`flex flex-col w-full ${filteredVersions.length > 0 ? 'overflow-hidden' : ''}`}>
        <VersionFilters
          users={prompt.users}
          labelColors={labelColors}
          versions={versions}
          filters={filters}
          setFilters={setFilters}
          tabSelector={tabSelector}
        />
        <div ref={scrollRef} className='flex flex-col overflow-y-auto'>
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
              prompt={prompt}
              onSelect={selectVersion}
              containerRect={containerRect}
            />
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className='flex h-full'>
      <div className='flex flex-col w-full gap-4'>
        {tabSelector}
        <div className='flex flex-col gap-4 overflow-y-hidden'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='min-h-[160px] bg-gray-25 rounded-lg ml-14'></div>
          ))}
        </div>
      </div>
    </div>
  )
}
