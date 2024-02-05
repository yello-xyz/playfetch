import api from '@/src/client/api'
import Button from '../button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { ActiveProject, AvailableIssueTrackerProvider, AvailableProvider, IssueTrackerConfig } from '@/types'
import AppSettings from './appSettings'
import { ReactNode, useState } from 'react'
import { NeedsUpdatesLabel } from '@/src/common/defaults'
import ItemLabels from '@/components/labels/itemLabels'
import { AvailableLabelColorsForItem } from '../labels/labelsPopup'
import LabelsPopupMenuButton from '../labels/labelsPopupMenuButton'

export default function LinearSettings({
  activeProject,
  scopeID,
  provider,
  onRefresh,
}: {
  activeProject?: ActiveProject
  scopeID: number
  provider?: AvailableProvider
  onRefresh: () => void
}) {
  const router = useRouter()
  const availableProvider = useIssueTrackerProvider()

  const defaultConfig: IssueTrackerConfig = { labels: [NeedsUpdatesLabel], syncLabels: true, syncComments: true }

  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined
  const previousEnvironment = activeProject ? scopedProvider?.environment : undefined
  const scopedConfig: IssueTrackerConfig = previousEnvironment ? JSON.parse(previousEnvironment) : defaultConfig

  const [config, setConfig] = useState(scopedConfig)

  return (
    <AppSettings
      provider='linear'
      activeProject={activeProject}
      scopeID={scopeID}
      scopedProvider={scopedProvider}
      availableProvider={availableProvider}
      onRefresh={onRefresh}
      getEnvironment={() => JSON.stringify(config)}
      userConfiguration={() => (
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          {scopedProvider ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
      projectConfiguration={(isConfigured, isUpdating, isProcessing, confirmButton) => (
        <>
          {isConfigured || isUpdating ? (
            <div className='flex flex-col w-full gap-2.5'>
              <ConfigPanes {...{ config, setConfig, activeProject, isUpdating, isProcessing }} />
              <div className='flex gap-2.5 justify-end'>
                {isUpdating && <></>}
                {confirmButton()}
              </div>
            </div>
          ) : (
            confirmButton()
          )}
        </>
      )}
    />
  )
}

const ConfigPanes = ({
  config,
  setConfig,
  activeProject,
  isUpdating,
  isProcessing,
}: {
  config: IssueTrackerConfig
  setConfig: (config: IssueTrackerConfig) => void
  activeProject?: ActiveProject
  isUpdating: boolean
  isProcessing: boolean
}) => {
  const projectLabels = activeProject ? activeProject.availableLabels : []
  const pendingLabels = config.labels.filter(l => !projectLabels.includes(l))
  const availableLabels = [...projectLabels, ...pendingLabels]
  const colors = AvailableLabelColorsForItem({ availableLabels })

  const toggle = (labels: string[], label: string) =>
    labels.includes(label) ? labels.filter(l => l !== label) : [...labels, label]

  const gridConfig = 'w-full grid grid-cols-[210px_minmax(120px,1fr)] items-start gap-1'

  return (
    <div className='flex items-center gap-2'>
      <div className={`px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg ${gridConfig}`}>
        <GridCell className='font-medium'>Create task on adding label:</GridCell>
        <GridCell>
          {isUpdating && !isProcessing ? (
            <LabelsPopupMenuButton
              activeLabels={config.labels}
              availableLabels={availableLabels}
              colors={colors}
              toggleLabel={l => setConfig({ ...config, labels: toggle(config.labels, l) })}
            />
          ) : (
            <ItemLabels labels={config.labels} colors={colors} />
          )}
        </GridCell>
      </div>
    </div>
  )
}

const GridCell = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`${className} flex items-center min-h-[24px]`}>{children}</div>
)
