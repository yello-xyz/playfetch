import aiplatform from '@google-cloud/aiplatform'
import { GoogleLanguageModel } from '@/types'
import { Predictor, PromptContext } from '../evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { getProjectID } from '../storage'

const { PredictionServiceClient } = aiplatform.v1

const location = 'us-central1'
const client = new PredictionServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` })

export default function predict(model: GoogleLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks) =>
    complete(model, prompts.main, prompts.system, temperature, maxTokens, context, useContext, streamChunks)
}

const isChatModel = (model: GoogleLanguageModel) => {
  switch (model) {
    case 'text-bison':
      return false
    case 'chat-bison':
      return true
  }
}

async function complete(
  model: GoogleLanguageModel,
  prompt: string,
  system: string | undefined,
  temperature: number,
  maxOutputTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    const projectID = await getProjectID()
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const previousMessages = usePreviousContext ? context.messages ?? [] : []
    const promptAsMessage = {
      structValue: {
        fields: {
          author: { stringValue: 'user' },
          content: { stringValue: prompt },
        },
      },
    }
    const promptMessages = [...previousMessages, promptAsMessage]
    const request = {
      endpoint: `projects/${projectID}/locations/${location}/publishers/google/models/${model}`,
      instances: [
        {
          structValue: {
            fields: {
              ...(system ? { context: { stringValue: system } } : {}),
              ...(isChatModel(model)
                ? { messages: { listValue: { values: promptMessages } } }
                : { content: { stringValue: `${runningContext}${prompt}` } }),
            },
          },
        },
      ],
      parameters: {
        structValue: {
          fields: {
            temperature: { numberValue: temperature },
            maxOutputTokens: { numberValue: maxOutputTokens },
          },
        },
      },
    }

    const [response] = await client.predict(request)
    const responseMessage = response.predictions?.[0]?.structValue?.fields?.candidates?.listValue?.values?.[0]
    const output =
      responseMessage?.structValue?.fields?.content?.stringValue ??
      response.predictions?.[0]?.structValue?.fields?.content?.stringValue ??
      ''
    if (output && streamChunks) {
      streamChunks(output)
    }

    const cost = CostForModel(model, prompt, output)
    context.running = `${runningContext}${prompt}\n${output}\n`
    context.messages = [...promptMessages, ...(responseMessage ? [responseMessage] : [])]

    return { output, cost }
  } catch (error: any) {
    return { error: error?.details ?? 'Unknown error' }
  }
}
