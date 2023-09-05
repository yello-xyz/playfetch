import aiplatform from '@google-cloud/aiplatform'
import { getProjectID } from './datastore/datastore'
import { GoogleLanguageModel } from '@/types'
import { Predictor } from './promptEngine'
const { PredictionServiceClient } = aiplatform.v1

const location = 'us-central1'
const client = new PredictionServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` })

export default function predict(model: GoogleLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, streamChunks) =>
    complete(model, prompts.main, temperature, maxTokens, streamChunks)
}

async function complete(
  model: GoogleLanguageModel,
  prompt: string,
  temperature: number,
  maxOutputTokens: number,
  streamChunks?: (text: string) => void
) {
  try {
    const projectID = await getProjectID()
    const request = {
      endpoint: `projects/${projectID}/locations/${location}/publishers/google/models/${model}`,
      instances: [
        {
          structValue: {
            fields: {
              content: { stringValue: prompt },
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
    const output = response.predictions?.[0]?.structValue?.fields?.content?.stringValue ?? undefined
    if (output && streamChunks) {
      streamChunks(output)
    }
    return { output, cost: 0 }
  } catch (error: any) {
    return { error: error?.details ?? 'Unknown error' }
  }
}
