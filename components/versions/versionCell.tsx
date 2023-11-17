import { ReactNode } from 'react'
import { ActivePrompt, PromptVersion, ChainVersion, ActiveChain, IsPromptVersion } from '@/types'
import VersionCellHeader from './versionCellHeader'
import PromptVersionCellBody from '../prompts/promptVersionCellBody'
import ChainVersionCellBody from '../chains/chainVersionCellBody'
import { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'

export default function VersionCell<Version extends PromptVersion | ChainVersion>({
  identifier,
  labelColors,
  version,
  index,
  isLast,
  isActiveVersion,
  compareVersion,
  activeItem,
  onSelect,
  chainItemCache,
}: {
  identifier: string
  labelColors: Record<string, string>
  version: Version
  index: number
  isLast: boolean
  isActiveVersion: boolean
  compareVersion?: Version
  activeItem: ActivePrompt | ActiveChain
  onSelect: (version: Version) => void
  chainItemCache?: ActiveItemCache
}) {
  return (
    <VerticalBarWrapper
      id={identifier}
      sequenceNumber={index + 1}
      bulletStyle={isActiveVersion ? 'filled' : 'stroked'}
      strokeStyle={isLast ? 'none' : 'stroked'}>
      <div
        className={`flex-1 border rounded-lg cursor-pointer px-4 py-3 flex flex-col gap-2 mb-2.5 mt-1 ${
          isActiveVersion ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => onSelect(version)}>
        <VersionCellHeader
          identifier={identifier}
          labelColors={labelColors}
          version={version}
          isActiveVersion={isActiveVersion}
          activeItem={activeItem}
        />
        <div className='border-b border-gray-200 border-b-1' />
        {IsPromptVersion(version) ? (
          <PromptVersionCellBody
            version={version}
            compareVersion={compareVersion as PromptVersion | undefined}
            isActiveVersion={isActiveVersion}
          />
        ) : chainItemCache ? (
          <ChainVersionCellBody
            version={version}
            compareVersion={compareVersion as ChainVersion | undefined}
            isActiveVersion={isActiveVersion}
            itemCache={chainItemCache}
          />
        ) : null}
      </div>
    </VerticalBarWrapper>
  )
}

function VerticalBarWrapper({
  id,
  sequenceNumber = undefined,
  bulletStyle = 'stroked',
  strokeStyle = 'none',
  children,
}: {
  id?: string
  sequenceNumber?: number
  bulletStyle?: 'filled' | 'stroked'
  strokeStyle?: 'stroked' | 'dashed' | 'none'
  children: ReactNode
}) {
  const isFilled = bulletStyle === 'filled'
  const hasStroke = strokeStyle !== 'none'
  const isDashed = strokeStyle === 'dashed'
  const isSingleItem = sequenceNumber === 1 && !hasStroke

  return (
    <div id={id} className='flex items-stretch gap-4'>
      {!isSingleItem && (
        <div className='flex flex-col items-end w-10 gap-1 -ml-2'>
          {sequenceNumber !== undefined && (
            <div className='flex items-center gap-2'>
              <span className={`${isFilled ? 'text-gray-700' : 'text-gray-300'} text-xs font-medium`}>
                {sequenceNumber}
              </span>
              <div className={`rounded-full w-2.5 h-2.5 ${isFilled ? 'bg-dark-gray-700' : 'border border-gray-400'}`} />
            </div>
          )}
          {hasStroke && (
            <div className={`border-l flex-1 mb-1 pr-1 border-gray-300 ${isDashed ? 'border-dashed' : ''}`} />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
