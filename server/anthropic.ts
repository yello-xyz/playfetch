const headers = {
  'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
  'accept': 'application/json',
  'content-type': 'application/json',
}

const calculateCost = (prompt: string, result: string) =>
  (prompt.length * 4.6) / 1000000 + (result.length * 13.8) / 1000000

  export default async function predict(prompt: string, temperature: number, maxTokens: number) {
    try {
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
