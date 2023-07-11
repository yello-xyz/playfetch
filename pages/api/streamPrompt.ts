import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { PromptInputs, User, RunConfig } from '@/types'
import { Configuration, OpenAIApi } from 'openai'
import { getProviderKey } from '@/src/server/datastore/providers'

async function* chunksToLines(chunksAsync: any) {
  let previous = ''
  for await (const chunk of chunksAsync) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    previous += bufferChunk
    let eolIndex
    while ((eolIndex = previous.indexOf('\n')) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1).trimEnd()
      if (line === 'data: [DONE]') break
      if (line.startsWith('data: ')) yield line
      previous = previous.slice(eolIndex + 1)
    }
  }
}

async function* linesToMessages(linesAsync: any) {
  for await (const line of linesAsync) {
    const message = line.substring('data :'.length)

    yield message
  }
}

async function* streamCompletion(data: any) {
  yield* linesToMessages(chunksToLines(data))
}

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
  for await (const message of streamCompletion(response.data)) {
    try {
      const parsed = JSON.parse(message)
      const text = parsed.choices[0].delta?.content ?? ''
      result += text

      process.stdout.write(text)
    } catch (error) {
      console.error('Could not JSON parse stream message', message, error)
    }
  }
  process.stdout.write('\n')

  res.json(result)
}

export default withLoggedInUserRoute(streamPrompt)
