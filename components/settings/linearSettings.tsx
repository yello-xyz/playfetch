import api from '@/src/client/api'
import Button from '../button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { ActiveProject, AvailableIssueTrackerProvider, AvailableProvider } from '@/types'
import AppSettings from './appSettings'
import { ReactNode, useState } from 'react'
import { NeedsUpdatesLabel } from '@/src/common/defaults'
import { ItemLabels } from '../versions/versionLabels'
import LabelPopupMenu, { AvailableLabelColorsForItem } from '../labelPopupMenu'
import IconButton from '../iconButton'
import cancelIcon from '@/public/cancel.svg'

type Config = [string[], string[]]

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

  const defaultConfig: Config = [[NeedsUpdatesLabel], [NeedsUpdatesLabel]]

  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined
  const previousEnvironment = activeProject ? scopedProvider?.environment : undefined
  const scopedConfigs: Config[] = previousEnvironment ? JSON.parse(previousEnvironment) : [defaultConfig]

  const [configs, setConfigs] = useState(scopedConfigs)

  return (
    <AppSettings
      provider='linear'
      activeProject={activeProject}
      scopeID={scopeID}
      scopedProvider={scopedProvider}
      availableProvider={availableProvider}
      supportsReconfigureWithoutReset
      onRefresh={onRefresh}
      getEnvironment={() => JSON.stringify(configs)}
      userConfiguration={() => (
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          {scopedProvider ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
      projectConfiguration={(isConfigured, isUpdating, isProcessing, confirmButton) => (
        <>
          {isConfigured || isUpdating ? (
            <div className='flex flex-col w-full gap-2.5'>
              <ConfigPanes {...{ configs: configs, setConfigs: setConfigs, activeProject, isUpdating, isProcessing }} />
              <div className='flex gap-2.5 justify-end'>
                {isUpdating && (
                  <>
                    <Button
                      type='secondary'
                      disabled={isProcessing}
                      onClick={() => setConfigs([...configs, defaultConfig])}>
                      Add Trigger
                    </Button>
                    <Button type='destructive' disabled={isProcessing} onClick={() => setConfigs(scopedConfigs)}>
                      Revert
                    </Button>
                  </>
                )}
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
  configs,
  setConfigs,
  activeProject,
  isUpdating,
  isProcessing,
}: {
  configs: Config[]
  setConfigs: (configs: Config[]) => void
  activeProject?: ActiveProject
  isUpdating: boolean
  isProcessing: boolean
}) => {
  const labels = activeProject ? activeProject.availableLabels : []
  const colors = activeProject ? AvailableLabelColorsForItem(activeProject) : {}

  const toggle = (labels: string[], label: string) =>
    labels.includes(label) ? labels.filter(l => l !== label) : [...labels, label]

  const gridConfig = 'w-full grid grid-cols-[180px_minmax(120px,1fr)_24px] items-start gap-1'

  return (
    <>
      {configs.map(([triggers, toggles], index) => (
        <div key={index} className='flex items-center gap-2'>
          {isUpdating && (
            <IconButton icon={cancelIcon} onClick={() => setConfigs(configs.filter((_, i) => i !== index))} />
          )}
          <div className={`px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg ${gridConfig}`}>
            <GridCell className='font-medium'>Create task on adding label:</GridCell>
            <GridCell>
              <ItemLabels labels={triggers} colors={colors} />
            </GridCell>
            <GridCell>
              {isUpdating && !isProcessing && (
                <LabelPopupMenu
                  activeLabels={triggers}
                  availableLabels={labels}
                  colors={colors}
                  toggleLabel={l =>
                    setConfigs(configs.map(([t, _], i) => (i === index ? [toggle(t, l), toggles] : [t, toggles])))
                  }
                />
              )}
            </GridCell>
            <GridCell className='font-medium'>Toggle labels on closing task:</GridCell>
            <GridCell>
              <ItemLabels labels={toggles} colors={colors} />
            </GridCell>
            <GridCell>
              {isUpdating && !isProcessing && (
                <LabelPopupMenu
                  activeLabels={toggles}
                  availableLabels={labels}
                  colors={colors}
                  toggleLabel={l =>
                    setConfigs(configs.map(([_, t], i) => (i === index ? [triggers, toggle(t, l)] : [triggers, t])))
                  }
                />
              )}
            </GridCell>
          </div>
        </div>
      ))}
    </>
  )
}

const GridCell = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`${className} flex items-center min-h-[24px]`}>{children}</div>
)
