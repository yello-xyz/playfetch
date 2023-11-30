export type RunResponse = (
  | { result: any; output: string; error: undefined; failed: false; isInterrupt: boolean }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number; inputTokens: number; outputTokens: number }

export const EmptyRunResponse = (): RunResponse & { failed: false } => ({
  output: '',
  result: '',
  error: undefined,
  cost: 0,
  inputTokens: 0,
  outputTokens: 0,
  attempts: 1,
  failed: false,
  isInterrupt: false,
})

export const ErrorRunResponse = (error: string): RunResponse => ({
  error,
  result: undefined,
  output: undefined,
  cost: 0,
  inputTokens: 0,
  outputTokens: 0,
  attempts: 1,
  failed: true,
})

export const TryParseOutput = (output: string | undefined) => {
  try {
    return output ? JSON.parse(output) : output
  } catch {
    return output
  }
}

export type TimedRunResponse = RunResponse & { duration: number }

export const RunWithTimer = async (operation: Promise<RunResponse>): Promise<TimedRunResponse> => {
  const startTime = process.hrtime.bigint()
  const result = await operation
  const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000
  return { ...result, duration }
}
