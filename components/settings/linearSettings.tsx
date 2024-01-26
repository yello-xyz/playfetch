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

  const defaultLabels: [string[], string[]] = [[NeedsUpdatesLabel], [NeedsUpdatesLabel]]
  const availableLabels = activeProject ? activeProject.availableLabels : []
  const labelColors = activeProject ? AvailableLabelColorsForItem(activeProject) : {}

  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined
  const previousEnvironment = scopedProvider?.environment
  const scopedLabels: (typeof defaultLabels)[] = previousEnvironment ? JSON.parse(previousEnvironment) : [defaultLabels]

  const [labels, setLabels] = useState(scopedLabels)
  const toggle = (labels: string[], label: string) =>
    labels.includes(label) ? labels.filter(l => l !== label) : [...labels, label]

  const gridConfig = 'w-full grid grid-cols-[180px_minmax(120px,1fr)_24px] items-start gap-1'

  return (
    <AppSettings
      provider='linear'
      activeProject={activeProject}
      scopeID={scopeID}
      scopedProvider={scopedProvider}
      availableProvider={availableProvider}
      onRefresh={onRefresh}
      getEnvironment={() => JSON.stringify(labels)}
      userConfiguration={() => (
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          {scopedProvider ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
      projectConfiguration={(isConfigured, isUpdating, isProcessing, confirmButton) => (
        <>
          {isConfigured &&
            labels.map(([triggers, toggles], index) => (
              <div className='flex flex-col gap-1' key={index}>
                <span>Create task on adding label: {triggers.join(', ')}</span>
                <span>Toggle labels on closing task: {toggles.join(', ')}</span>
              </div>
            ))}
          {isUpdating ? (
            <div className='flex flex-col w-full gap-2.5'>
              {labels.map(([triggers, toggles], index) => (
                <div className='flex items-center gap-2'>
                  <IconButton icon={cancelIcon} onClick={() => setLabels(labels.filter((_, i) => i !== index))} />
                  <div className={`px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg ${gridConfig}`} key={index}>
                    <GridCell className='font-medium'>Create task on adding label:</GridCell>
                    <GridCell>
                      <ItemLabels labels={triggers} colors={labelColors} />
                    </GridCell>
                    <GridCell>
                      {!isProcessing && (
                        <LabelPopupMenu
                          activeLabels={triggers}
                          availableLabels={availableLabels}
                          labelColors={labelColors}
                          toggleLabel={l =>
                            setLabels(labels.map(([t, _], i) => (i === index ? [toggle(t, l), toggles] : [t, toggles])))
                          }
                        />
                      )}
                    </GridCell>
                    <GridCell className='font-medium'>Toggle labels on closing task:</GridCell>
                    <GridCell>
                      <ItemLabels labels={toggles} colors={labelColors} />
                    </GridCell>
                    <GridCell>
                      {!isProcessing && (
                        <LabelPopupMenu
                          activeLabels={toggles}
                          availableLabels={availableLabels}
                          labelColors={labelColors}
                          toggleLabel={l =>
                            setLabels(
                              labels.map(([_, t], i) => (i === index ? [triggers, toggle(t, l)] : [triggers, t]))
                            )
                          }
                        />
                      )}
                    </GridCell>
                  </div>
                </div>
              ))}
              <div className='flex gap-2.5 justify-end'>
                <Button type='secondary' disabled={isProcessing} onClick={() => setLabels([...labels, defaultLabels])}>
                  Add Trigger
                </Button>
                <Button type='destructive' disabled={isProcessing} onClick={() => setLabels(scopedLabels)}>
                  Revert
                </Button>
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

const GridCell = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`${className} flex items-center min-h-[24px]`}>{children}</div>
)
