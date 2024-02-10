import { Chain, Endpoint, Prompt, Table, Workspace } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import chainIcon from '@/public/chain.svg'
import tableIcon from '@/public/table.svg'
import compareIcon from '@/public/compare.svg'
import endpointIcon from '@/public/endpoint.svg'
import settingsIcon from '@/public/settings.svg'
import dotsIcon from '@/public/dots.svg'
import Sidebar, { SidebarButton, SidebarSection } from '../components/sidebar'
import { useState } from 'react'
import IconButton from '../components/iconButton'
import { ActiveItem, CompareItem, EndpointsItem, SettingsItem } from '@/src/common/activeItem'
import { useActiveProject } from '@/src/client/context/projectContext'
import useProjectItemActions from '@/src/client/hooks/useProjectItemActions'
import ProjectItemPopupMenu from './projectItemPopupMenu'

export default function ProjectSidebar({
  activeItem,
  workspaces,
  onAddPrompt,
  onAddChain,
  onAddTable,
  onDeleteItem,
  onSelectPrompt,
  onSelectChain,
  onSelectTable,
  onSelectCompare,
  onSelectEndpoints,
  onSelectSettings,
  rightBorder,
}: {
  activeItem?: ActiveItem
  workspaces: Workspace[]
  onAddPrompt: () => void
  onAddChain: () => void
  onAddTable: () => void
  onDeleteItem: (itemID: number) => void
  onSelectPrompt: (promptID: number) => void
  onSelectChain: (chainID: number) => void
  onSelectTable: (tableID: number) => void
  onSelectCompare: () => void
  onSelectEndpoints: () => void
  onSelectSettings: () => void
  rightBorder: boolean
}) {
  const activeProject = useActiveProject()
  const reference = (item: Prompt | Chain | Table) =>
    activeProject.endpoints.find(endpoint => endpoint.enabled && endpoint.parentID === item.id) ??
    activeProject.chains.find(chain => chain.referencedItemIDs.includes(item.id)) ??
    activeProject.chains.find(chain => chain.tableID === item.id) ??
    activeProject.prompts.find(prompt => prompt.tableID === item.id)

  const [renameItem] = useProjectItemActions()
  const actionButtonForProjectItem = (item: Prompt | Chain | Table, activeItem: boolean) => (
    <ProjectItemActionButton
      item={item}
      workspaces={workspaces}
      reference={reference(item)}
      onDelete={() => onDeleteItem(item.id)}
      active={activeItem}
    />
  )

  const addButton = (onAdd: () => void) => (
    <IconButton className='opacity-50 hover:opacity-100' icon={addIcon} onClick={onAdd} />
  )
  const isActiveItem = (item: Prompt | Chain | Table) =>
    activeItem !== CompareItem &&
    activeItem !== EndpointsItem &&
    activeItem !== SettingsItem &&
    activeItem?.id === item.id

  return (
    <Sidebar rightBorder={rightBorder}>
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
        {activeProject.isOwner && (
          <SidebarButton
            title='Settings'
            icon={settingsIcon}
            active={activeItem === SettingsItem}
            onClick={onSelectSettings}
          />
        )}
      </SidebarSection>
      <SidebarSection title='Prompts' actionComponent={addButton(onAddPrompt)}>
        {activeProject.prompts.map((prompt, promptIndex) => (
          <SidebarButton
            key={promptIndex}
            title={prompt.name}
            icon={promptIcon}
            active={isActiveItem(prompt)}
            onClick={() => onSelectPrompt(prompt.id)}
            actionComponent={actionButtonForProjectItem(prompt, isActiveItem(prompt))}
            onRename={name => renameItem(prompt, name)}
          />
        ))}
      </SidebarSection>
      <SidebarSection title='Chains' actionComponent={addButton(onAddChain)}>
        {activeProject.chains.map((chain, chainIndex) => (
          <SidebarButton
            key={chainIndex}
            title={chain.name}
            icon={chainIcon}
            active={isActiveItem(chain)}
            onClick={() => onSelectChain(chain.id)}
            actionComponent={actionButtonForProjectItem(chain, isActiveItem(chain))}
            onRename={name => renameItem(chain, name)}
          />
        ))}
      </SidebarSection>
      <SidebarSection title='Test Data' className='flex-1' actionComponent={addButton(onAddTable)}>
        {activeProject.tables.map((table, tableIndex) => (
          <SidebarButton
            key={tableIndex}
            title={table.name}
            icon={tableIcon}
            active={isActiveItem(table)}
            onClick={() => onSelectTable(table.id)}
            actionComponent={actionButtonForProjectItem(table, isActiveItem(table))}
            onRename={name => renameItem(table, name)}
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
  item: Prompt | Chain | Table
  workspaces: Workspace[]
  reference: Prompt | Chain | Endpoint | undefined
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
        <ProjectItemPopupMenu {...{ item, workspaces, reference, isMenuExpanded, setMenuExpanded, onDelete }} />
      </div>
    </div>
  )
}
