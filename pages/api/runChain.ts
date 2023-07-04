import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, Run, RunConfig } from '@/types'
import { runPromptWithConfig } from './runPrompt'

export const runConfigsWithInputs = async (
  userID: number,
  runConfigs: RunConfig[],
  multipleInputs: PromptInputs[]
): Promise<Run[]> => {
  const runs: Run[] = []
  for (const inputs of multipleInputs) {
    for (const runConfig of runConfigs) {
      const { output, cost } = await runPromptWithConfig(runConfig.prompt, runConfig.config, inputs, false)
      if (!output?.length) {
        break
      }
      runs.push(await saveRun(userID, runConfig.promptID, runConfig.versionID, inputs, output, cost))
      if (runConfig.output) {
        inputs[runConfig.output] = output
      }
    }
  }
  return runs
}

async function runChain(req: NextApiRequest, res: NextApiResponse<Run[]>, user: User) {
  const configs: RunConfig[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  const runs = await runConfigsWithInputs(user.id, configs, multipleInputs)

  res.json(runs)
}

export default withLoggedInUserRoute(runChain)
