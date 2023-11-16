import { ReactNode, useState } from 'react'
import { PromptVersion, ChainVersion, IsPromptVersion } from '@/types'
import VersionComparison from './versionComparison'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'

export default function VersionCellBody<Version extends PromptVersion | ChainVersion>({
  version,
  isActiveVersion,
  compareVersion,
}: {
  version: Version
  isActiveVersion: boolean
  compareVersion?: PromptVersion
}) {
  return IsPromptVersion(version) ? (
    <PromptVersionCellBody version={version} compareVersion={compareVersion} isActiveVersion={isActiveVersion} />
  ) : null
}

function PromptVersionCellBody({
  version,
  isActiveVersion,
  compareVersion,
}: {
  version: PromptVersion
  isActiveVersion: boolean
  compareVersion?: PromptVersion
}) {
  return (
    <>
      <div className='border-b border-gray-200 border-b-1' />
      <CollapsibleSection title='Prompt' expanded>
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>
          <VersionComparison version={version} compareVersion={compareVersion} />
        </div>
      </CollapsibleSection>
    </>
  )
}

function CollapsibleSection({
  title,
  expanded: initiallyExpanded = false,
  children,
}: {
  title: string
  expanded?: boolean
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)

  return (
    <div>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>{title}</span>
      </div>
      {isExpanded && <div className='ml-6'>{children}</div>}
    </div>
  )
}
