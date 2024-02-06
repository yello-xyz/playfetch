import { ActivePrompt, Run, PromptVersion, ActiveChain, ChainVersion } from '@/types'
import api from '@/src/client/api'
import labelIcon from '@/public/label.svg'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'
import GlobalPopupMenu from '../globalPopupMenu'
import LabelsPopup, { AvailableLabelColorsForItem, LabelsPopupProps } from './labelsPopup'

export function ItemLabelsPopupMenu({
  item,
  activeItem,
  selectedCell = false,
}: {
  item: PromptVersion | ChainVersion | Run
  activeItem: ActivePrompt | ActiveChain
  selectedCell?: boolean
}) {
  const activeLabels = item.labels
  const availableLabels = activeItem.availableLabels
  const labelColors = AvailableLabelColorsForItem(activeItem)

  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const refresh = () => refreshActiveItem().then(refreshProject)

  const isVersion = (versionOrRun: typeof item): versionOrRun is PromptVersion | ChainVersion => 'runs' in versionOrRun

  const itemComments = isVersion(item)
    ? item.comments
    : activeItem.versions.flatMap(version => version.comments).filter(comment => comment.runID === item.id)

  const toggleLabel = (label: string) => {
    const checked = !item.labels.includes(label)
    const replyTo = itemComments.findLast(
      comment => comment.text === label && comment.action === (checked ? 'removeLabel' : 'addLabel')
    )?.id
    if (isVersion(item)) {
      api.toggleVersionLabel(item.id, activeItem.projectID, label, checked, replyTo).then(refresh)
    } else {
      api.toggleRunLabel(item.id, activeItem.projectID, label, checked, replyTo).then(refresh)
    }
  }

  return <LabelsPopupMenu {...{ activeLabels, availableLabels, colors: labelColors, toggleLabel, selectedCell }} />
}

export default function LabelsPopupMenu({
  activeLabels,
  availableLabels,
  colors,
  toggleLabel,
  selectedCell = false,
}: {
  activeLabels: string[]
  availableLabels: string[]
  colors: Record<string, string>
  toggleLabel: (label: string) => void
  selectedCell?: boolean
}) {
  const loadPopup = (): [typeof LabelsPopup, LabelsPopupProps] => [
    LabelsPopup,
    { activeLabels, availableLabels, labelColors: colors, toggleLabel },
  ]

  return <GlobalPopupMenu icon={labelIcon} loadPopup={loadPopup} selectedCell={selectedCell} />
}
