const calculateCost = (prompt: string, result: string) =>
  (prompt.length * 4.6) / 1000000 + (result.length * 13.8) / 1000000

export default function predict(apiKey: string) {
  return (prompt: string, temperature: number, maxTokens: number) => complete(apiKey, prompt, temperature, maxTokens)
}

async function complete(apiKey: string, prompt: string, temperature: number, maxTokens: number) {
  try {
    const headers = {
      'x-api-key': apiKey,
      accept: 'application/json',
      'content-type': 'application/json',
    }
    const url = new URL('https://api.anthropic.com/v1/complete')
    const formattedPrompt = `\n\nHuman: ${prompt}\n\nAssistant:`
    const body = JSON.stringify({
      prompt: formattedPrompt,
      temperature,
      stream: false,
      model: 'claude-v1',
      max_tokens_to_sample: maxTokens,
      stop_sequences: ['Human:'],
    })
    const response = await fetch(url, { method: 'POST', headers, body }).then(result => result.json())
    if (response.exception) {
      throw new Error(response.exception)
    }
    const cost = calculateCost(formattedPrompt, response.completion)
    return { output: response?.completion, cost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
