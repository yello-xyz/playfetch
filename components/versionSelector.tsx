import { Version, ResolvedPromptEndpoint } from '@/types'
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
  const suffix = (version: Version) => {
    const flavors = endpoints.filter(endpoint => endpoint.versionID === version.id).map(endpoint => endpoint.flavor)
    return flavors.length > 0 ? ` (${flavors.join(', ')})` : ''
  }

  return (
    <DropdownMenu
      value={activeVersion.id}
      onChange={value => setActiveVersion(versions.find(version => version.id === Number(value))!)}>
      {versions.map((version, index) => (
        <option key={index} value={version.id}>
          {`Prompt ${index + 1}${suffix(version)}`}
        </option>
      ))}
    </DropdownMenu>
  )
}
