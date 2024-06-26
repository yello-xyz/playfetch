import {
  ActiveProject,
  PromptVersion,
  ChainVersion,
  Analytics,
  ActivePrompt,
  ActiveChain,
  ChainItemWithInputs,
  AvailableProvider,
  ActiveTable,
} from '@/types'
import { EmptyProjectView } from '@/src/client/projects/emptyProjectView'
import { ActiveItem, CompareItem, EndpointsItem, SettingsItem } from '@/src/common/activeItem'
import { Allotment } from 'allotment'
import PromptView from '@/src/client/prompts/promptView'
import ChainView from '@/src/client/chains/chainView'
import CompareView from '@/src/client/diffs/compareView'
import EndpointsView from '@/src/client/endpoints/endpointsView'
import CommentsPane from '@/src/client/comments/commentsPane'
import SettingsView from '@/src/client/settings/settingsView'
import { OnSavedChain } from '@/src/client/chains/useSaveChain'
import TestDataView from '@/src/client/tables/testDataView'

export default function MainProjectPane({
  activeProject,
  activeItem,
  activePrompt,
  activeChain,
  activeTable,
  activePromptVersion,
  activeChainVersion,
  selectVersion,
  setModifiedVersion,
  addPrompt,
  savePrompt,
  saveChain,
  refreshProject,
  focusRunID,
  analytics,
  refreshAnalytics,
  scopedProviders,
  refreshProviders,
  supportsSourceControl,
  supportsIssueTracker,
  showComments,
  setShowComments,
  selectComment,
  setRefreshCompareItems,
}: {
  activeProject: ActiveProject
  activeItem: ActiveItem | undefined
  activePrompt: ActivePrompt | undefined
  activeChain: ActiveChain | undefined
  activeTable: ActiveTable | undefined
  activePromptVersion: PromptVersion | undefined
  activeChainVersion: ChainVersion | undefined
  selectVersion: (version: PromptVersion | ChainVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  addPrompt: () => Promise<void>
  savePrompt: () => Promise<number>
  saveChain: (items: ChainItemWithInputs[], onSaved?: OnSavedChain) => Promise<number | undefined>
  refreshProject: () => Promise<void>
  focusRunID: number | undefined
  analytics: Analytics | undefined
  refreshAnalytics: (dayRange?: number, cursors?: string[]) => Promise<void>
  scopedProviders: AvailableProvider[]
  refreshProviders: () => void
  supportsSourceControl: boolean
  supportsIssueTracker: boolean
  showComments: boolean
  setShowComments: (show: boolean) => void
  selectComment: (parentID: number, versionID: number, runID?: number) => void
  setRefreshCompareItems: (refresh: () => void) => void
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
            savePrompt={savePrompt}
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
        {activeTable && <TestDataView key={activeTable.id} table={activeTable} />}
        {activeItem === CompareItem && (
          <CompareView logEntries={analytics?.recentLogEntries} setRefreshItems={setRefreshCompareItems} />
        )}
        {activeItem === EndpointsItem && <EndpointsView analytics={analytics} refreshAnalytics={refreshAnalytics} />}
        {activeItem === SettingsItem && (
          <SettingsView
            providers={scopedProviders}
            refreshProviders={refreshProviders}
            activeProject={activeProject}
            refreshProject={refreshProject}
            supportsSourceControl={supportsSourceControl}
            supportsIssueTracker={supportsIssueTracker}
          />
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
