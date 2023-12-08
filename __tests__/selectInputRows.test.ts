import { SelectInputRows } from '@/src/client/inputRows'
import { InputValues, TestConfig } from '@/types'

const config = (mode: TestConfig['mode'], rowIndices = [] as number[]): TestConfig => ({
  mode,
  rowIndices,
  interrupt: 'manual',
})

test('No inputs yields single empty prompt input', () =>
  expect(SelectInputRows({}, [], config('first'))[0]).toStrictEqual([{}]))

test('Inputs without values yield single empty prompt input', () =>
  expect(SelectInputRows({}, ['a', 'b'], config('first'))[0]).toStrictEqual([{}]))

const testRowSelection = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  config: TestConfig,
  count: number,
  start: number,
  expectedIndices: number[]
) =>
  test(testDescription, () =>
    expect(SelectInputRows(inputValues, variables, config, count, start)[1]).toStrictEqual(expectedIndices)
  )

const testAllDefaultModes = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  expectedIndices: number[]
) => {
  for (const mode of ['first', 'last', 'random', 'all'] as TestConfig['mode'][]) {
    testRowSelection(
      `${testDescription} (${mode})`,
      inputValues,
      variables,
      config(mode),
      expectedIndices.length,
      0,
      expectedIndices
    )
  }
}

testAllDefaultModes('Test empty input', {}, [], [])
testAllDefaultModes('Test empty input with variables', {}, ['a', 'b', 'c'], [])
testAllDefaultModes('Test single input without values', { var1: [] }, ['var1'], [])
testAllDefaultModes('Test single input without variables', { var1: ['value1'] }, [], [])
testAllDefaultModes('Test single input with different variables', { var1: ['value1'] }, ['var2'], [])
testAllDefaultModes('Test single input with single variable', { var1: ['value1'] }, ['var1'], [0])
testAllDefaultModes('Test single input with additional variables', { var1: ['value1'] }, ['var1', 'var2'], [0])

const sparseValues = {
  var1: ['', 'value1', '', '', '', '', ''],
  var2: ['', '', '', 'value2', '', '', ''],
  var3: ['', '', '', '', '', 'value3', ''],
}

const testSparseValues = (config: TestConfig, expectedIndices: number[], count = 1, start = 0) => {
  testRowSelection(
    `Test sparse values (${config.mode} [${config.rowIndices}]) [${count}, ${start}]`,
    sparseValues,
    Object.keys(sparseValues),
    config,
    count,
    start,
    expectedIndices
  )
}

testSparseValues(config('first'), [1])
testSparseValues(config('last'), [5])
testSparseValues(config('all'), [1, 3, 5])

testSparseValues(config('custom'), [])
testSparseValues(config('custom', [0]), [])
testSparseValues(config('custom', [1, 2]), [1])
testSparseValues(config('custom', [1, 2, 3]), [1, 3])
testSparseValues(config('custom', [3, 2, 1]), [1, 3])
testSparseValues(config('custom', [1, 3, 5]), [1, 3, 5])
testSparseValues(config('custom', [0, 1, 2, 3, 4, 5, 6, 7, 8]), [1, 3, 5])

testSparseValues(config('range'), [1])
testSparseValues(config('range'), [1], 1, 1)
testSparseValues(config('range'), [3], 1, 2)
testSparseValues(config('range'), [1, 3], 2, 0)
testSparseValues(config('range'), [3, 5], 2, 2)
testSparseValues(config('range'), [3, 5], 2, 3)
testSparseValues(config('range'), [1, 3, 5], 3, 0)
testSparseValues(config('range'), [1, 3, 5], 3, 1)
testSparseValues(config('range'), [3, 5], 3, 2)
testSparseValues(config('range'), [5], 1, 5)
testSparseValues(config('range'), [5], 2, 5)
testSparseValues(config('range'), [1, 3, 5], 10, 0)
