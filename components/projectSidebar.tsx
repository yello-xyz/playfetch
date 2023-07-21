import { ActiveChain, ActiveProject, ActivePrompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import chainIcon from '@/public/chain.svg'
import endpointIcon from '@/public/endpoint.svg'
import backIcon from '@/public/back.svg'
import Sidebar, { SidebarButton, SidebarSection } from './sidebar'

export default function ProjectSidebar({
  activeProject,
  activeItem,
  onAddPrompt,
  onAddChain,
  onSelectPrompt,
  onSelectChain,
  onSelectEndpoints,
  onNavigateBack,
}: {
  activeProject: ActiveProject
  activeItem?: ActivePrompt | ActiveChain | 'endpoints'
  onAddPrompt: () => void
  onAddChain: () => void
  onSelectPrompt: (promptID: number) => void
  onSelectChain: (chainID: number) => void
  onSelectEndpoints: () => void
  onNavigateBack: () => void
}) {
  return (
    <Sidebar>
      <SidebarSection>
        <SidebarButton title='Back to overview' icon={backIcon} onClick={onNavigateBack} />
      </SidebarSection>
      <SidebarSection>
        <SidebarButton title='Endpoints' icon={endpointIcon} active={activeItem === 'endpoints'} onClick={onSelectEndpoints}/>
      </SidebarSection>
      <SidebarSection title='Prompts'>
        {activeProject.prompts.map((prompt, promptIndex) => (
          <SidebarButton
            key={promptIndex}
            title={prompt.name}
            icon={promptIcon}
            active={activeItem !== 'endpoints' && activeItem?.id === prompt.id}
            onClick={() => onSelectPrompt(prompt.id)}
          />
        ))}
        <SidebarButton title='Add new Prompt…' icon={addIcon} onClick={onAddPrompt} />
      </SidebarSection>
      <SidebarSection title='Chains' className='flex-1'>
        {activeProject.chains.map((chain, chainIndex) => (
          <SidebarButton
            key={chainIndex}
            title={chain.name}
            icon={chainIcon}
            active={activeItem !== 'endpoints' && activeItem?.id === chain.id}
            onClick={() => onSelectChain(chain.id)}
          />
        ))}
        <SidebarButton title='Add new Chain…' icon={addIcon} onClick={onAddChain} />
      </SidebarSection>
    </Sidebar>
  )
}
