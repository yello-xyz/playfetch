import { useEffect, useRef, useState } from 'react'
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
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForPrompt(prompt)

  const containerRef = useRef<HTMLDivElement>(null)
  const containerRect = useContainerRect(containerRef)
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
    <>
      <div ref={containerRef} className='relative flex min-h-0'>
        <div className={`flex flex-col w-full ${filteredVersions.length > 0 ? 'overflow-hidden' : ''}`}>
          <VersionFilters
            users={prompt.users}
            labelColors={labelColors}
            versions={versions}
            filters={filters}
            setFilters={setFilters}
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
    </>
  ) : (
    <div />
  )
}
