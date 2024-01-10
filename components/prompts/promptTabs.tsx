import { ActivePrompt, PromptVersion, Prompts } from '@/types'

import { ReactNode, useState } from 'react'
import TabSelector, { SingleTabHeader } from '../tabSelector'
import PromptPanel from './promptPanel'
import VersionTimeline from '../versions/versionTimeline'
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Allotment } from 'allotment'

type Tab = 'New Prompt' | 'Version History'
type Target = 'left' | 'right'

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
  const [areTabsMerged, setTabsMerged] = useState(true)
  const [tabs, setTabs] = useState<Tab[]>(['New Prompt', 'Version History'])
  const [activeTab, setActiveTab] = useState<Tab>('New Prompt')

  const tabSelector = (children?: ReactNode) => (
    <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} draggableTabs>
      {children}
    </TabSelector>
  )

  const renderTab = (tab: Tab, tabSelector: (children?: ReactNode) => ReactNode) => {
    switch (tab) {
      case 'New Prompt':
        return (
          <div className='flex flex-col flex-1 h-full'>
            {tabSelector()}
            <PromptPanel version={currentVersion} updatePrompt={updatePrompt} updateConfig={updateConfig} />
          </div>
        )
      case 'Version History':
        return (
          <div className='flex-1 h-full min-h-0'>
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

  const minWidth = 280
  return (
    <div className='flex flex-col flex-1 w-full h-full min-h-0'>
      <DragAndDropContext onDrop={(tab, target) => setTabsMerged(false)}>
        {areTabsMerged ? (
          renderTab(activeTab, tabSelector)
        ) : (
          <Allotment className='flex-1 bg-gray-25'>
            {tabs.map(tab => (
              <Allotment.Pane key={tab} minSize={minWidth} preferredSize='50%'>
                {renderTab(tab, children => (
                  <SingleTabHeader label={tab}>{children}</SingleTabHeader>
                ))}
              </Allotment.Pane>
            ))}
          </Allotment>
        )}
      </DragAndDropContext>
    </div>
  )
}

const DragAndDropContext = ({
  children,
  onDrop,
}: {
  children: ReactNode
  onDrop: (tab: Tab, target: Target) => void
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [draggingTab, setDraggingTab] = useState<Tab>()

  return (
    <DndContext
      id='prompt-tabs'
      sensors={sensors}
      onDragStart={event => setDraggingTab(event.active.id as Tab)}
      onDragEnd={event => event.over && onDrop(event.active.id as Tab, event.over.id as Target)}>
      <div className='flex items-stretch h-full'>
        {draggingTab && <DropZone target='left' />}
        {children}
        {draggingTab && <DropZone target='right' />}
      </div>
      <DraggingTab tab={draggingTab} />
    </DndContext>
  )
}

const DropZone = ({ target }: { target: Target }) => {
  const { isOver, setNodeRef } = useDroppable({ id: target })
  return (
    <div className={isOver ? 'w-[50%] bg-gray-50 border-x border-gray-200' : 'bg-gray-200 w-px'} ref={setNodeRef} />
  )
}

const DraggingTab = ({ tab }: { tab?: Tab }) => (
  <DragOverlay>
    {tab ? (
      <div className='px-4 py-2 -mr-4 bg-white border border-gray-200 cursor-pointer whitespace-nowrap'>{tab}</div>
    ) : null}
  </DragOverlay>
)
