import api from '@/src/client/api'
import { ActiveChain, ActiveProject, ActivePrompt, IsPromptVersion } from '@/types'
import {
  ActiveItem,
  BuildActiveChain,
  BuildActivePrompt,
  CompareItem,
  EndpointsItem,
  SettingsItem,
} from '@/src/common/activeItem'
import useInitialState from './useInitialState'

const ActiveItemIsPromptOrChain = (item: ActiveItem | undefined): item is ActivePrompt | ActiveChain | undefined =>
  item !== CompareItem && item !== EndpointsItem && item !== SettingsItem
const ActiveItemIsChain = (item: ActiveItem): item is ActiveChain =>
  ActiveItemIsPromptOrChain(item) && 'referencedItemIDs' in item
const ActiveItemIsPrompt = (item: ActiveItem): item is ActivePrompt =>
  ActiveItemIsPromptOrChain(item) && !ActiveItemIsChain(item)

const sameIDs = (a: { id: number } | undefined, b: { id: number } | undefined) => a?.id === b?.id
const sameParentIDs = (a: { parentID: number } | undefined, b: { parentID: number } | undefined) =>
  a?.parentID === b?.parentID
const sameItems = (a: ActiveItem | undefined, b: ActiveItem | undefined) =>
  (a === CompareItem && b === CompareItem) ||
  (a === EndpointsItem && b === EndpointsItem) ||
  (a === SettingsItem && b === SettingsItem) ||
  (ActiveItemIsPromptOrChain(a) && ActiveItemIsPromptOrChain(b) && sameIDs(a, b))

export default function useActiveItem(initialActiveProject: ActiveProject, initialActiveItem: ActiveItem | null) {
  const [activeProject, setActiveProject] = useInitialState(initialActiveProject, sameIDs)

  const refreshProject = () =>
    api.getProject(activeProject.id).then(project => {
      setActiveProject(project)
      setActiveItem(activeItem => {
        if (activeItem && ActiveItemIsPrompt(activeItem)) {
          const updatedPrompt = BuildActivePrompt(project)({
            prompt: activeItem,
            versions: activeItem.versions,
            inputValues: activeItem.inputValues,
          })
          setActiveVersion(version => updatedPrompt.versions.find(v => v.id === version?.id) ?? version)
          return updatedPrompt
        } else if (activeItem && ActiveItemIsChain(activeItem)) {
          const updatedChain = BuildActiveChain(project)({
            chain: activeItem,
            versions: activeItem.versions,
            inputValues: activeItem.inputValues,
          })
          setActiveVersion(version => updatedChain.versions.find(v => v.id === version?.id) ?? version)
          return updatedChain
        } else {
          return activeItem
        }
      })
    })

  const [activeItem, setActiveItem] = useInitialState(initialActiveItem ?? undefined, sameItems)
  const activePrompt = activeItem && ActiveItemIsPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && ActiveItemIsChain(activeItem) ? activeItem : undefined

  const initialActiveVersion = ActiveItemIsPromptOrChain(activeItem) ? activeItem?.versions?.slice(-1)?.[0] : undefined
  const [activeVersion, setActiveVersion] = useInitialState(initialActiveVersion, sameParentIDs)
  const activePromptVersion = activeVersion && IsPromptVersion(activeVersion) ? activeVersion : undefined
  const activeChainVersion = activeVersion && !IsPromptVersion(activeVersion) ? activeVersion : undefined

  return [
    activeProject,
    refreshProject,
    activeItem,
    setActiveItem,
    activePrompt,
    activeChain,
    activeVersion,
    setActiveVersion,
    activePromptVersion,
    activeChainVersion,
  ] as const
}
