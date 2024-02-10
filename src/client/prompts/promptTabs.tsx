import { ActivePrompt, PromptVersion, Prompts } from '@/types'

import { PromptTab } from '@/src/common/userPresets'
import { ReactNode, useState } from 'react'
import TabsHeader, { SingleTabHeader } from '@/src/client/components/tabsHeader'
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

type Target = PromptTab | 'left' | 'right' | 'mergedTabs'

export default function PromptTabs({
  prompt,
  versions,
  activeVersion,
  setActiveVersion,
  currentVersion,
  updatePrompt,
  updateConfig,
  initialTabs,
  persistTabs,
  variables,
}: {
  prompt: ActivePrompt
  versions: PromptVersion[]
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  currentVersion: PromptVersion
  updatePrompt: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig: (config: PromptVersion['config']) => void
  initialTabs: PromptTab[][]
  persistTabs: (tabs: PromptTab[][]) => void
  variables: string[]
}) {
  const [tabs, setTabs] = useState(initialTabs.flat())
  const [areTabsMerged, setTabsMerged] = useState(initialTabs.length === 1)
  const [activeTab, setActiveTab] = useState<PromptTab>('New Prompt')

  const tabSelector = (children?: ReactNode) => (
    <TabsHeader tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} draggableTabs dropTarget='mergedTabs'>
      {children}
    </TabsHeader>
  )

  const renderTab = (tab: PromptTab, tabSelector: (children?: ReactNode) => ReactNode) => {
    switch (tab) {
      case 'New Prompt':
        return (
          <div className='flex flex-col flex-1 h-full'>
            {tabSelector()}
            <PromptPanel
              version={currentVersion}
              updatePrompt={updatePrompt}
              updateConfig={updateConfig}
              variables={variables}
            />
          </div>
        )
      case 'Version History':
        return (
          <div className='flex-1 h-full min-h-0'>
            <VersionTimeline
              activeItem={prompt}
              versions={versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              tabSelector={tabSelector}
            />
          </div>
        )
    }
  }

  const onDrag = (tab: PromptTab) => {
    setTabs([...tabs.filter(t => t !== tab)])
  }

  const updateTabs = (tabs: PromptTab[], merged: boolean) => {
    setTabs(tabs)
    setTabsMerged(merged)
    persistTabs?.(merged ? [tabs] : tabs.map(tab => [tab]))
  }

  const onDrop = (tab: PromptTab, target: Target | undefined) => {
    switch (target) {
      case undefined:
        setTabs([...tabs, tab])
        return
      case 'left':
        updateTabs([tab, ...tabs], false)
        return
      case 'right':
        updateTabs([...tabs, tab], false)
        return
      default:
        updateTabs([...tabs, tab], true)
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
  onDrag: (tab: PromptTab) => void
  onDrop: (tab: PromptTab, target: Target | undefined) => void
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [draggingTab, setDraggingTab] = useState<PromptTab>()

  const onDragStart = (event: DragStartEvent) => {
    const tab = event.active.id as PromptTab
    setDraggingTab(tab)
    onDrag(tab)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setDraggingTab(undefined)
    onDrop(event.active.id as PromptTab, event.over?.id as Target | undefined)
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

const DropHeader = ({ tab, children }: { tab: PromptTab; children: ReactNode }) => {
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

const DraggingTab = ({ tab }: { tab?: PromptTab }) => (
  <DragOverlay dropAnimation={null}>
    {tab ? (
      <div className='px-4 py-2 bg-white border border-gray-200 cursor-pointer min-w-fit whitespace-nowrap'>{tab}</div>
    ) : null}
  </DragOverlay>
)
