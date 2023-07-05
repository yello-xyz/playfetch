import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { ActivePrompt, Version } from '@/types'
import historyIcon from '@/public/history.svg'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import VersionFilters, { BuildVersionFilter, VersionFilter } from './versionFilters'
import Icon from './icon'
import VersionCell, { VerticalBarWrapper } from './versionCell'

function useScrollDetection(callback: () => void, element: RefObject<HTMLDivElement>) {
  const frame = useRef(0)
  const debouncedCallback = useCallback(() => {
    if (frame.current) {
      cancelAnimationFrame(frame.current)
    }
    frame.current = requestAnimationFrame(() => {
      callback()
    })
  }, [callback, frame])

  useEffect(() => {
    callback()
    const currentElement = element.current
    currentElement?.addEventListener('scroll', debouncedCallback, { passive: true })
    return () => {
      currentElement?.removeEventListener('scroll', debouncedCallback)
    }
  }, [element, callback, debouncedCallback])
}

export default function VersionTimeline({
  prompt,
  activeVersion,
  setActiveVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForPrompt(prompt)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerRect, setContainerRect] = useState<DOMRect>()
  useEffect(() => setContainerRect(containerRef.current?.getBoundingClientRect()), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [_, forceStateUpdate] = useState(0)
  useScrollDetection(() => forceStateUpdate(scrollRef.current?.scrollTop ?? 0), scrollRef)

  useEffect(() => {
    const element = document.getElementById(activeVersion.id.toString())
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeVersion, isFocused])

  const selectVersion = (version: Version) => {
    setFocused(true)
    setActiveVersion(version)
  }
  if (filters.length && isFocused) {
    setFocused(false)
  }

  const versions = prompt.versions
  const activeIndex = versions.findIndex(version => version.id === activeVersion.id)
  const previousIndex = versions.findIndex(version => version.id === activeVersion.previousID)
  const versionsToShow = isFocused ? versions : versions.filter(BuildVersionFilter(filters))

  return versions.length > 1 || versions[0].runs.length > 0 ? (
    <>
      <div ref={containerRef} className='relative flex min-h-0'>
        <div className={`flex flex-col w-full ${versionsToShow.length > 0 ? 'overflow-hidden' : ''}`}>
          <VersionFilters
            users={prompt.users}
            labelColors={labelColors}
            versions={versions}
            filters={filters}
            setFilters={setFilters}
          />
          <div ref={scrollRef} className='flex flex-col overflow-y-auto'>
            {versionsToShow.map((version, index) =>
              !isFocused || index <= previousIndex || index >= activeIndex ? (
                <VersionCell
                  key={index}
                  isOnly={versions.length == 1}
                  isLast={index === versionsToShow.length - 1}
                  labelColors={labelColors}
                  version={version}
                  index={versions.findIndex(v => v.id === version.id)}
                  isActiveVersion={version.id === activeVersion.id}
                  compareVersion={versions.find(v => v.id === version.previousID)}
                  prompt={prompt}
                  onSelect={selectVersion}
                  containerRect={containerRect}
                />
              ) : index === previousIndex + 1 ? (
                <VerticalBarWrapper key={index} strokeStyle='dashed'>
                  <div className='flex items-center mb-4 cursor-pointer' onClick={() => setFocused(false)}>
                    <Icon icon={historyIcon} />
                    View Full History
                  </div>
                </VerticalBarWrapper>
              ) : null
            )}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div />
  )
}
