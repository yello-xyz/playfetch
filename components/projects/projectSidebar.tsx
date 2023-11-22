import { ActiveChain, ActiveProject, ActivePrompt, Chain, Endpoint, Prompt, Workspace } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import chainIcon from '@/public/chain.svg'
import compareIcon from '@/public/compare.svg'
import endpointIcon from '@/public/endpoint.svg'
import settingsIcon from '@/public/settings.svg'
import dotsIcon from '@/public/dots.svg'
import Sidebar, { SidebarButton, SidebarSection } from '../sidebar'
import { Suspense, useState } from 'react'
import IconButton from '../iconButton'
import { ActiveItem, CompareItem, EndpointsItem, SettingsItem } from '@/src/common/activeItem'

import dynamic from 'next/dynamic'
import { useLoggedInUser } from '@/src/client/context/userContext'
const ProjectItemPopupMenu = dynamic(() => import('./projectItemPopupMenu'))

export default function ProjectSidebar({
  activeProject,
  activeItem,
  workspaces,
  onAddPrompt,
  onAddChain,
  onDeleteItem,
  onSelectPrompt,
  onSelectChain,
  onSelectCompare,
  onSelectEndpoints,
  onSelectSettings,
}: {
  activeProject: ActiveProject
  activeItem?: ActiveItem
  workspaces: Workspace[]
  onAddPrompt: () => void
  onAddChain: () => void
  onDeleteItem: (itemID: number) => void
  onSelectPrompt: (promptID: number) => void
  onSelectChain: (chainID: number) => void
  onSelectCompare: () => void
  onSelectEndpoints: () => void
  onSelectSettings: () => void
}) {
  const reference = (item: Prompt | Chain) =>
    activeProject.endpoints.find(endpoint => endpoint.enabled && endpoint.parentID === item.id) ??
    activeProject.chains.find(chain => chain.referencedItemIDs.includes(item.id))

  const actionButtonForProjectItem = (item: Prompt | Chain, activeItem: boolean) => (
    <ProjectItemActionButton
      item={item}
      workspaces={workspaces}
      reference={reference(item)}
      onDelete={() => onDeleteItem(item.id)}
      active={activeItem}
    />
  )

  const addPromptButton = <IconButton className='opacity-50 hover:opacity-100' icon={addIcon} onClick={onAddPrompt} />
  const addChainButton = <IconButton className='opacity-50 hover:opacity-100' icon={addIcon} onClick={onAddChain} />
  const isActiveItem = (item: Prompt | Chain) =>
    activeItem !== CompareItem &&
    activeItem !== EndpointsItem &&
    activeItem !== SettingsItem &&
    activeItem?.id === item.id

  const user = useLoggedInUser()
  const isProjectOwner = activeProject.projectOwners.some(owner => owner.id === user.id)

  return (
    <Sidebar>
      <SidebarSection>
        <SidebarButton
          title='Compare'
          icon={compareIcon}
          active={activeItem === CompareItem}
          onClick={onSelectCompare}
        />
        <SidebarButton
          title='Endpoints'
          icon={endpointIcon}
          active={activeItem === EndpointsItem}
          onClick={onSelectEndpoints}
        />
        {isProjectOwner && (
          <SidebarButton
            title='Settings'
            icon={settingsIcon}
            active={activeItem === SettingsItem}
            onClick={onSelectSettings}
          />
        )}
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
  onDelete,
  active,
}: {
  item: Prompt | Chain
  workspaces: Workspace[]
  reference: Chain | Endpoint | undefined
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
        <Suspense>
          <ProjectItemPopupMenu {...{ item, workspaces, reference, isMenuExpanded, setMenuExpanded, onDelete }} />
        </Suspense>
      </div>
    </div>
  )
}
