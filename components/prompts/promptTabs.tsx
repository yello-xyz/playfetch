import { ActivePrompt, PromptVersion, Prompts } from '@/types'

import { ReactNode, useState } from 'react'
import TabSelector, { SingleTabHeader } from '../tabSelector'
import PromptPanel from './promptPanel'
import VersionTimeline from '../versions/versionTimeline'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Allotment } from 'allotment'

type Tab = 'New Prompt' | 'Version History'
type Target = Tab | 'left' | 'right' | 'mergedTabs'

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
    <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} draggableTabs dropTarget='mergedTabs'>
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

  const onDrag = (tab: Tab) => {
    setTabs([...tabs.filter(t => t !== tab)])
  }

  const onDrop = (tab: Tab, target: Target | undefined) => {
    switch (target) {
      case undefined:
        setTabs([...tabs, tab])
        return
      case 'left':
        setTabs([tab, ...tabs])
        setTabsMerged(false)
        return
      case 'right':
        setTabs([...tabs, tab])
        setTabsMerged(false)
        return
      default:
        setTabs([...tabs, tab])
        setTabsMerged(true)
        return
    }
  }

  const minWidth = 200
  return (
    <div className='flex flex-col flex-1 w-full h-full min-h-0'>
      <DragAndDropContext onDrag={onDrag} onDrop={onDrop}>
        {areTabsMerged ? (
          renderTab(activeTab, tabSelector)
        ) : (
          <Allotment className='flex-1 bg-gray-25'>
            {tabs.map(tab => (
              <Allotment.Pane key={tab} minSize={minWidth} preferredSize='50%'>
                {renderTab(tab, children => (
                  <DropHeader tab={tab}>{children}</DropHeader>
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
  onDrag,
  onDrop,
}: {
  children: ReactNode
  onDrag: (tab: Tab) => void
  onDrop: (tab: Tab, target: Target | undefined) => void
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [draggingTab, setDraggingTab] = useState<Tab>()

  const onDragStart = (event: DragStartEvent) => {
    const tab = event.active.id as Tab
    setDraggingTab(tab)
    onDrag(tab)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setDraggingTab(undefined)
    onDrop(event.active.id as Tab, event.over?.id as Target | undefined)
  }

  return (
    <DndContext id='prompt-tabs' sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className='flex items-stretch h-full'>
        {draggingTab && <DropZone target='left' />}
        {children}
        {draggingTab && <DropZone target='right' />}
      </div>
      <DraggingTab tab={draggingTab} />
    </DndContext>
  )
}

const DropHeader = ({ tab, children }: { tab: Tab; children: ReactNode }) => {
  return (
    <SingleTabHeader label={tab} draggableTab dropTarget={tab}>
      {children}
    </SingleTabHeader>
  )
}

const DropZone = ({ target }: { target: Target }) => {
  const { isOver, setNodeRef } = useDroppable({ id: target })
  return (
    <div className={isOver ? 'w-[50%] bg-gray-50 border-x border-gray-200' : 'bg-gray-200 w-px'} ref={setNodeRef} />
  )
}

const DraggingTab = ({ tab }: { tab?: Tab }) => (
  <DragOverlay dropAnimation={null}>
    {tab ? (
      <div className='px-4 py-2 bg-white border border-gray-200 cursor-pointer min-w-fit whitespace-nowrap'>{tab}</div>
    ) : null}
  </DragOverlay>
)
