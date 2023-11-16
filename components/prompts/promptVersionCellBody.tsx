import { ReactNode, useState } from 'react'
import { AvailableModelProvider, PromptConfig, PromptVersion } from '@/types'
import VersionComparison, { ContentComparison } from '../versions/versionComparison'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'
import { FullLabelForModel } from '@/src/common/providerMetadata'
import useAvailableProviders from '@/src/client/hooks/useAvailableProviders'
import { labelForChatMode } from './chatModePopupButton'

export default function PromptVersionCellBody({
  version,
  isActiveVersion,
  compareVersion,
}: {
  version: PromptVersion
  isActiveVersion: boolean
  compareVersion?: PromptVersion
}) {
  const availableProviders = useAvailableProviders()
  const getConfigContent = (version: PromptVersion) => formatConfig(version.config, availableProviders)

  return (
    <>
      <div className='border-b border-gray-200 border-b-1' />
      <CollapsibleSection title='Prompt' expanded>
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>
          <VersionComparison version={version} compareVersion={compareVersion} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title='Parameters'>
        <ContentComparison
          content={getConfigContent(version)}
          compareContent={compareVersion ? getConfigContent(compareVersion) : undefined}
        />
      </CollapsibleSection>
    </>
  )
}

const formatConfig = (config: PromptConfig, availableProviders: AvailableModelProvider[]) => 
`Model: ${FullLabelForModel(config.model, availableProviders)}
Mode: ${labelForChatMode(config.isChat)}
Max Tokens: ${config.maxTokens}
Temperature: ${config.temperature}`

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
