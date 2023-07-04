import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, Run, RunConfig } from '@/types'
import { runPromptWithConfig } from './runPrompt'

export const runChainWithInputs = async (
  userID: number,
  chain: RunConfig[],
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
      if (item.output) {
        inputs[item.output] = output
      }
    }
  }
  return runs
}

async function runChain(req: NextApiRequest, res: NextApiResponse<Run[]>, user: User) {
  const configs: RunConfig[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  const runs = await runChainWithInputs(user.id, configs, multipleInputs)

  res.json(runs)
}

export default withLoggedInUserRoute(runChain)
