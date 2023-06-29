import api from '@/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project } from '@/types'
import chevronIcon from '@/public/chevron.svg'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import Label from './label'
import { ExtractPromptVariables } from '@/common/formatting'
import { PendingButton } from './button'
import RunTimeline from './runTimeline'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import TestDataPane from './testDataPane'
import DropdownMenu from './dropdownMenu'
import useModalDialogPrompt from './modalDialogContext'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

export const useRunPrompt = (promptID: number) => {
  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

  return async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt(promptID, versionID, currentPrompt, config, inputs).then(_ => refreshPrompt(versionID))
  }
}

type TestMode = 'first' | 'last' | 'random' | 'all'

const selectInputs = (inputs: { [key: string]: string[] }, mode: TestMode): { [key: string]: string }[] => {
  const selectInput = (inputs: string[], mode: TestMode): string => {
    switch (mode) {
      default:
      case 'first':
        return inputs[0] ?? ''
      case 'last':
        return inputs[inputs.length - 1] ?? ''
      case 'random':
        return inputs[Math.floor(Math.random() * inputs.length)] ?? ''
    }
  }

  const cartesian = (array: string[][]) =>
    array.reduce(
      (a, b) => {
        return a
          .map(x => {
            return b.map(y => {
              return x.concat(y)
            })
          })
          .reduce((c, d) => c.concat(d), [])
      },
      [[]] as string[][]
    )

  const entries = Object.entries(inputs)

  switch (mode) {
    default:
    case 'first':
    case 'last':
    case 'random':
      return [Object.fromEntries(entries.map(([key, values]) => [key, selectInput(values, mode)]))]
    case 'all':
      const keys = entries.map(([key, _]) => key)
      const values = cartesian(entries.map(([_, values]) => values))
      return values.map(value => Object.fromEntries(keys.map((key, i) => [key, value[i]])))
  }
}

export default function TestTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const [testMode, setTestMode] = useState<TestMode>('first')
  const [version, setVersion] = useState(activeVersion)
  const updateVersion = (version: Version) => {
    setVersion(version)
    setModifiedVersion(version)
  }
  const selectVersion = (version: Version) => {
    persistValuesIfNeeded()
    setVersion(version)
    setActiveVersion(version)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const runPrompt = useRunPrompt(prompt.id)

  const originalInputs = Object.fromEntries(prompt.inputs.map(input => [input.name, input.values]))
  const variables = ExtractPromptVariables(version.prompt)
  const [inputValues, setInputValues] = useState<{ [key: string]: string[] }>(originalInputs)
  const allInputs = Object.fromEntries(variables.map(variable => [variable, inputValues[variable] ?? []]))
  const [activeColumn, setActiveColumn] = useState(0)
  if (activeColumn > 0 && activeColumn >= variables.length) {
    setActiveColumn(0)
  }
  const activeVariable = variables[activeColumn] || null
  const activeInputs = activeVariable ? inputValues[activeVariable] ?? [] : []

  const persistValuesIfNeeded = () => {
    if (activeVariable && activeInputs.join(',') !== (originalInputs[activeVariable] ?? []).join(',')) {
      api.updateInputValues(prompt.projectID, activeVariable, activeInputs)
    }
  }

  const testPrompt = async () => {
    persistValuesIfNeeded()
    const inputs = selectInputs(allInputs, testMode)
    if (inputs.length > 1) {
      setDialogPrompt({
        title: `Run ${inputs.length} times?`,
        confirmTitle: 'Run',
        callback: async () => runPrompt(version.prompt, version.config, inputs),
      })
    } else {
      await runPrompt(version.prompt, version.config, inputs)
    }
  }

  const selectColumn = (index: number) => {
    persistValuesIfNeeded()
    setActiveColumn(index)
  }

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
          <div className='flex flex-col flex-grow gap-2'>
            <Label>Test Data</Label>
            <TestDataPane
              variables={variables}
              inputValues={inputValues}
              setInputValues={setInputValues}
              activeColumn={activeColumn}
              setActiveColumn={selectColumn}
            />
          </div>
          <VersionSelector versions={prompt.versions} activeVersion={version} setActiveVersion={selectVersion} />
          <Suspense>
            <PromptPanel
              key={activeVersion.prompt}
              version={version}
              setModifiedVersion={updateVersion}
              showInputControls
            />
          </Suspense>
          <div className='flex items-center self-end gap-4'>
            <DropdownMenu
              disabled={!variables.length}
              size='medium'
              value={testMode}
              onChange={value => setTestMode(value as TestMode)}>
              <option value={'first'}>First</option>
              <option value={'last'}>Last</option>
              <option value={'random'}>Random</option>
              <option value={'all'}>All</option>
            </DropdownMenu>
            <PendingButton disabled={!version.prompt.length} onClick={testPrompt}>
              Run
            </PendingButton>
          </div>
        </div>
        <div className='flex-1 p-6 pl-0'>
          <RunTimeline runs={activeVersion.runs} />
        </div>
      </div>
    </>
  )
}

function VersionSelector({
  versions,
  activeVersion,
  setActiveVersion,
}: {
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const ascendingVersions = versions.slice().reverse()
  const index = ascendingVersions.findIndex(version => version.id === activeVersion.id)
  const selectVersion = (version: Version) => {
    setIsMenuExpanded(false)
    setActiveVersion(version)
  }

  return (
    <div className='relative flex items-end'>
      <div className='flex items-center cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
        <Label className='cursor-pointer'>{`Prompt ${index + 1}`}</Label>
        <img className='w-6 h-6' src={chevronIcon.src} />
      </div>
      <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        {ascendingVersions.map((version, index) => (
          <PopupMenuItem key={index} title={`Prompt ${index + 1}`} callback={() => selectVersion(version)} />
        ))}
      </PopupMenu>
    </div>
  )
}
