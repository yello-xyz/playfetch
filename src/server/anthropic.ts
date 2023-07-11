import Anthropic from '@anthropic-ai/sdk'

const calculateCost = (prompt: string, result: string) =>
  (prompt.length * 4.6) / 1000000 + (result.length * 13.8) / 1000000

export default function predict(apiKey: string) {
  return (prompt: string, temperature: number, maxTokens: number) => complete(apiKey, prompt, temperature, maxTokens)
}

async function complete(apiKey: string, prompt: string, temperature: number, maxTokens: number) {
  try {
    const anthropic = new Anthropic({ apiKey })
    const formattedPrompt = `${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`
    const response = await anthropic.completions.create({
      model: 'claude-1',
      temperature,
      max_tokens_to_sample: maxTokens,
      prompt: formattedPrompt,
      stop_sequences: [Anthropic.HUMAN_PROMPT],
    })
    const cost = calculateCost(formattedPrompt, response.completion)
    return { output: response?.completion, cost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
