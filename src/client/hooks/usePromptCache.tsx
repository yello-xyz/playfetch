import { ActiveProject, ActivePrompt } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'

export type PromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  refreshPrompt: (promptID: number) => Promise<ActivePrompt>
}

export default function usePromptCache(
  project: ActiveProject,
  onRefreshPrompt?: (promptID: number, prompt: ActivePrompt) => void,
  promptIDs = project.prompts.map(prompt => prompt.id)
) {
  const refreshPrompt = useCallback(
    async (promptID: number) =>
      api.getPrompt(promptID, project).then(activePrompt => {
        setActivePromptCache(cache => ({ ...cache, [promptID]: activePrompt }))
        onRefreshPrompt?.(promptID, activePrompt)
        return activePrompt
      }),
    [project, onRefreshPrompt]
  )

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})

  const promptCache: PromptCache = {
    promptForID: id => activePromptCache[id],
    refreshPrompt,
  }

  useEffect(() => {
    const unloadedPromptID = promptIDs.find(promptID => !activePromptCache[promptID])
    if (unloadedPromptID) {
      refreshPrompt(unloadedPromptID)
    }
  }, [project, promptIDs, activePromptCache, refreshPrompt])

  return promptCache
}
