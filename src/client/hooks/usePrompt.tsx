import api from '@/src/client/api'
import { ActiveProject, ActivePrompt, PromptVersion } from '@/types'
import useSavePrompt from './useSavePrompt'
import { useRouter } from 'next/router'
import { PromptRoute } from '../../common/clientRoute'

export default function usePrompt(
  activeProject: ActiveProject,
  refreshProject: () => Promise<void>,
  activePrompt: ActivePrompt | undefined,
  setActivePromp: (prompt: ActivePrompt) => void,
  activeVersion: PromptVersion | undefined,
  setActiveVersion: (version: PromptVersion) => void
) {
  const router = useRouter()

  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activeVersion, setActiveVersion)

  const refreshPrompt = async (promptID: number, focusVersionID = activeVersion?.id) => {
    const newPrompt = await api.getPrompt(promptID, activeProject)
    setActivePromp(newPrompt)
    setActiveVersion(
      newPrompt.versions.find(version => version.id === focusVersionID) ?? newPrompt.versions.slice(-1)[0]
    )
    setModifiedVersion(undefined)
  }

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt(refreshProject)
      await refreshPrompt(promptID)
      router.push(PromptRoute(activeProject.id, promptID), undefined, { shallow: true })
    }
  }

  const addPrompt = async () => {
    const { promptID } = await api.addPrompt(activeProject.id)
    refreshProject().then(() => selectPrompt(promptID))
  }

  return [refreshPrompt, selectPrompt, addPrompt, savePrompt, setModifiedVersion] as const
}
