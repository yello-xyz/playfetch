import aiplatform from '@google-cloud/aiplatform'
import { getProjectID } from './datastore'
const { PredictionServiceClient } = aiplatform.v1

const location = 'us-central1'
const client = new PredictionServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` })

export default async function predict(prompt: string, temperature: number, maxOutputTokens: number) {
  try {
    const projectID = await getProjectID()
    const request = {
      endpoint: `projects/${projectID}/locations/${location}/publishers/google/models/text-bison@001`,
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
    return response.predictions?.[0]?.structValue?.fields?.content?.stringValue
  } catch (error) {
    console.error(error)
    return undefined
  }
}
