import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { Suspense, useState } from 'react'
import { Project, ActivePrompt, Run, Version, PromptInputs, PromptConfig } from '@/types'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
import PlayTab from './playTab'
import PublishPane from './publishPane'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export type ActivePromptTab = 'play' | 'test' | 'publish'

export default function PromptTabView({
  activeTab,
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setDirtyVersion,
  onSavePrompt,
  onPromptDeleted,
  onRefreshPrompt,
}: {
  activeTab: ActivePromptTab
  prompt: ActivePrompt
  project?: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setDirtyVersion: (version?: Version) => void
  onSavePrompt: (onSaved?: (versionID: number) => void) => Promise<number>
  onPromptDeleted: (projectID: number | null) => void
  onRefreshPrompt: (focusVersionID?: number) => void
}) {
  const [filter, setFilter] = useState('')
  const [curlCommand, setCURLCommand] = useState<string>()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      onSavePrompt(_ => onRefreshPrompt())
      setActiveVersion(version)
      setCURLCommand(undefined)
    }
  }

  const savePromptAndRefocus = () => onSavePrompt(versionID => onRefreshPrompt(versionID))

  const runPrompt = async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs) => {
    const versionID = await savePromptAndRefocus()
    await api.runPrompt(prompt.id, versionID, currentPrompt, config, inputs).then(_ => onRefreshPrompt(versionID))
  }

  const publishPrompt = async (
    endpoint: string,
    currentPrompt: string,
    config: PromptConfig,
    inputs: PromptInputs,
    useCache: boolean
  ) => {
    await savePromptAndRefocus()
    await api
      .publishPrompt(project!.id, prompt.id, endpoint, currentPrompt, config, inputs, useCache)
      .then(setCURLCommand)
    onRefreshPrompt()
  }

  const unpublishPrompt = async () => {
    setCURLCommand(undefined)
    await api.unpublishPrompt(prompt.id)
    onRefreshPrompt()
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

  switch (activeTab) {
    case 'play':
      return (
        <PlayTab
          prompt={prompt}
          project={project}
          activeVersion={activeVersion}
          setActiveVersion={setActiveVersion}
          setDirtyVersion={setDirtyVersion}
          onSavePrompt={onSavePrompt}
          onPromptDeleted={onPromptDeleted}
          onRefreshPrompt={onRefreshPrompt}
        />
      )
    default:
      return (
        <div className='flex items-stretch'>
          <div className='flex flex-col flex-1 h-screen gap-4 p-8 overflow-y-auto max-w-prose'>
            <LabeledTextInput placeholder='Filter' value={filter} setValue={setFilter} />
            <VersionTimeline
              versions={prompt.versions.filter(versionFilter(filter))}
              activeVersion={activeVersion}
              setActiveVersion={selectActiveVersion}
              onDelete={deleteVersion}
            />
          </div>
          <div>
            <Suspense>
              <PromptPanel
                key={activeVersion.id}
                version={activeVersion}
                setDirtyVersion={setDirtyVersion}
                onRun={runPrompt}
              />
            </Suspense>
            {project && (
              <PublishPane
                key={activeVersion.id}
                version={activeVersion}
                endpoint={prompt?.endpoint}
                endpointNameValidator={(name: string) => api.checkEndpointName(prompt.id, project!.urlPath, name)}
                onPublish={publishPrompt}
                onUnpublish={unpublishPrompt}
              />
            )}
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
}
