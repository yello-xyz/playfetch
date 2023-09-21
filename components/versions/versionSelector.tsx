import { ChainVersion, PromptVersion } from '@/types'
import DropdownMenu from '../dropdownMenu'
import { VersionLabels } from './versionCell'

export default function VersionSelector({
  versions,
  selectedVersionID,
  onSelectVersionID,
  labelColors = {},
  hideChainReferences,
  hideEndpointReferences,
  disabled,
}: {
  versions: PromptVersion[] | ChainVersion[]
  selectedVersionID?: number
  onSelectVersionID: (versionID: number) => void
  labelColors?: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  disabled?: boolean
}) {
  const selectedVersion = versions.find(version => version.id === selectedVersionID)

  return (
    <div className='flex flex-col gap-2'>
      <DropdownMenu disabled={disabled} value={selectedVersionID} onChange={value => onSelectVersionID(Number(value))}>
        {!selectedVersion && (
          <option value={selectedVersionID} disabled>
            Select version
          </option>
        )}
        {versions.map((version, index) => (
          <option key={index} value={version.id}>
            {`Version ${index + 1}`}
          </option>
        ))}
      </DropdownMenu>
      {selectedVersion && (
        <VersionLabels
          version={selectedVersion}
          colors={labelColors}
          hideChainReferences={hideChainReferences}
          hideEndpointReferences={hideEndpointReferences}
        />
      )}
    </div>
  )
}
