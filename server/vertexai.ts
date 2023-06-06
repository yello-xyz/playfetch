import aiplatform from '@google-cloud/aiplatform'
const { PredictionServiceClient } = aiplatform.v1

const client = new PredictionServiceClient({ apiEndpoint: 'us-central1-aiplatform.googleapis.com' })

export default async function predict(prompt: string, temperature: number, maxOutputTokens: number) {
  const request = {
    endpoint: `projects/playfetch-dev/locations/us-central1/publishers/google/models/text-bison@001`,
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

  try {
    const [response] = await client.predict(request)
    return response.predictions?.[0]?.structValue?.fields?.content?.stringValue
  } catch (error) {
    console.error(error)
    return undefined
  }
}
