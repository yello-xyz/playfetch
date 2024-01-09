import { VertexAI, Content, GenerateContentResponse } from '@google-cloud/vertexai'
import { GoogleLanguageModel } from '@/types'
import { Predictor, PromptContext } from '../evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { getProjectID } from '../storage'

import aiplatform from '@google-cloud/aiplatform'
const { PredictionServiceClient } = aiplatform.v1

const location = 'us-central1'
const client = new PredictionServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` })

const predict =
  (model: GoogleLanguageModel): Predictor =>
  (prompts, temperature, maxTokens, context, useContext, streamChunks) => {
    switch (model) {
      case 'text-bison':
      case 'chat-bison':
        return complete(model, prompts.main, prompts.system, temperature, maxTokens, context, useContext, streamChunks)
      case 'gemini-pro':
        return completePreview(model, prompts.main, temperature, maxTokens, context, useContext, streamChunks)
    }
  }

export default predict

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
    const useMessages = model === 'chat-bison'
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
    const inputPrompt = `${runningContext}${prompt}`
    const inputMessages = [...previousMessages, promptAsMessage]
    const request = {
      endpoint: `projects/${projectID}/locations/${location}/publishers/google/models/${model}`,
      instances: [
        {
          structValue: {
            fields: {
              ...(system ? { context: { stringValue: system } } : {}),
              ...(useMessages
                ? { messages: { listValue: { values: inputMessages } } }
                : { content: { stringValue: inputPrompt } }),
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
    const getContent = (obj: any | undefined) => obj?.structValue?.fields?.content?.stringValue
    const output = getContent(responseMessage) ?? getContent(response.predictions?.[0]) ?? ''
    if (output && streamChunks) {
      streamChunks(output)
    }

    const extractContent = (obj: any) => (typeof getContent(obj) === 'string' ? getContent(obj) : JSON.stringify(obj))
    const input = useMessages ? [system ?? '', ...inputMessages.map(extractContent)].join('\n') : inputPrompt
    const [cost, inputTokens, outputTokens] = CostForModel(model, input, output)
    context.running = `${inputPrompt}\n${output}\n`
    context.messages = [...inputMessages, ...(responseMessage ? [responseMessage] : [])]

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.details ?? 'Unknown error' }
  }
}

async function completePreview(
  model: GoogleLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    const previousContents = usePreviousContext ? context.contents ?? [] : []
    const promptAsContent = { role: 'user', parts: [{ text: prompt }] }
    const inputContents: Content[] = [...previousContents, promptAsContent]
    const request = { contents: inputContents, temperature, maxTokens }

    const projectID = await getProjectID()
    const vertexAI = new VertexAI({ project: projectID, location })
    const generativeModel = vertexAI.preview.getGenerativeModel({ model })
    const responseStream = await generativeModel.generateContentStream(request)

    const getContent = (response: GenerateContentResponse) => response.candidates[0].content
    const getText = (content: Content) => content.parts[0]?.text

    let output = ''
    for await (const chunk of responseStream.stream) {
      const text = getText(getContent(chunk)) ?? ''
      output += text
      streamChunks?.(text)
    }

    const extractContent = (content: Content) => getText(content) ?? JSON.stringify(content)
    const input = inputContents.map(extractContent).join('\n')
    const [cost, inputTokens, outputTokens] = CostForModel(model, input, output)

    const aggregatedResponse = await responseStream.response
    const responseContent = getContent(aggregatedResponse)
    context.contents = [...inputContents, ...(responseContent ? [responseContent] : [])]

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.details ?? 'Unknown error' }
  }
}
