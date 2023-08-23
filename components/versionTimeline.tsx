import { ReactNode, useEffect, useRef, useState } from 'react'
import { ActivePrompt, PromptVersion } from '@/types'
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
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForPrompt(prompt)

  const [containerRect, containerRef] = useContainerRect()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [, forceStateUpdate] = useState(0)
  useScrollDetection(forceStateUpdate, scrollRef)

  const identifierForVersion = (version: PromptVersion) => `v${version.id}`

  useEffect(() => {
    const element = document.getElementById(identifierForVersion(activeVersion))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeVersion])

  const selectVersion = (version: PromptVersion) => {
    setActiveVersion(version)
  }

  const versions = prompt.versions
  const filteredVersions = versions.filter(BuildVersionFilter(filters))
  const displayTimeline = filteredVersions.length !== 1

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
        <div
          ref={scrollRef}
          className={`flex flex-col pl-2 pr-4 pb-1.5 pt-3 overflow-y-auto gap-0 ${displayTimeline ? '' : 'pl-4'}`}>
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
              displayTimeline={displayTimeline}
            />
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className='flex h-full'>
      <div className='flex flex-col w-full gap-4'>
        {tabSelector()}
        <div className='flex flex-col gap-4 px-4'>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className='min-h-[160px] bg-gray-50 rounded-lg ml-14'></div>
          ))}
        </div>
      </div>
    </div>
  )
}
