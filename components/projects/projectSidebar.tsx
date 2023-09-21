import { ActiveProject, Chain, Endpoint, Prompt, Workspace } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import chainIcon from '@/public/chain.svg'
import compareIcon from '@/public/compare.svg'
import endpointIcon from '@/public/endpoint.svg'
import dotsIcon from '@/public/dots.svg'
import Sidebar, { SidebarButton, SidebarSection } from '../sidebar'
import ProjectItemPopupMenu from './projectItemPopupMenu'
import { useState } from 'react'
import IconButton from '../iconButton'

const Compare = 'compare'
const Endpoints = 'endpoints'
type ActiveItem = Prompt | Chain | typeof Compare | typeof Endpoints

export default function ProjectSidebar({
  activeProject,
  activeItem,
  workspaces,
  onAddPrompt,
  onAddChain,
  onDeleteItem,
  onRefreshItem,
  onSelectPrompt,
  onSelectChain,
  onSelectCompare,
  onSelectEndpoints,
}: {
  activeProject: ActiveProject
  activeItem?: ActiveItem
  workspaces: Workspace[]
  onAddPrompt: () => void
  onAddChain: () => void
  onDeleteItem: (itemID: number) => void
  onRefreshItem: () => void
  onSelectPrompt: (promptID: number) => void
  onSelectChain: (chainID: number) => void
  onSelectCompare: () => void
  onSelectEndpoints: () => void
}) {
  const reference = (item: Prompt | Chain) =>
    activeProject.endpoints.find(endpoint => endpoint.enabled && endpoint.parentID === item.id) ??
    activeProject.chains.find(chain => chain.referencedItemIDs.includes(item.id))

  const actionButtonForProjectItem = (item: Prompt | Chain, activeItem: boolean) => (
    <ProjectItemActionButton
      item={item}
      workspaces={workspaces}
      reference={reference(item)}
      onRefresh={onRefreshItem}
      onDelete={() => onDeleteItem(item.id)}
      active={activeItem}
    />
  )

  const addPromptButton = <IconButton className='opacity-50 hover:opacity-100' icon={addIcon} onClick={onAddPrompt} />
  const addChainButton = <IconButton className='opacity-50 hover:opacity-100' icon={addIcon} onClick={onAddChain} />
  const isActiveItem = (item: Prompt | Chain) =>
    activeItem !== Compare && activeItem !== Endpoints && activeItem?.id === item.id

  return (
    <Sidebar>
      <SidebarSection>
        <SidebarButton title='Compare' icon={compareIcon} active={activeItem === Compare} onClick={onSelectCompare} />
        <SidebarButton
          title='Endpoints'
          icon={endpointIcon}
          active={activeItem === Endpoints}
          onClick={onSelectEndpoints}
        />
      </SidebarSection>
      <SidebarSection title='Prompts' actionComponent={addPromptButton}>
        {activeProject.prompts.map((prompt, promptIndex) => (
          <SidebarButton
            key={promptIndex}
            title={prompt.name}
            icon={promptIcon}
            active={isActiveItem(prompt)}
            onClick={() => onSelectPrompt(prompt.id)}
            actionComponent={actionButtonForProjectItem(prompt, isActiveItem(prompt))}
          />
        ))}
      </SidebarSection>
      <SidebarSection title='Chains' className='flex-1' actionComponent={addChainButton}>
        {activeProject.chains.map((chain, chainIndex) => (
          <SidebarButton
            key={chainIndex}
            title={chain.name}
            icon={chainIcon}
            active={isActiveItem(chain)}
            onClick={() => onSelectChain(chain.id)}
            actionComponent={actionButtonForProjectItem(chain, isActiveItem(chain))}
          />
        ))}
      </SidebarSection>
    </Sidebar>
  )
}

function ProjectItemActionButton({
  item,
  workspaces,
  reference,
  onRefresh,
  onDelete,
  active,
}: {
  item: Prompt | Chain
  workspaces: Workspace[]
  reference: Chain | Endpoint | undefined
  onRefresh: () => void
  onDelete: () => void
  active?: boolean
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)
  const iconClass = isMenuExpanded ? '' : 'hidden group-hover:block'

  return (
    <div className='relative pr-0.5'>
      <IconButton
        className={iconClass}
        icon={dotsIcon}
        onClick={() => setMenuExpanded(!isMenuExpanded)}
        hoverType={{ background: active ? '' : '' }}
      />
      <div className='absolute shadow-sm -right-1 top-8'>
        <ProjectItemPopupMenu
          {...{ item, workspaces, reference, isMenuExpanded, setMenuExpanded, onRefresh, onDelete }}
        />
      </div>
    </div>
  )
}
