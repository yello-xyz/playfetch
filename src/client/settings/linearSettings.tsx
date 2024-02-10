import api from '@/src/client/api'
import Button from '../components/button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { ActiveProject, AvailableIssueTrackerProvider, AvailableProvider, IssueTrackerConfig } from '@/types'
import AppSettings from './appSettings'
import { ReactNode, useState } from 'react'
import { NeedsUpdatesLabel } from '@/src/common/defaults'
import ItemLabels from '@/src/client/labels/itemLabels'
import { AvailableLabelColorsForItem } from '../labels/labelsPopup'
import LabelsPopupMenuButton from '../labels/labelsPopupMenuButton'
import Checkbox from '../components/checkbox'

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

  const projectLabels = activeProject ? activeProject.availableLabels : []
  const pendingLabels = config.labels.filter(l => !projectLabels.includes(l))
  const availableLabels = [...projectLabels, ...pendingLabels]
  const colors = AvailableLabelColorsForItem({ availableLabels })

  const toggle = (labels: string[], label: string) =>
    labels.includes(label) ? labels.filter(l => l !== label) : [...labels, label]

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
        <div className='flex items-end gap-2.5 w-full'>
          {(isConfigured || isUpdating) && (
            <div className='w-full grid grid-cols-[150px_minmax(120px,1fr)] items-start gap-1 text-gray-700'>
              <GridCell>Sync Labels</GridCell>
              <GridCell>
                <Checkbox
                  disabled={!isUpdating || isProcessing}
                  checked={config.syncLabels}
                  setChecked={() => setConfig({ ...config, syncLabels: !config.syncLabels })}
                />
              </GridCell>
              <GridCell>Sync Comments</GridCell>
              <GridCell>
                <Checkbox
                  disabled={!isUpdating || isProcessing}
                  checked={config.syncComments}
                  setChecked={() => setConfig({ ...config, syncComments: !config.syncComments })}
                />
              </GridCell>
              <GridCell>Create task in Linear when label is added</GridCell>
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
          )}
          <div className={isConfigured || isUpdating ? 'mb-1' : ''}>{confirmButton()}</div>
        </div>
      )}
    />
  )
}

const GridCell = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`${className} flex items-center min-h-[34px]`}>{children}</div>
)
