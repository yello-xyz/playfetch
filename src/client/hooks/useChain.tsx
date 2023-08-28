import api from '@/src/client/api'
import { ActiveChain, ActiveProject, ChainVersion } from '@/types'
import useSaveChain from './useSaveChain'
import { useRouter } from 'next/router'
import { ChainRoute } from '../clientRoute'

export default function useChain(
  activeProject: ActiveProject,
  refreshProject: () => Promise<void>,
  activeChain: ActiveChain | undefined,
  setActiveChain: (chain: ActiveChain) => void,
  activeVersion: ChainVersion | undefined,
  setActiveVersion: (version: ChainVersion) => void,
  savePrompt: (onSaved: () => Promise<void>) => void
) {
  const router = useRouter()

  const saveChain = useSaveChain(activeChain, activeVersion, setActiveVersion)

  const refreshChain = async (chainID: number, focusVersionID = activeVersion?.id) => {
    const newChain = await api.getChain(chainID, activeProject)
    setActiveChain(newChain)
    setActiveVersion(newChain.versions.find(version => version.id === focusVersionID) ?? newChain.versions.slice(-1)[0])
  }

  const selectChain = async (chainID: number) => {
    if (chainID !== activeChain?.id) {
      savePrompt(refreshProject)
      await refreshChain(chainID)
      router.push(ChainRoute(activeProject.id, chainID), undefined, { shallow: true })
    }
  }

  const addChain = async () => {
    const chainID = await api.addChain(activeProject.id)
    refreshProject().then(() => selectChain(chainID))
  }

  return [refreshChain, selectChain, addChain, saveChain] as const
}
