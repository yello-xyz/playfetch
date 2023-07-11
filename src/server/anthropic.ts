import Anthropic from '@anthropic-ai/sdk'

const calculateCost = (prompt: string, result: string) =>
  (prompt.length * 4.6) / 1000000 + (result.length * 13.8) / 1000000

export default function predict(apiKey: string, streamChunks?: (text: string) => void) {
  return (prompt: string, temperature: number, maxTokens: number) =>
    complete(apiKey, prompt, temperature, maxTokens, streamChunks)
}

async function complete(
  apiKey: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  streamChunks?: (text: string) => void
) {
  try {
    const anthropic = new Anthropic({ apiKey })
    const formattedPrompt = `${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`
    const stream = await anthropic.completions.create({
      model: 'claude-1',
      temperature,
      max_tokens_to_sample: maxTokens,
      prompt: formattedPrompt,
      stop_sequences: [Anthropic.HUMAN_PROMPT],
      stream: true,
    })

    let output = ''
    for await (const message of stream) {
      const text = message.completion
      output += text
      streamChunks?.(text)
    }

    const cost = calculateCost(formattedPrompt, output)

    return { output, cost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
