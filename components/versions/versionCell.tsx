import { ReactNode, useState } from 'react'
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
  const [isExpanded, setExpanded] = useState(false)
  const [areChildrenExpanded, setChildrenExpanded] = useState<boolean>()

  const toggleExpanded = (expanded: boolean, isShiftClick: boolean) => {
    setExpanded(expanded)
    isShiftClick && setChildrenExpanded(expanded)
  }

  return (
    <VerticalBarWrapper
      id={identifier}
      sequenceNumber={version.didRun ? index + 1 : undefined}
      isFirst={index === 0}
      isLast={isLast}
      isActive={isActiveVersion}>
      <div
        className={`flex-1 border rounded-lg cursor-pointer pl-4 pr-3 py-2.5 flex flex-col gap-2 mb-1.5 mt-1 ${
          isActiveVersion
            ? 'bg-blue-25 border-blue-100'
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        } ${version.didRun ? 'border-solid' : 'border-dashed'}`}
        onClick={() => onSelect(version)}>
        <VersionCellHeader
          identifier={identifier}
          labelColors={labelColors}
          version={version}
          isActiveVersion={isActiveVersion}
          activeItem={activeItem}
          isExpanded={isExpanded}
          setExpanded={toggleExpanded}
        />
        {isExpanded && (
          <>
            <div className='border-b border-gray-200 border-b-1' />
            {IsPromptVersion(version) ? (
              <PromptVersionCellBody
                version={version}
                compareVersion={compareVersion as PromptVersion | undefined}
                isActiveVersion={isActiveVersion}
                isExpanded={areChildrenExpanded}
                setExpanded={(expanded, isShiftClick) => isShiftClick && setChildrenExpanded(expanded)}
              />
            ) : chainItemCache ? (
              <ChainVersionCellBody
                version={version}
                compareVersion={compareVersion as ChainVersion | undefined}
                isActiveVersion={isActiveVersion}
                itemCache={chainItemCache}
              />
            ) : null}
          </>
        )}
      </div>
    </VerticalBarWrapper>
  )
}

function VerticalBarWrapper({
  id,
  sequenceNumber,
  isActive,
  isFirst,
  isLast,
  children,
}: {
  id?: string
  sequenceNumber: number | undefined
  isActive: boolean
  isFirst: boolean
  isLast: boolean
  children: ReactNode
}) {
  const bulletColor =
    sequenceNumber === undefined ? 'border border-gray-200' : isActive ? 'bg-dark-gray-700' : 'bg-gray-200'
  return (
    <div id={id} className='flex items-stretch gap-3'>
      {!(isFirst && isLast) && (
        <div className='flex flex-col items-end w-10 gap-1 -ml-2'>
          <div className='flex items-center gap-2'>
            <span className={`${isActive ? 'text-gray-700' : 'text-gray-300'} text-xs font-medium`}>
              {sequenceNumber}
            </span>
            <div className={`rounded-full w-2.5 h-2.5 ${bulletColor}`} />
          </div>
          {!isLast && <div className='flex-1 pr-1 mb-1 border-l border-gray-200' />}
        </div>
      )}
      {children}
    </div>
  )
}
