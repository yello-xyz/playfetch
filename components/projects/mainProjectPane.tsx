import {
  ActiveProject,
  PromptVersion,
  ChainVersion,
  Analytics,
  ActivePrompt,
  ActiveChain,
  ChainItemWithInputs,
  AvailableProvider,
} from '@/types'
import { EmptyProjectView } from '@/components/projects/emptyProjectView'
import { ActiveItem, CompareItem, EndpointsItem, SettingsItem } from '@/src/common/activeItem'
import { Allotment } from 'allotment'
import PromptView from '../prompts/promptView'
import ChainView from '../chains/chainView'
import CompareView from '../compare/compareView'
import EndpointsView from '../endpoints/endpointsView'
import CommentsPane from '../commentsPane'
import SettingsView from '../settings/settingsView'

export default function MainProjectPane({
  activeItem,
  activePrompt,
  activeChain,
  activePromptVersion,
  activeChainVersion,
  selectVersion,
  setModifiedVersion,
  addPrompt,
  savePrompt,
  saveChain,
  refreshOnSavePrompt,
  focusRunID,
  analytics,
  refreshAnalytics,
  scopedProviders,
  refreshProviders,
  showComments,
  setShowComments,
  selectComment,
}: {
  activeItem: ActiveItem | undefined
  activePrompt: ActivePrompt | undefined
  activeChain: ActiveChain | undefined
  activePromptVersion: PromptVersion | undefined
  activeChainVersion: ChainVersion | undefined
  selectVersion: (version: PromptVersion | ChainVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  addPrompt: () => Promise<void>
  savePrompt: (onSaved?: (versionID: number) => Promise<void> | void) => Promise<number | undefined>
  saveChain: (
    items: ChainItemWithInputs[],
    onSaved?: ((versionID: number) => Promise<void>) | (() => void)
  ) => Promise<number | undefined>
  refreshOnSavePrompt: (promptID: number) => (versionID?: number) => void
  focusRunID: number | undefined
  analytics: Analytics | undefined
  refreshAnalytics: (dayRange?: number) => Promise<void>
  scopedProviders: AvailableProvider[]
  refreshProviders: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  selectComment: (parentID: number, versionID: number, runID?: number) => void
}) {
  return (
    <Allotment>
      <Allotment.Pane>
        {activePrompt && activePromptVersion && (
          <PromptView
            prompt={activePrompt}
            activeVersion={activePromptVersion}
            setActiveVersion={selectVersion}
            setModifiedVersion={setModifiedVersion}
            savePrompt={() => savePrompt(refreshOnSavePrompt(activePrompt.id)).then(versionID => versionID!)}
            focusRunID={focusRunID}
          />
        )}
        {activeChain && activeChainVersion && (
          <ChainView
            key={activeChain.id}
            chain={activeChain}
            activeVersion={activeChainVersion}
            setActiveVersion={selectVersion}
            saveChain={saveChain}
            focusRunID={focusRunID}
          />
        )}
        {activeItem === CompareItem && <CompareView logEntries={analytics?.recentLogEntries} />}
        {activeItem === EndpointsItem && <EndpointsView analytics={analytics} refreshAnalytics={refreshAnalytics} />}
        {activeItem === SettingsItem && (
          <SettingsView scope='project' providers={scopedProviders} refresh={refreshProviders} />
        )}
        {!activeItem && <EmptyProjectView onAddPrompt={addPrompt} />}
      </Allotment.Pane>
      <Allotment.Pane minSize={showComments ? 300 : 0} preferredSize={300} visible={showComments}>
        <CommentsPane
          activeItem={activePrompt ?? activeChain}
          onSelectComment={selectComment}
          showComments={showComments}
          setShowComments={setShowComments}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
