import { ChainVersion, PromptVersion, ResolvedEndpoint } from '@/types'
import DropdownMenu from './dropdownMenu'
import { useState } from 'react'
import { VersionLabels } from './versionCell'

export default function VersionSelector<T extends PromptVersion | ChainVersion>({
  versions,
  endpoints,
  activeVersion,
  setActiveVersion,
  flagIfNotLatest,
  labelColors = {},
  hideReferences,
  disabled,
}: {
  versions: T[]
  endpoints: ResolvedEndpoint[]
  activeVersion?: T
  setActiveVersion: (version: T) => void
  flagIfNotLatest?: boolean
  labelColors?: Record<string, string>
  hideReferences?: boolean
  disabled?: boolean
}) {
  const suffixForVersionID = (versionID: number) => {
    const labels = [
      ...versions.filter(version => version.id === versionID).flatMap(version => version.labels),
      ...endpoints.filter(endpoint => endpoint.versionID === versionID).map(endpoint => endpoint.flavor),
    ]
    return labels.length > 0 ? ` (${[...new Set(labels)].join(', ')})` : undefined
  }

  return (
    <div className='flex flex-col gap-2'>
      <VersionIDSelector
        versionIDs={versions.map(version => version.id)}
        suffixForVersionID={suffixForVersionID}
        activeVersionID={activeVersion?.id ?? 0}
        setActiveVersionID={versionID => setActiveVersion(versions.find(version => version.id === versionID)!)}
        flagIfNotLatest={flagIfNotLatest}
        disabled={disabled}
      />
      {activeVersion && <VersionLabels version={activeVersion} colors={labelColors} hideReferences={hideReferences} />}
    </div>
  )
}

function VersionIDSelector({
  versionIDs,
  activeVersionID,
  setActiveVersionID,
  suffixForVersionID,
  flagIfNotLatest,
  disabled,
}: {
  versionIDs: number[]
  activeVersionID: number
  setActiveVersionID: (versionID: number) => void
  suffixForVersionID?: (versionID: number) => string | undefined
  flagIfNotLatest?: boolean
  disabled?: boolean
}) {
  const [isFocused, setFocused] = useState(false)

  const className = flagIfNotLatest && activeVersionID !== versionIDs.slice(-1)[0] ? 'text-red-500' : undefined
  return (
    <DropdownMenu
      className={className}
      disabled={!versionIDs.includes(activeVersionID) || disabled}
      value={activeVersionID}
      onChange={value => setActiveVersionID(Number(value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}>
      {!versionIDs.includes(activeVersionID) && (
        <option value={activeVersionID} disabled>
          Select version
        </option>
      )}
      {versionIDs.map((versionID, index) => (
        <option key={index} value={versionID}>
          {`Version ${index + 1}${isFocused ? suffixForVersionID?.(versionID) ?? '' : ''}`}
        </option>
      ))}
    </DropdownMenu>
  )
}
