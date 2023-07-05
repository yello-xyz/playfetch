import { Version, Endpoint } from '@/types'
import DropdownMenu from './dropdownMenu'

export default function VersionSelector({
  versions,
  endpoints,
  activeVersion,
  setActiveVersion,
}: {
  versions: Version[]
  endpoints: Endpoint[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const suffix = (version: Version) => {
    const endpoint = endpoints.find(endpoint => endpoint.chain[0].versionID === version.id)
    return endpoint ? ` (${endpoint.flavor})` : ''
  }

  return (
    <DropdownMenu
      value={activeVersion.id}
      onChange={value => setActiveVersion(versions.find(version => version.id === Number(value))!)}>
      {versions
        .slice()
        .reverse()
        .map((version, index) => (
          <option key={index} value={version.id}>
            {`Prompt ${index + 1}${suffix(version)}`}
          </option>
        ))}
    </DropdownMenu>
  )
}
