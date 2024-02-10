import { PromptConfig } from '@/types'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent, PopupLabelItem } from '../components/popupMenu'
import { PopupButton } from '../components/popupButton'

export default function BooleanParameterPopupButton({
  parameter,
  label,
  description,
  config,
  setConfig,
  disabled,
}: {
  parameter: keyof PromptConfig
  label: (value: boolean) => string
  description: (value: boolean) => string
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const value = config[parameter] as boolean
  const setValue = (value: boolean) => setConfig({ ...config, [parameter]: value })

  const setPopup = useGlobalPopup<BooleanParameterPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(BooleanParameterPopup, { value, setValue, label, description }, location)

  return (
    <PopupButton popUpAbove fixedWidth disabled={disabled} onSetPopup={onSetPopup}>
      <span className='flex-1 pl-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>{label(value)}</span>
    </PopupButton>
  )
}

type BooleanParameterPopupProps = {
  value: boolean
  setValue: (value: boolean) => void
  label: (value: boolean) => string
  description: (value: boolean) => string
}

const BooleanParameterPopup = ({
  value,
  setValue,
  label,
  description,
  withDismiss,
}: BooleanParameterPopupProps & WithDismiss) => (
  <PopupContent className='p-3 min-w-[340px]'>
    <PopupLabelItem
      title={label(false)}
      description={description(false)}
      onClick={withDismiss(() => setValue(false))}
      checked={!value}
    />
    <PopupLabelItem
      title={label(true)}
      description={description(true)}
      onClick={withDismiss(() => setValue(true))}
      checked={value}
    />
  </PopupContent>
)
