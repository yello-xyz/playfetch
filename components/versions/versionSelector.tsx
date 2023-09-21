import { ActiveChain, ActivePrompt, ChainVersion, PromptVersion } from '@/types'
import { VersionLabels } from './versionCell'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent, PopupItem } from '../popupMenu'
import { PopupButton } from '../popupButton'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'

export default function VersionSelector({
  projectItem,
  selectedVersionID,
  onSelectVersionID,
  hideChainReferences,
  hideEndpointReferences,
  disabled,
  fixedWidth,
  className = '',
}: {
  projectItem: ActivePrompt | ActiveChain | undefined
  selectedVersionID?: number
  onSelectVersionID: (versionID: number) => void
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
}) {
  const versions = projectItem?.versions ?? []
  const labelColors = projectItem ? AvailableLabelColorsForItem(projectItem) : {}

  const setPopup = useGlobalPopup<VersionSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(
      VersionSelectorPopup,
      { versions, onSelectVersionID, labelColors, hideChainReferences, hideEndpointReferences },
      location
    )
  }

  const selectedVersion = [...versions].find(version => version.id === selectedVersionID)
  const versionIndex = versions.findIndex(version => version.id === selectedVersionID)

  return (
    <PopupButton
      disabled={disabled || versions.length === 0}
      fixedWidth={fixedWidth}
      className={className}
      onSetPopup={onSetPopup}>
      <div className='flex items-center gap-1 overflow-hidden'>
        <VersionDescriptor
          version={selectedVersion}
          index={versionIndex}
          labelColors={labelColors}
          hideChainReferences={hideChainReferences}
          hideEndpointReferences={hideEndpointReferences}
          noWrap
        />
      </div>
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
          <VersionDescriptor
            version={version}
            index={index}
            labelColors={labelColors}
            hideChainReferences={hideChainReferences}
            hideEndpointReferences={hideEndpointReferences}
          />
        </PopupItem>
      ))}
    </PopupContent>
  )
}

function VersionDescriptor({
  version,
  index,
  labelColors,
  hideChainReferences,
  hideEndpointReferences,
  noWrap,
}: {
  version?: PromptVersion | ChainVersion
  index: number
  labelColors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  noWrap?: boolean
}) {
  return (
    <>
      <span className='pl-1 pr-2 whitespace-nowrap'>{version ? `Version ${index + 1}` : 'Select Version'}</span>
      {version && (
        <VersionLabels
          version={version}
          colors={labelColors}
          hideChainReferences={hideChainReferences}
          hideEndpointReferences={hideEndpointReferences}
          noWrap={noWrap}
        />
      )}
    </>
  )
}
