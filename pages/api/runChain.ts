import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, PromptConfig, User, Run } from '@/types'
import { runPromptWithConfig } from './runPrompt'

export const runChainWithInputs = async (
  userID: number,
  chain: { promptID: number; versionID: number; prompt: string; config: PromptConfig; mappedOutput?: string }[],
  multipleInputs: PromptInputs[]
): Promise<Run[]> => {
  const runs: Run[] = []
  for (const inputs of multipleInputs) {
    for (const item of chain) {
      const { output, cost } = await runPromptWithConfig(item.prompt, item.config, inputs, false)
      if (!output?.length) {
        break
      }
      runs.push(await saveRun(userID, item.promptID, item.versionID, inputs, output, cost))
      if (item.mappedOutput) {
        inputs[item.mappedOutput] = output
      }
    }
  }
  return runs
}

async function runChain(req: NextApiRequest, res: NextApiResponse<Run[]>, user: User) {
  const promptIDs: number[] = req.body.promptIDs
  const configs: PromptConfig[] = req.body.configs
  const versionIDs: number[] = req.body.versionIDs
  const prompts: string[] = req.body.prompts
  const multipleInputs: PromptInputs[] = req.body.inputs
  const mappedOutputs: (string | undefined)[] = req.body.outputs

  const runs = await runChainWithInputs(
    user.id,
    promptIDs.map((promptID, index) => ({
      promptID,
      versionID: versionIDs[index],
      prompt: prompts[index],
      config: configs[index],
      mappedOutput: mappedOutputs[index],
    })),
    multipleInputs
  )

  res.json(runs)
}

export default withLoggedInUserRoute(runChain)
