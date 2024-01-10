import { SelectInputRows } from '@/src/client/inputRows'
import { InputValues, TestConfig } from '@/types'

const config = (mode: 'custom' | 'all', rowIndices = [] as number[]): TestConfig | undefined =>
  mode === 'all' ? undefined : { mode, rowIndices }

test('No inputs yields single empty prompt input', () =>
  expect(SelectInputRows({}, [], config('custom'))[0]).toStrictEqual([{}]))

test('Inputs without values yield single empty prompt input', () =>
  expect(SelectInputRows({}, ['a', 'b'], config('custom'))[0]).toStrictEqual([{}]))

const testRowSelection = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  config: TestConfig | undefined,
  expectedIndices: number[]
) =>
  test(testDescription, () => expect(SelectInputRows(inputValues, variables, config)[1]).toStrictEqual(expectedIndices))

const testAllDefaultModes = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  expectedIndices: number[]
) => {
  testRowSelection(`${testDescription} (custom)`, inputValues, variables, config('custom'), expectedIndices)
  testRowSelection(`${testDescription} (all)`, inputValues, variables, undefined, expectedIndices)
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

const testSparseValues = (config: TestConfig | undefined, expectedIndices: number[], count = 1, start = 0) => {
  testRowSelection(
    `Test sparse values (${config ? 'custom' : 'all'} [${config?.rowIndices ?? []}]) [${count}, ${start}]`,
    sparseValues,
    Object.keys(sparseValues),
    config,
    expectedIndices
  )
}

testSparseValues(config('custom'), [1])
testSparseValues(config('all'), [1, 3, 5])

testSparseValues(config('custom', [0]), [1])
testSparseValues(config('custom', [1, 2]), [1])
testSparseValues(config('custom', [1, 2, 3]), [1, 3])
testSparseValues(config('custom', [3, 2, 1]), [1, 3])
testSparseValues(config('custom', [1, 3, 5]), [1, 3, 5])
testSparseValues(config('custom', [0, 1, 2, 3, 4, 5, 6, 7, 8]), [1, 3, 5])
