import { PromptConfig } from '@/types'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent, PopupLabelItem } from '../popupMenu'
import { PopupButton } from '../popupButton'

export default function ChatModePopupButton({
  config,
  setConfig,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const isChat = config.isChat
  const setChat = (isChat: boolean) => setConfig({ ...config, isChat })

  const setChatModePopup = useGlobalPopup<ChatModeSelectorPopupProps>()

  const onSetChatModePopup = (location: GlobalPopupLocation) =>
    setChatModePopup(ChatModeSelectorPopup, { isChat, setChat }, location)

  return (
    <PopupButton popUpAbove fixedWidth disabled={disabled} onSetPopup={onSetChatModePopup}>
      <span className='flex-1 pl-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>
        {isChat ? 'Multi Step' : 'Single Step'}
      </span>
    </PopupButton>
  )
}

type ChatModeSelectorPopupProps = { isChat: boolean; setChat: (chat: boolean) => void }

const ChatModeSelectorPopup = ({ isChat, setChat, withDismiss }: ChatModeSelectorPopupProps & WithDismiss) => (
  <PopupContent className='p-3 min-w-[340px]'>
    <PopupLabelItem
      title='Single step'
      description='Each LLM interaction involves prompting the model once and receiving a single response.'
      onClick={withDismiss(() => setChat(false))}
      checked={!isChat}
    />
    <PopupLabelItem
      title='Multi step'
      description='LLM interactions maintain context across multiple responses, suited for conversational applications like chatbots.'
      onClick={withDismiss(() => setChat(true))}
      checked={isChat}
    />
  </PopupContent>
)
