import { ChainVersion, PromptVersion } from '@/types'
import { VersionLabels } from './versionCell'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent, PopupItem } from '../popupMenu'
import { PopupButton } from '../popupButton'

export default function VersionSelector({
  versions,
  selectedVersionID,
  onSelectVersionID,
  labelColors,
  hideChainReferences,
  hideEndpointReferences,
  disabled,
  fixedWidth,
  className = '',
}: {
  versions: PromptVersion[] | ChainVersion[]
  selectedVersionID?: number
  onSelectVersionID: (versionID: number) => void
  labelColors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
}) {
  const setPopup = useGlobalPopup<VersionSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(
      VersionSelectorPopup,
      { versions, onSelectVersionID, labelColors, hideChainReferences, hideEndpointReferences },
      location
    )
  }

  const selectedVersion = versions.find(version => version.id === selectedVersionID)
  const versionIndex = versions.findIndex(version => version.id === selectedVersionID)

  return (
    <PopupButton disabled={disabled} fixedWidth={fixedWidth} className={className} onSetPopup={onSetPopup}>
      <span className='flex-1 overflow-hidden whitespace-nowrap text-ellipsis'>
        {selectedVersion ? `Version ${versionIndex + 1}` : 'Select Version'}
      </span>
    </PopupButton>
  )
}

type VersionSelectorPopupProps = {
  versions: PromptVersion[] | ChainVersion[]
  onSelectVersionID: (versionID: number) => void
  labelColors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
}

function VersionSelectorPopup({
  versions,
  onSelectVersionID,
  labelColors,
  hideChainReferences,
  hideEndpointReferences,
  withDismiss,
}: VersionSelectorPopupProps & WithDismiss) {
  return (
    <PopupContent className='flex flex-col gap-1 p-3'>
      {versions.map((version, index) => (
        <PopupItem
          key={index}
          className='flex items-center gap-1 p-1'
          onClick={withDismiss(() => onSelectVersionID(version.id))}>
          <span className='pl-1 pr-2 whitespace-nowrap'>{`Version ${index + 1}`}</span>
          <VersionLabels
            version={version}
            colors={labelColors}
            hideChainReferences={hideChainReferences}
            hideEndpointReferences={hideEndpointReferences}
          />
        </PopupItem>
      ))}
    </PopupContent>
  )
}
