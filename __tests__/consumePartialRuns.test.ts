import { ConsumeStream } from '@/src/client/hooks/useRunVersion'
import { PartialRun, PromptInputs } from '@/types'
import { ReadableStream } from 'stream/web'
import 'isomorphic-fetch'

const testConsumeStream = (
  testDescription: string,
  streamedData: object[],
  expectedRuns: PartialRun[],
  numberOfInputs = 1
) =>
  test(`Test ${testDescription}`, async () => {
    const inputs = Array.from({ length: numberOfInputs }, () => ({} as PromptInputs))
    const streamReader = new ReadableStream({
      start(controller) {
        for (const data of streamedData) {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        }
        controller.close()
      },
    }).getReader()
    let runs: PartialRun[] = []
    await ConsumeStream(inputs, streamReader, partialRuns => (runs = partialRuns))
    expect(runs).toStrictEqual(expectedRuns)
  })

const chunk = (
  message?: string,
  configIndex = 0,
  inputIndex = 0,
  cost?: number,
  duration?: number,
  failed?: boolean,
  continuationID?: number
) => ({ inputIndex, configIndex, index: configIndex, message, cost, duration, failed, continuationID })

const run = (
  output: string,
  index = 0,
  id = index,
  cost?: number,
  duration?: number,
  failed?: boolean,
  continuationID?: number
) => ({
  id,
  index,
  output,
  cost,
  duration,
  failed,
  continuationID,
})

testConsumeStream('no chunks', [], [])
testConsumeStream('single chunk', [chunk('hello')], [run('hello')])
testConsumeStream('multiple chunks', [chunk('hello'), chunk(' world')], [run('hello world')])
testConsumeStream('multiple steps', [chunk('hello'), chunk('world', 1)], [run('hello'), run('world', 1)])
testConsumeStream(
  'multiple steps and chunks',
  [chunk('hello'), chunk(' world'), chunk('nice ', 1), chunk('one', 1), chunk('goodbye', 2)],
  [run('hello world'), run('nice one', 1), run('goodbye', 2)]
)
testConsumeStream(
  'multiple inputs',
  [chunk('hello', 0, 0), chunk('world', 0, 1)],
  [run('hello'), run('world', 0, 1)],
  2
)
testConsumeStream(
  'multiple inputs and steps',
  [chunk('hello', 0, 0), chunk('world', 1, 0), chunk('nice', 0, 1), chunk('one', 1, 1)],
  [run('hello'), run('world', 1), run('nice', 0, 2), run('one', 1, 3)],
  2
)
testConsumeStream(
  'multiple inputs and chunks',
  [chunk('hello', 0, 0), chunk(' world', 0, 0), chunk('nice ', 0, 1), chunk('one', 0, 1)],
  [run('hello world'), run('nice one', 0, 1)],
  2
)
testConsumeStream(
  'multiple inputs and steps and chunks',
  [chunk('hello', 0, 0), chunk('world', 1, 0), chunk('nice ', 0, 1), chunk('one', 0, 1), chunk('goodbye', 1, 1)],
  [run('hello'), run('world', 1), run('nice one', 0, 2), run('goodbye', 1, 3)],
  2
)

testConsumeStream('attributes', [chunk('hello', 0, 0, 3, 4, true)], [run('hello', 0, 0, 3, 4, true)])
