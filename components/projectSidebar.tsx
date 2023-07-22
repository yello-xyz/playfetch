import { ActiveChain, ActiveProject, ActivePrompt, Chain, Prompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import chainIcon from '@/public/chain.svg'
import endpointIcon from '@/public/endpoint.svg'
import dotsIcon from '@/public/dots.svg'
import Sidebar, { SidebarButton, SidebarSection } from './sidebar'
import ProjectItemPopupMenu from './projectItemPopupMenu'
import { useState } from 'react'
import IconButton from './iconButton'

export default function ProjectSidebar({
  activeProject,
  activeItem,
  onAddPrompt,
  onAddChain,
  onDeleteItem,
  onRefreshItem,
  onSelectPrompt,
  onSelectChain,
  onSelectEndpoints,
}: {
  activeProject: ActiveProject
  activeItem?: ActivePrompt | ActiveChain | 'endpoints'
  onAddPrompt: () => void
  onAddChain: () => void
  onDeleteItem: () => void
  onRefreshItem: () => void
  onSelectPrompt: (promptID: number) => void
  onSelectChain: (chainID: number) => void
  onSelectEndpoints: () => void
}) {
  const actionButtonForProjectItem = (item: Prompt | Chain) => (
    <ProjectItemActionButton item={item} onRefresh={onRefreshItem} onDelete={onDeleteItem} />
  )

  const addPromptButton = <IconButton className='opacity-50' icon={addIcon} onClick={onAddPrompt} />
  const addChainButton = <IconButton className='opacity-50' icon={addIcon} onClick={onAddChain} />

  return (
    <Sidebar>
      <SidebarSection>
        <SidebarButton
          title='Endpoints'
          icon={endpointIcon}
          active={activeItem === 'endpoints'}
          onClick={onSelectEndpoints}
        />
      </SidebarSection>
      <SidebarSection title='Prompts' actionComponent={addPromptButton}>
        {activeProject.prompts.map((prompt, promptIndex) => (
          <SidebarButton
            key={promptIndex}
            title={prompt.name}
            icon={promptIcon}
            active={activeItem !== 'endpoints' && activeItem?.id === prompt.id}
            onClick={() => onSelectPrompt(prompt.id)}
            actionComponent={actionButtonForProjectItem(prompt)}
          />
        ))}
      </SidebarSection>
      <SidebarSection title='Chains' className='flex-1' actionComponent={addChainButton}>
        {activeProject.chains.map((chain, chainIndex) => (
          <SidebarButton
            key={chainIndex}
            title={chain.name}
            icon={chainIcon}
            active={activeItem !== 'endpoints' && activeItem?.id === chain.id}
            onClick={() => onSelectChain(chain.id)}
            actionComponent={actionButtonForProjectItem(chain)}
          />
        ))}
      </SidebarSection>
    </Sidebar>
  )
}

function ProjectItemActionButton({
  item,
  onRefresh,
  onDelete,
}: {
  item: Prompt | Chain
  onRefresh: () => void
  onDelete: () => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  return (
    <div className='relative'>
      <IconButton icon={dotsIcon} onClick={() => setMenuExpanded(!isMenuExpanded)}/>
      <div className='absolute -right-1 top-8'>
        <ProjectItemPopupMenu
          item={item}
          isMenuExpanded={isMenuExpanded}
          setMenuExpanded={setMenuExpanded}
          onRefresh={onRefresh}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
