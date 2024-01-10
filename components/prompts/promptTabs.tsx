import { ActivePrompt, PromptVersion, Prompts } from '@/types'

import { ReactNode, useState } from 'react'
import TabSelector from '../tabSelector'
import PromptPanel from './promptPanel'
import VersionTimeline from '../versions/versionTimeline'

export default function PromptTabs({
  prompt,
  activeVersion,
  setActiveVersion,
  currentVersion,
  updatePrompt,
  updateConfig,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  currentVersion: PromptVersion
  updatePrompt: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig: (config: PromptVersion['config']) => void
}) {
  type ActiveTab = 'New Prompt' | 'Version History'
  const [activeTab, setActiveTab] = useState<ActiveTab>('New Prompt')

  const tabs: ActiveTab[] = ['New Prompt', 'Version History']

  const tabSelector = (children?: ReactNode) => (
    <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {children}
    </TabSelector>
  )

  const renderTab = (tab: ActiveTab, tabSelector: (children?: ReactNode) => ReactNode) => {
    switch (tab) {
      case 'New Prompt':
        return (
          <>
            {tabSelector()}
            <PromptPanel version={currentVersion} updatePrompt={updatePrompt} updateConfig={updateConfig} />
          </>
        )
      case 'Version History':
        return (
          <div className='flex-1 min-h-0'>
            <VersionTimeline
              activeItem={prompt}
              versions={prompt.versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              tabSelector={tabSelector}
            />
          </div>
        )
    }
  }
  return <div className='flex flex-col flex-1 w-full h-full min-h-0'>{renderTab(activeTab, tabSelector)}</div>
}
