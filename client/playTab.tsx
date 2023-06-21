import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { Suspense, useState } from 'react'
import { Project, ActivePrompt, Version, PromptInputs, PromptConfig } from '@/types'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
import RunTimeline from './runTimeline'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export default function PlayTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setDirtyVersion,
  onSavePrompt,
  onPromptDeleted,
  onRefreshPrompt,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setDirtyVersion: (version?: Version) => void
  onSavePrompt: (onSaved?: (versionID: number) => void) => Promise<number>
  onPromptDeleted: (projectID: number | null) => void
  onRefreshPrompt: (focusVersionID?: number) => void
}) {
  const [filter, setFilter] = useState('')
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      onSavePrompt(_ => onRefreshPrompt())
      setActiveVersion(version)
    }
  }

  const runPrompt = async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs) => {
    const versionID = await onSavePrompt(versionID => onRefreshPrompt(versionID))
    await api.runPrompt(prompt.id, versionID, currentPrompt, config, inputs).then(_ => onRefreshPrompt(versionID))
  }

  const deleteVersion = async (version: Version) => {
    setDialogPrompt({
      message: `Are you sure you want to delete this version? This action cannot be undone.`,
      callback: async () => {
        await api.deleteVersion(version.id)
        if (prompt.versions.length > 1) {
          onRefreshPrompt()
        } else {
          onPromptDeleted(prompt.projectID)
        }
      },
      destructive: true,
    })
  }

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col flex-grow gap-4 p-6 pr-4 overflow-y-auto max-w-prose'>
          <LabeledTextInput placeholder='Filter' value={filter} setValue={setFilter} />
          <VersionTimeline
            versions={prompt.versions.filter(versionFilter(filter))}
            activeVersion={activeVersion}
            setActiveVersion={selectActiveVersion}
            onDelete={deleteVersion}
          />
          <Suspense>
            <PromptPanel
              key={activeVersion.id}
              version={activeVersion}
              setDirtyVersion={setDirtyVersion}
              onRun={runPrompt}
            />
          </Suspense>
        </div>
        <div className='flex-1 p-6 pl-2'>
          <RunTimeline runs={activeVersion.runs} />
        </div>
        <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
      </div>
    </>
  )
}
