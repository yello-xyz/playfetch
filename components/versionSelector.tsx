import { ResolvedPromptEndpoint, Version } from '@/types'
import DropdownMenu from './dropdownMenu'

export default function VersionSelector({
  versions,
  endpoints,
  activeVersion,
  setActiveVersion,
}: {
  versions: Version[]
  endpoints: ResolvedPromptEndpoint[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const suffixForVersionID = (versionID: number) => {
    const flavors = endpoints.filter(endpoint => endpoint.versionID === versionID).map(endpoint => endpoint.flavor)
    return flavors.length > 0 ? ` (${[...new Set(flavors)].join(', ')})` : undefined
  }

  return (
    <VersionIDSelector
      versionIDs={versions.map(version => version.id)}
      suffixForVersionID={suffixForVersionID}
      activeVersionID={activeVersion.id}
      setActiveVersionID={versionID => setActiveVersion(versions.find(version => version.id === versionID)!)}
    />
  )
}

function VersionIDSelector({
  versionIDs,
  activeVersionID,
  setActiveVersionID,
  suffixForVersionID,
}: {
  versionIDs: number[]
  activeVersionID: number
  setActiveVersionID: (versionID: number) => void
  suffixForVersionID?: (versionID: number) => string | undefined
}) {
  return (
    <DropdownMenu value={activeVersionID} onChange={value => setActiveVersionID(Number(value))}>
      {versionIDs.map((versionID, index) => (
        <option key={index} value={versionID}>
          {`Prompt ${index + 1}${suffixForVersionID?.(versionID) ?? ''}`}
        </option>
      ))}
    </DropdownMenu>
  )
}
