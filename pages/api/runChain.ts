import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, PromptConfig, User } from '@/types'
import { runPromptWithConfig } from './runPrompt'

async function runChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const promptID: number = req.body.promptID
  const configs: PromptConfig[] = req.body.configs
  const versionIDs: number[] = req.body.versionIDs
  const prompts: string[] = req.body.prompts
  const multipleInputs: PromptInputs[] = req.body.inputs
  const mappedOutputs: (string | undefined)[] = req.body.outputs

  for (const inputs of multipleInputs) {
    for (const [index, versionID] of versionIDs.entries()) {
      const prompt = prompts[index]
      const config = configs[index]
      const { output, cost } = await runPromptWithConfig(prompt, config, inputs, false)
      if (!output?.length) {
        break
      }
      await saveRun(user.id, promptID, versionID, inputs, output, cost)
      const mappedOutput = mappedOutputs[index]
      if (mappedOutput) {
        inputs[mappedOutput] = output
      }
    }
  }
  res.json({})
}

export default withLoggedInUserRoute(runChain)
