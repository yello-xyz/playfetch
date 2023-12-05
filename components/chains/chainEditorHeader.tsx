import { ActiveChain, ChainVersion } from '@/types'
import { CustomHeader, EditableHeaderItem } from '../tabSelector'
import Icon from '../icon'
import chainIcon from '@/public/chain.svg'
import historyIcon from '@/public/history.svg'
import { StaticImageData } from 'next/image'
import { useState } from 'react'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'
import api from '@/src/client/api'

export default function ChainEditorHeader({
  chain,
  activeVersion,
  isVersionSaved,
  showVersions,
  setShowVersions,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  isVersionSaved: boolean
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
}) {
  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()
  const renameChain = (name: string) =>
    api.renameChain(chain.id, name).then(() => {
      refreshProject()
      return refreshActiveItem()
    })

  return (
    <CustomHeader>
      <ShowVersionsButton showVersions={showVersions} setShowVersions={setShowVersions} />
      <HeaderTitle
        chainName={chain.name}
        onRename={renameChain}
        versionIndex={chain.versions.findIndex(version => version.id === activeVersion.id)}
        versionIsSaved={isVersionSaved && !!setShowVersions}
        versionIsPublished={activeVersion.didRun}
      />
      <HiddenHeaderButton />
    </CustomHeader>
  )
}

function HeaderTitle({
  chainName,
  versionIndex,
  versionIsSaved,
  versionIsPublished,
  onRename,
}: {
  chainName: string
  versionIndex: number
  versionIsSaved: boolean
  versionIsPublished: boolean
  onRename: (name: string) => Promise<void>
}) {
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => onRename(name).then(() => setLabel(undefined))

  return (
    <div className='flex flex-wrap items-center justify-center h-full gap-2 overflow-hidden shrink-0 max-h-11'>
      <div
        className='flex items-center h-full font-medium select-none whitespace-nowrap cursor-text'
        onClick={() => setLabel(chainName)}>
        {label === undefined && <Icon icon={chainIcon} className='h-full py-2.5' />}
        {label !== undefined ? (
          <EditableHeaderItem
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          chainName
        )}
      </div>
      {label === undefined &&
        (versionIsSaved && versionIsPublished ? (
          <span className='text-gray-400 whitespace-nowrap'>Version {versionIndex + 1}</span>
        ) : (
          <span className='px-2 py-1 text-gray-400 rounded bg-gray-50'>
            {versionIsSaved ? 'Unpublished' : 'Unsaved'}
          </span>
        ))}
    </div>
  )
}

const ShowVersionsButton = ({
  showVersions,
  setShowVersions,
}: {
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
}) => (
  <HeaderButton
    onClick={setShowVersions ? () => setShowVersions(!showVersions) : undefined}
    title={showVersions ? 'Hide versions' : 'Show versions'}
    icon={historyIcon}
    justify='justify-start'
    hideIfInactive
  />
)

const HiddenHeaderButton = () => <ShowVersionsButton showVersions />

function HeaderButton({
  title,
  icon,
  justify,
  onClick,
  hideIfInactive,
}: {
  title: string
  icon: StaticImageData
  justify: 'justify-start' | 'justify-end' | 'justify-center'
  onClick?: () => void
  hideIfInactive?: boolean
}) {
  const activeClass = onClick ? 'cursor-pointer hover:bg-gray-50' : hideIfInactive ? 'opacity-0' : 'opacity-50'
  return (
    <div className={`rounded-md max-h-7 py-1 overflow-hidden ${activeClass}`} onClick={onClick}>
      <div className={`flex flex-wrap items-center -mt-0.5 px-1.5 ${justify}`}>
        <Icon icon={icon} className='h-full' />
        <span className='whitespace-nowrap'>{title}</span>
      </div>
    </div>
  )
}
