import { SelectInputRows } from '@/src/client/inputRows'
import { InputValues, TestConfig } from '@/types'

test('No inputs yields single empty prompt input', () =>
  expect(SelectInputRows({}, [], { rowIndices: [] })[0]).toStrictEqual([{}]))

test('Inputs without values yield single empty prompt input', () =>
  expect(SelectInputRows({}, ['a', 'b'], { rowIndices: [] })[0]).toStrictEqual([{}]))

const testRowSelection = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  config: TestConfig | undefined,
  expectedIndices: number[]
) =>
  test(testDescription, () => expect(SelectInputRows(inputValues, variables, config)[1]).toStrictEqual(expectedIndices))

const testDefaultSelection = (
  testDescription: string,
  inputValues: InputValues,
  variables: string[],
  expectedIndices: number[]
) => {
  testRowSelection(testDescription, inputValues, variables, { rowIndices: [] }, expectedIndices)
  testRowSelection(`${testDescription} (all)`, inputValues, variables, undefined, expectedIndices)
}

testDefaultSelection('Test empty input', {}, [], [])
testDefaultSelection('Test empty input with variables', {}, ['a', 'b', 'c'], [])
testDefaultSelection('Test single input without values', { var1: [] }, ['var1'], [])
testDefaultSelection('Test single input without variables', { var1: ['value1'] }, [], [])
testDefaultSelection('Test single input with different variables', { var1: ['value1'] }, ['var2'], [])
testDefaultSelection('Test single input with single variable', { var1: ['value1'] }, ['var1'], [0])
testDefaultSelection('Test single input with additional variables', { var1: ['value1'] }, ['var1', 'var2'], [0])

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

testSparseValues({ rowIndices: [] }, [1])
testSparseValues(undefined, [1, 3, 5])

testSparseValues({ rowIndices: [0]  }, [1])
testSparseValues({ rowIndices: [1, 2]  }, [1])
testSparseValues({ rowIndices: [1, 2, 3]  }, [1, 3])
testSparseValues({ rowIndices: [3, 2, 1]  }, [1, 3])
testSparseValues({ rowIndices: [1, 3, 5]  }, [1, 3, 5])
testSparseValues({ rowIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8]  }, [1, 3, 5])
