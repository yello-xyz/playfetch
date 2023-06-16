import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { Suspense, useState } from 'react'
import { Project, Prompt, PromptWithVersions, Run, RunConfig, Version } from '@/types'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.title.toLowerCase().includes(lowerCaseFilter) ||
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export default function PromptTabView({
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setDirtyVersion,
  onSavePrompt,
  onPromptDeleted,
  onRefreshPrompt,
}: {
  prompt: PromptWithVersions
  project?: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setDirtyVersion: (version?: Version) => void
  onSavePrompt: (onSaved?: (versionID: number) => void) => Promise<number>
  onPromptDeleted: () => void
  onRefreshPrompt: (focusVersionID?: number) => void
}) {
  const [activeRun, setActiveRun] = useState<Run>()

  const [filter, setFilter] = useState('')
  const [curlCommand, setCURLCommand] = useState<string>()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      onSavePrompt(_ => onRefreshPrompt())
      setActiveVersion(version)
      setActiveRun(undefined)
      setCURLCommand(undefined)
    }
  }

  const savePromptAndRefocus = () => onSavePrompt(versionID => onRefreshPrompt(versionID))

  const runPrompt = async (currentPrompt: string, config: RunConfig) => {
    const versionID = await savePromptAndRefocus()
    await api.runPrompt(prompt.id, versionID, currentPrompt, config).then(_ => onRefreshPrompt(versionID))
  }

  const publishPrompt = async (endpoint: string, currentPrompt: string, config: RunConfig) => {
    await savePromptAndRefocus()
    await api.publishPrompt(project!.id, prompt.id, endpoint, currentPrompt, config).then(setCURLCommand)
    onRefreshPrompt()
  }

  const unpublishPrompt = async () => {
    setCURLCommand(undefined)
    await api.unpublishPrompt(prompt.id)
    onRefreshPrompt()
  }

  const isLastVersion = prompt.versions.length === 1
  const entityToDelete = isLastVersion ? 'prompt' : 'version'

  const deleteVersion = async (version: Version) => {
    const versionHasRuns = version.runs.length > 0
    const suffix = versionHasRuns ? ' and all its associated runs' : ''
    setDialogPrompt({
      message: `Are you sure you want to delete this ${entityToDelete}${suffix}? This action cannot be undone.`,
      callback: async () => {
        await api.deleteVersion(version.id)
        if (prompt.versions.length > 1) {
          onRefreshPrompt()
        } else {
          onPromptDeleted()
        }
      },
      destructive: true,
    })
  }

  return (
    <div className='flex items-stretch flex-1 h-screen'>
      <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto max-w-prose'>
        <LabeledTextInput placeholder='Filter' value={filter} setValue={setFilter} />
        <VersionTimeline
          versions={prompt.versions.filter(versionFilter(filter))}
          activeVersion={activeVersion}
          setActiveVersion={selectActiveVersion}
          activeRun={activeRun}
          setActiveRun={setActiveRun}
          onDelete={deleteVersion}
          entityToDelete={entityToDelete}
        />
      </div>
      <div className='flex-1 overflow-y-auto'>
        <Suspense>
          <PromptPanel
            key={activeVersion.id}
            version={activeVersion}
            activeRun={activeRun ?? activeVersion.runs[0]}
            endpoint={prompt?.endpoint}
            setDirtyVersion={setDirtyVersion}
            endpointNameValidator={(name: string) => api.checkEndpointName(prompt.id, project!.urlPath, name)}
            onRun={runPrompt}
            onSave={() => savePromptAndRefocus().then()}
            onPublish={project ? publishPrompt : undefined}
            onUnpublish={unpublishPrompt}
          />
        </Suspense>
        {curlCommand && (
          <div className='flex flex-col gap-4 px-8 text-black whitespace-pre-wrap'>
            Try out your API endpoint by running:
            <pre>{curlCommand}</pre>
          </div>
        )}
      </div>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
    </div>
  )
}
