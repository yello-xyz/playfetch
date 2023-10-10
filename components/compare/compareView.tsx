import {
  ActiveProject,
  ActivePrompt,
  ChainItem,
  ChainItemWithInputs,
  ChainVersion,
  IsPromptVersion,
  ItemsInProject,
  PromptVersion,
} from '@/types'
import ComparePane, { IsEndpoint } from './comparePane'
import useActiveItemCache, { ActiveItemCache } from '@/src/client/hooks/useActiveItemCache'
import { useCallback, useEffect, useState } from 'react'
import { PromptTab } from '../prompts/promptPanel'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import SegmentedControl, { Segment } from '../segmentedControl'
import DiffPane from './diffPane'
import { IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from '../chains/chainNode'
import { LabelForProvider } from '@/src/common/providerMetadata'

const getPromptVersionContent = (version: PromptVersion, activePromptTab: PromptTab) => {
  switch (activePromptTab) {
    case 'main':
    case 'functions':
    case 'system':
      return version.prompts[activePromptTab]
    case 'settings':
      return version.config
        ? `Model: ${version.config.model}
Maximum Tokens: ${version.config.maxTokens}
Temperature: ${version.config.temperature}`
        : undefined
  }
}

const getChainItemTitle = (item: ChainItemWithInputs, chainItemCache: ActiveItemCache) => {
  if (IsCodeChainItem(item)) {
    return `• Code block: ${item.name ?? ''}`
  } else if (IsQueryChainItem(item)) {
    return `• Query: ${LabelForProvider(item.provider)} “${item.indexName}” (${item.topK} Top-K)`
  } else {
    let versionSuffix = ''
    const prompt = chainItemCache.itemForID(item.promptID) as ActivePrompt | undefined
    if (prompt) {
      const versionIndex = prompt.versions.findIndex(version => version.id === item.versionID)
      if (versionIndex >= 0) {
        versionSuffix = ` (Version ${versionIndex + 1})`
      }
    }
    return `• Prompt: ${chainItemCache.nameForID(item.promptID)}${versionSuffix}`
  }
}

const getChainItemBody = (item: ChainItemWithInputs, chainItemCache: ActiveItemCache) => {
  if (IsCodeChainItem(item)) {
    return item.code
  } else if (IsQueryChainItem(item)) {
    return item.query
  } else {
    const prompt = chainItemCache.itemForID(item.promptID) as ActivePrompt | undefined
    if (prompt) {
      const promptVersion = prompt.versions.find(version => version.id === item.versionID)
      if (promptVersion) {
        return getPromptVersionContent(promptVersion, 'main')
      }
    }
    return '…'
  }
}

const getChainItemContent = (item: ChainItemWithInputs, itemCache: ActiveItemCache) => {
  const outputSuffix = item.output ? `→ ${item.output}` : ''
  return `${getChainItemTitle(item, itemCache)}\n${getChainItemBody(item, itemCache)}\n${outputSuffix}\n`
}

const getChainVersionContent = (version: ChainVersion, chainItemCache: ActiveItemCache) =>
  version.items.map(item => getChainItemContent(item, chainItemCache), chainItemCache).join('\n')

const getContent = (
  version: ChainVersion | PromptVersion,
  activePromptTab: PromptTab,
  chainItemCache: ActiveItemCache
) =>
  IsPromptVersion(version)
    ? getPromptVersionContent(version, activePromptTab)
    : getChainVersionContent(version, chainItemCache)

const getDifferentPromptTab = (activePromptTab: PromptTab, leftVersion: PromptVersion, rightVersion: PromptVersion) =>
  ([activePromptTab, 'main', 'functions', 'system', 'settings'] as PromptTab[]).find(
    tab => getPromptVersionContent(leftVersion, tab) !== getPromptVersionContent(rightVersion, tab)
  )

export default function CompareView({ project }: { project: ActiveProject }) {
  const router = useRouter()
  const { i: itemID, v: versionID, p: previousVersionID } = ParseNumberQuery(router.query)

  const [isDiffMode, setDiffMode] = useState(false)
  const [rightItemID, setRightItemID] = useState(itemID)
  const [rightVersionID, setRightVersionID] = useState(versionID)
  const [leftItemID, setLeftItemID] = useState(itemID)
  const [leftVersionID, setLeftVersionID] = useState(previousVersionID)
  const [activePromptTab, setActivePromptTab] = useState('main' as PromptTab)

  const endpointForID = (endpointID: number) => project.endpoints.find(endpoint => endpoint.id === endpointID)

  const itemCache = useActiveItemCache(project, [
    ...(leftItemID && !endpointForID(leftItemID) ? [leftItemID] : []),
    ...(rightItemID && !endpointForID(rightItemID) ? [rightItemID] : []),
  ])

  const leftItem = leftItemID ? endpointForID(leftItemID) ?? itemCache.itemForID(leftItemID) : undefined
  const leftVersion =
    leftItem && !IsEndpoint(leftItem) ? [...leftItem.versions].find(version => version.id === leftVersionID) : undefined

  const rightItem = rightItemID ? endpointForID(rightItemID) ?? itemCache.itemForID(rightItemID) : undefined
  const rightVersion =
    rightItem && !IsEndpoint(rightItem)
      ? [...rightItem.versions].find(version => version.id === rightVersionID)
      : undefined

  const getChainPromptIDs = (version: PromptVersion | ChainVersion | undefined) =>
    version && !IsPromptVersion(version)
      ? (version.items as ChainItem[]).filter(IsPromptChainItem).map(item => item.promptID)
      : []
  const chainItemCache = useActiveItemCache(project, [
    ...getChainPromptIDs(leftVersion),
    ...getChainPromptIDs(rightVersion),
  ])

  const leftContent = leftVersion ? getContent(leftVersion, activePromptTab, chainItemCache) : undefined
  const rightContent = rightVersion ? getContent(rightVersion, activePromptTab, chainItemCache) : undefined

  const updateRightItemID = (itemID: number) => {
    if (itemID !== rightItemID) {
      setLeftItemID(itemID)
      setRightItemID(itemID)
    }
  }

  const updateRightVersionID = useCallback(
    (versionID: number) => {
      if (versionID !== rightVersionID) {
        if (rightItemID && leftItemID === rightItemID) {
          const rightVersions = itemCache.itemForID(rightItemID)?.versions ?? []
          const rightVersion = [...rightVersions].find(version => version.id === versionID)
          const leftVersionID = rightVersion?.previousID ?? versionID
          const leftVersion = [...rightVersions].find(version => version.id === leftVersionID)
          setTimeout(() => {
            setLeftVersionID(leftVersionID)
            if (
              isDiffMode &&
              leftVersion &&
              IsPromptVersion(leftVersion) &&
              rightVersion &&
              IsPromptVersion(rightVersion)
            ) {
              setActivePromptTab(getDifferentPromptTab(activePromptTab, leftVersion, rightVersion) ?? activePromptTab)
            }
          })
        }
        setRightVersionID(versionID)
      }
    },
    [activePromptTab, isDiffMode, itemCache, leftItemID, rightItemID, rightVersionID]
  )

  useEffect(() => {
    if (leftItem && !IsEndpoint(leftItem) && !leftVersion) {
      setLeftVersionID(leftItem.versions.slice(-1)[0].id)
    }
    if (rightItem && !IsEndpoint(rightItem) && !rightVersion) {
      updateRightVersionID(rightItem.versions.slice(-1)[0].id)
    }
  }, [leftItem, leftVersion, rightItem, rightVersion, updateRightVersionID])

  return ItemsInProject(project).length > 0 ? (
    <>
      <div className='flex flex-col h-full'>
        <div className={isDiffMode ? 'flex' : 'flex h-full'}>
          <ComparePane
            project={project}
            activeItem={leftItem}
            activeVersion={leftVersion}
            setItemID={setLeftItemID}
            setVersionID={setLeftVersionID}
            activePromptTab={activePromptTab}
            setActivePromptTab={setActivePromptTab}
            disabled={!leftItemID}
            includeResponses={!isDiffMode}
          />
          <div className='h-full border-l border-gray-200' />
          <ComparePane
            project={project}
            activeItem={rightItem}
            activeVersion={rightVersion}
            setItemID={updateRightItemID}
            setVersionID={updateRightVersionID}
            activePromptTab={activePromptTab}
            setActivePromptTab={setActivePromptTab}
            includeResponses={!isDiffMode}
          />
        </div>
        {isDiffMode && leftContent && rightContent && (
          <DiffPane leftContent={leftContent} rightContent={rightContent} />
        )}
      </div>
      {leftVersionID && rightVersionID && (
        <SegmentedControl className='absolute z-30 bottom-4 right-4' selected={isDiffMode} callback={setDiffMode}>
          <Segment title='Diff' value={true} />
          <Segment title='Responses' value={false} />
        </SegmentedControl>
      )}
    </>
  ) : (
    <EmptyCompareView />
  )
}

function EmptyCompareView() {
  return (
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 rounded-lg bg-gray-25'>
        <span className='font-medium'>No Prompts or Chains</span>
        <span className='text-sm text-center text-gray-400 w-60'>
          <span>Come back here later to compare existing prompt or chain versions.</span>
        </span>
      </div>
    </div>
  )
}
