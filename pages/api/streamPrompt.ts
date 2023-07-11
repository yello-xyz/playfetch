import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { PromptInputs, User, RunConfig } from '@/types'
import { Configuration, OpenAIApi } from 'openai'
import { getProviderKey } from '@/src/server/datastore/providers'
import { StreamResponseData } from '@/src/server/stream'

async function streamPrompt(req: NextApiRequest, res: NextApiResponse<string>, user: User) {
  const configs: RunConfig[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  const runConfig = configs[0]
  const inputs = multipleInputs[0]

  const prompt = Object.entries(inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    runConfig.prompt
  )

  const apiKey = (await getProviderKey(user.id, runConfig.config.provider)) ?? ''

  const api = new OpenAIApi(new Configuration({ apiKey }))
  const response = await api.createChatCompletion(
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: runConfig.config.temperature,
      max_tokens: runConfig.config.maxTokens,
      user: user.id.toString(),
      stream: true,
    },
    { responseType: 'stream', timeout: 30 * 1000 }
  )

  let result = ''
  for await (const message of StreamResponseData(response.data)) {
    try {
      const parsed = JSON.parse(message)
      const text = parsed.choices[0].delta?.content ?? ''
      result += text

      res.write(text)
      process.stdout.write(text)
    } catch (error) {
      console.error('Could not JSON parse stream message', message, error)
    }
  }

  process.stdout.write('\n')
  res.end()
}

export default withLoggedInUserRoute(streamPrompt)
