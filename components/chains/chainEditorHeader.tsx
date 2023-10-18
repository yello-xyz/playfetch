import { ActiveChain, ChainVersion } from '@/types'
import { CustomHeader } from '../tabSelector'
import Icon from '../icon'
import chainIcon from '@/public/chain.svg'
import saveIcon from '@/public/save.svg'
import historyIcon from '@/public/history.svg'
import { StaticImageData } from 'next/image'

export default function ChainEditorHeader({
  chain,
  activeVersion,
  saveItems,
  showVersions,
  setShowVersions,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  saveItems?: () => void
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
}) {
  const versionIndex = chain.versions.findIndex(version => version.id === activeVersion.id)

  return (
    <CustomHeader>
      <ShowVersionsButton showVersions={showVersions} setShowVersions={setShowVersions} />
      <HeaderTitle chainName={chain.name} versionIndex={saveItems || !setShowVersions ? undefined : versionIndex} />
    </CustomHeader>
  )
}

function HeaderTitle({ chainName, versionIndex }: { chainName: string; versionIndex?: number }) {
  return (
    <div className='flex flex-wrap items-center justify-center h-full gap-2 overflow-hidden shrink-0 max-h-11'>
      <div className='flex items-center h-full font-medium select-none whitespace-nowrap'>
        <Icon icon={chainIcon} className='h-full py-2.5' />
        {chainName}
      </div>
      {versionIndex === undefined ? (
        <span className='px-2 py-1 text-gray-400 rounded bg-gray-50'>Unsaved</span>
      ) : (
        <span className='text-gray-400 whitespace-nowrap'>Version {versionIndex + 1}</span>
      )}
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
