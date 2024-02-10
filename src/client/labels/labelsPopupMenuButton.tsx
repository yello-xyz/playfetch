import LabelsPopup, { LabelsPopupProps } from './labelsPopup'
import { PopupButton } from '../components/popupButton'
import ItemLabels from './itemLabels'
import useGlobalPopup, { GlobalPopupLocation } from '@/src/client/components/globalPopupContext'

export default function LabelsPopupMenuButton({
  activeLabels,
  availableLabels,
  colors,
  toggleLabel,
}: {
  activeLabels: string[]
  availableLabels: string[]
  colors: Record<string, string>
  toggleLabel: (label: string) => void
}) {
  const setPopup = useGlobalPopup<LabelsPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(LabelsPopup, { activeLabels, availableLabels, labelColors: colors, toggleLabel }, location)
  }

  return (
    <PopupButton onSetPopup={onSetPopup} className='w-full h-fit'>
      <div className='py-1.5'>
        <ItemLabels labels={activeLabels} colors={colors} />
      </div>
    </PopupButton>
  )
}
