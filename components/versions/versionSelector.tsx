import { ChainVersion, PromptVersion } from '@/types'
import { VersionLabels } from './versionCell'
import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent, PopupItem } from '../popupMenu'
import { useRef } from 'react'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'

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
  const buttonRef = useRef<HTMLDivElement>(null)

  const setPopup = useGlobalPopup<VersionSelectorPopupProps>()

  const togglePopup = disabled
    ? undefined
    : () => {
        const iconRect = buttonRef.current?.getBoundingClientRect()!
        setPopup(
          VersionSelectorPopup,
          { versions, onSelectVersionID, labelColors, hideChainReferences, hideEndpointReferences },
          { top: iconRect.y + 48, left: iconRect.x, right: fixedWidth ? iconRect.x + iconRect.width : undefined }
        )
      }

  const selectedVersion = versions.find(version => version.id === selectedVersionID)
  const versionIndex = versions.findIndex(version => version.id === selectedVersionID)
  const baseClass = 'flex items-center justify-between gap-1 px-2 rounded-md h-9 border border-gray-300'
  const disabledClass = disabled ? 'opacity-40' : 'cursor-pointer'

  return (
    <div className={`${baseClass} ${disabledClass} ${className}`} ref={buttonRef} onClick={togglePopup}>
      <span className='flex-1 overflow-hidden whitespace-nowrap text-ellipsis'>
        {selectedVersion ? `Version ${versionIndex + 1}` : 'Select Version'}
      </span>
      <Icon icon={chevronIcon} />
    </div>
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
