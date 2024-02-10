import { ActiveChain, ChainItem, ChainVersion, PromptInputs, Run, TestConfig } from '@/types'
import { useEffect, useRef, useState } from 'react'
import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import TestDataPane from '../testData/testDataPane'
import RunButtons from '../runs/runButtons'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem, IsQueryChainItem, OutputNode } from './chainNode'
import { SingleTabHeader } from '../components/tabsHeader'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import { ChainItemCache } from '../hooks/useChainItemCache'
import { useCheckProviders } from '@/src/client/settings/providerContext'
import { ProviderForModel } from '@/src/common/providerMetadata'
import { SelectAnyInputValue } from '@/src/client/testData/inputRows'
import useInitialState from '@/src/client/hooks/useInitialState'
import api from '@/src/client/api'
import useTestDataActionButtons from '@/src/client/testData/useTestDataActionButtons'

export default function ChainNodeOutput({
  chain,
  activeVersion,
  focusRunID,
  nodes,
  variables,
  staticVariables,
  activeIndex,
  setActiveIndex,
  itemCache,
  saveItems,
  showRunButtons,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  focusRunID?: number
  nodes: ChainNode[]
  variables: string[]
  staticVariables: string[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  itemCache: ChainItemCache
  saveItems: (items: ChainItem[]) => Promise<number>
  showRunButtons: boolean
}) {
  const activeNode = nodes[activeIndex]
  const items = nodes.filter(IsChainItem)
  const [inputValues, setInputValues, persistInputValuesIfNeeded, addInputValues] = useInputValues(
    chain,
    JSON.stringify(activeNode)
  )
  const [testConfig, setTestConfig] = useState<TestConfig>({ rowIndices: [0] })

  const [checkProviderAvailable, checkModelAvailable] = useCheckProviders()
  const areProvidersAvailable = (items: ChainItem[]) =>
    items
      .filter(IsPromptChainItem)
      .map(itemCache.versionForItem)
      .every(version => !!version && checkModelAvailable(version.config.model)) &&
    items
      .filter(IsQueryChainItem)
      .every(item => checkProviderAvailable(item.provider) && checkProviderAvailable(ProviderForModel(item.model)))

  const [runVersion, partialRuns, isRunning, highestRunIndex] = useRunVersion(activeVersion.id)
  const [runningItemIndex, setRunningItemIndex] = useState<number>(-1)
  const runChain = async (
    getVersion: () => Promise<number>,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number
  ) => {
    persistInputValuesIfNeeded()
    if (areProvidersAvailable(items)) {
      if (continuationID === undefined) {
        setActiveIndex(0)
        setRunningItemIndex(-1)
        setActiveRunID(undefined)
      }
      const isFinished = await runVersion(
        getVersion,
        inputs,
        dynamicInputs,
        continuationID,
        testConfig.autoRespond,
        testConfig.maxResponses
      )
      if (isFinished) {
        setActiveIndex(nodes.length - 1)
      }
    }
  }
  const saveAndRun = async (inputs: PromptInputs[], dynamicInputs: PromptInputs[]) =>
    runChain(() => saveItems(items), inputs, dynamicInputs)

  useEffect(() => {
    if (highestRunIndex > runningItemIndex) {
      setActiveIndex(highestRunIndex + 1)
      setRunningItemIndex(highestRunIndex)
    }
  }, [setActiveIndex, highestRunIndex, runningItemIndex])

  const [activeRunID, setActiveRunID] = useInitialState<number | undefined>(
    focusRunID ?? activeVersion.runs.slice(-1)[0]?.id
  )
  const activeRun = activeVersion.runs.find(run => run.id === activeRunID)
  const parentRun = activeVersion.runs.find(
    run => run.id === activeRunID || (activeRun?.continuationID && run.continuationID === activeRun.continuationID)
  )
  const [intermediateRuns, setIntermediateRuns] = useState<Run[]>([])
  const fetchedRunID = useRef<number>()
  const refreshIntermediateRuns = () =>
    activeRun && parentRun
      ? api.getIntermediateRuns(parentRun.id, activeRun.continuationID).then(runs => {
          if (activeRunID === fetchedRunID.current) {
            setIntermediateRuns(runs)
          }
        })
      : Promise.resolve()
  if (activeRun && activeRunID !== fetchedRunID.current) {
    setIntermediateRuns([])
    fetchedRunID.current = activeRunID
    refreshIntermediateRuns()
  }

  const findParentRun = (run: Run) => activeVersion.runs.find(r => !!run.parentRunID && r.id === run.parentRunID)
  const lastSameParentRun = (run: Run) => intermediateRuns.findLast(r => r.parentRunID === run.parentRunID)
  const relevantRuns = [
    ...intermediateRuns
      .filter(
        run =>
          run.id === activeRunID ||
          (!!run.continuationID && run.continuationID === activeRun?.continuationID) ||
          (!!run.parentRunID && run.parentRunID === parentRun?.id)
      )
      .map(run => ({
        ...run,
        continuationID: run.continuationID ?? findParentRun(run)?.continuationID,
        canContinue: !!run.canContinue || (findParentRun(run)?.canContinue && lastSameParentRun(run)?.id === run.id),
      })),
    ...partialRuns,
  ]

  const [testDataActionButtons, importTestDataButton] = useTestDataActionButtons(
    chain,
    variables,
    staticVariables,
    inputValues,
    setInputValues,
    persistInputValuesIfNeeded,
    addInputValues,
    testConfig,
    setTestConfig
  )

  return (
    <>
      <div className='flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden'>
        {activeNode === InputNode ? (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <SingleTabHeader label='Test Data' dropShadow=''>
              {testDataActionButtons()}
            </SingleTabHeader>
            <TestDataPane
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              setInputValues={setInputValues}
              addInputValues={addInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              importButton={importTestDataButton}
            />
          </div>
        ) : (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <RunTimeline
              runs={
                isRunning || activeNode === OutputNode
                  ? [...activeVersion.runs, ...partialRuns]
                  : relevantRuns.filter(run => run.index === activeIndex - 1)
              }
              activeItem={chain}
              focusRunID={activeRunID}
              setFocusRunID={setActiveRunID}
              version={activeVersion}
              runVersion={runChain}
              selectInputValue={SelectAnyInputValue(inputValues, testConfig)}
              isRunning={isRunning}
              onRatingUpdate={run => (run.parentRunID ? refreshIntermediateRuns() : Promise.resolve())}
            />
          </div>
        )}
        {showRunButtons && (
          <div className='flex items-center w-full gap-4 px-4'>
            <RunButtons
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              onShowTestConfig={activeIndex !== 0 ? () => setActiveIndex(0) : undefined}
              disabled={!items.length || !areProvidersAvailable(items) || isRunning}
              callback={saveAndRun}
            />
          </div>
        )}
      </div>
    </>
  )
}
