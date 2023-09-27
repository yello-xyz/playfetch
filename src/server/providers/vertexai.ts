import aiplatform from '@google-cloud/aiplatform'
import { getProjectID } from '../datastore/datastore'
import { GoogleLanguageModel } from '@/types'
import { Predictor, PromptContext } from '../promptEngine'
import { CostForModel } from './costCalculation'

const { PredictionServiceClient } = aiplatform.v1

const location = 'us-central1'
const client = new PredictionServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` })

export default function predict(model: GoogleLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks) =>
    complete(model, prompts.main, temperature, maxTokens, context, useContext, streamChunks)
}

async function complete(
  model: GoogleLanguageModel,
  prompt: string,
  temperature: number,
  maxOutputTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    const projectID = await getProjectID()
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const request = {
      endpoint: `projects/${projectID}/locations/${location}/publishers/google/models/${model}`,
      instances: [
        {
          structValue: {
            fields: {
              content: { stringValue: `${runningContext}${prompt}` },
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
    const output = response.predictions?.[0]?.structValue?.fields?.content?.stringValue ?? ''
    if (output && streamChunks) {
      streamChunks(output)
    }

    const cost = CostForModel(model, prompt, output)
    context.running = `${runningContext}${prompt}\n${output}\n`

    return { output, cost }
  } catch (error: any) {
    return { error: error?.details ?? 'Unknown error' }
  }
}
