import { ResolvedEndpoint, Version } from '@/types'
import DropdownMenu from './dropdownMenu'

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
    const flavors = endpoints.filter(endpoint => endpoint.versionID === versionID).map(endpoint => endpoint.flavor)
    return flavors.length > 0 ? ` (${[...new Set(flavors)].join(', ')})` : undefined
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
  const className = flagIfNotLatest && activeVersionID !== versionIDs.slice(-1)[0] ? 'text-red-500' : undefined
  return (
    <DropdownMenu
      className={className}
      disabled={!versionIDs.length}
      value={activeVersionID}
      onChange={value => setActiveVersionID(Number(value))}>
      {versionIDs.map((versionID, index) => (
        <option key={index} value={versionID}>
          {`Prompt ${index + 1}${suffixForVersionID?.(versionID) ?? ''}`}
        </option>
      ))}
    </DropdownMenu>
  )
}
