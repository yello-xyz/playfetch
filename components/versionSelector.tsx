import { ResolvedEndpoint, Version } from '@/types'
import DropdownMenu from './dropdownMenu'
import { useState } from 'react'

export default function VersionSelector({
  versions,
  endpoints,
  activeVersion,
  setActiveVersion,
  flagIfNotLatest,
}: {
  versions: Version[]
  endpoints: ResolvedEndpoint[]
  activeVersion?: Version
  setActiveVersion: (version: Version) => void
  flagIfNotLatest?: boolean
}) {
  const suffixForVersionID = (versionID: number) => {
    const labels = [
      ...versions.filter(version => version.id === versionID).flatMap(version => version.labels),
      ...endpoints.filter(endpoint => endpoint.versionID === versionID).map(endpoint => endpoint.flavor),
    ]
    return labels.length > 0 ? ` (${[...new Set(labels)].join(', ')})` : undefined
  }

  return (
    <VersionIDSelector
      versionIDs={versions.map(version => version.id)}
      suffixForVersionID={suffixForVersionID}
      activeVersionID={activeVersion?.id ?? 0}
      setActiveVersionID={versionID => setActiveVersion(versions.find(version => version.id === versionID)!)}
      flagIfNotLatest={flagIfNotLatest}
    />
  )
}

function VersionIDSelector({
  versionIDs,
  activeVersionID,
  setActiveVersionID,
  suffixForVersionID,
  flagIfNotLatest,
}: {
  versionIDs: number[]
  activeVersionID: number
  setActiveVersionID: (versionID: number) => void
  suffixForVersionID?: (versionID: number) => string | undefined
  flagIfNotLatest?: boolean
}) {
  const [isFocused, setFocused] = useState(false)

  const className = flagIfNotLatest && activeVersionID !== versionIDs.slice(-1)[0] ? 'text-red-500' : undefined
  return (
    <DropdownMenu
      className={className}
      disabled={!versionIDs.length}
      value={activeVersionID}
      onChange={value => setActiveVersionID(Number(value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}>
      {versionIDs.map((versionID, index) => (
        <option key={index} value={versionID}>
          {`version ${index + 1}${isFocused ? suffixForVersionID?.(versionID) ?? '' : ''}`}
        </option>
      ))}
    </DropdownMenu>
  )
}
