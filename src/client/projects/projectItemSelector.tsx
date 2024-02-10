import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { ActiveProject, Chain, Prompt, ResolvedEndpoint } from '@/types'
import { PopupContent, PopupLabelItem, PopupSectionTitle } from '../components/popupMenu'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import endpointIcon from '@/public/endpoint.svg'
import Icon from '../components/icon'
import { PopupButton } from '../components/popupButton'

export default function ProjectItemSelector<T extends Prompt | Chain | ResolvedEndpoint>({
  project,
  items,
  selectedItemID,
  onSelectItemID,
  disabled,
  fixedWidth,
  className = '',
}: {
  project: ActiveProject
  items: T[]
  selectedItemID?: number
  onSelectItemID: (itemID: number) => void
  disabled?: boolean
  fixedWidth?: boolean
  className?: string
}) {
  const promptIDs = new Set(project.prompts.map(prompt => prompt.id))
  const chainIDs = new Set(project.chains.map(chain => chain.id))
  const endpointIDs = new Set(project.endpoints.map(endpoint => endpoint.id))

  const isPrompt = (item: T) => promptIDs.has(item.id)
  const isChain = (item: T) => chainIDs.has(item.id)
  const isEndpoint = (item: T) => endpointIDs.has(item.id)

  const prompts = items.filter(isPrompt) as Prompt[]
  const chains = items.filter(isChain) as Chain[]
  const endpoints = items.filter(isEndpoint) as ResolvedEndpoint[]

  const setPopup = useGlobalPopup<PropjectItemSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(PropjectItemSelectorPopup, { prompts, chains, endpoints, onSelectItemID }, location)

  const selectedItem = items.find(item => item.id === selectedItemID)

  const buttonTitle = selectedItem
    ? 'name' in selectedItem
      ? selectedItem.name
      : `${selectedItem.urlPath} (${selectedItem.flavor})`
    : endpoints.length > 0
      ? 'Select a Project Item'
      : 'Select a Prompt or Chain'

  return (
    <PopupButton
      disabled={disabled || items.length === 0}
      fixedWidth={fixedWidth}
      className={className}
      onSetPopup={onSetPopup}>
      {selectedItem && (
        <Icon icon={isPrompt(selectedItem) ? promptIcon : isChain(selectedItem) ? chainIcon : endpointIcon} />
      )}
      <span className='flex-1 overflow-hidden whitespace-nowrap text-ellipsis'>{buttonTitle}</span>
    </PopupButton>
  )
}

type PropjectItemSelectorPopupProps = {
  prompts: Prompt[]
  chains: Chain[]
  endpoints: ResolvedEndpoint[]
  onSelectItemID: (itemID: number) => void
}

function PropjectItemSelectorPopup({
  prompts,
  chains,
  endpoints,
  onSelectItemID,
  withDismiss,
}: PropjectItemSelectorPopupProps & WithDismiss) {
  return (
    <PopupContent className='p-3'>
      {prompts.length > 0 && <PopupSectionTitle>Prompts</PopupSectionTitle>}
      {prompts.map((prompt, index) => (
        <PopupLabelItem
          key={index}
          title={prompt.name}
          icon={promptIcon}
          onClick={withDismiss(() => onSelectItemID(prompt.id))}
        />
      ))}
      {chains.length > 0 && <PopupSectionTitle>Chains</PopupSectionTitle>}
      {chains.map((chain, index) => (
        <PopupLabelItem
          key={index}
          title={chain.name}
          icon={chainIcon}
          onClick={withDismiss(() => onSelectItemID(chain.id))}
        />
      ))}
      {endpoints.length > 0 && <PopupSectionTitle>Endpoints</PopupSectionTitle>}
      {endpoints
        .slice()
        .sort((a, b) => a.urlPath.localeCompare(b.urlPath))
        .map((endpoint, index) => (
          <PopupLabelItem
            key={index}
            title={`${endpoint.urlPath} (${endpoint.flavor})`}
            icon={endpointIcon}
            onClick={withDismiss(() => onSelectItemID(endpoint.id))}
          />
        ))}
    </PopupContent>
  )
}
