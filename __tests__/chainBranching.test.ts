import {
  IsSiblingNode,
  ShiftDown,
  ShiftRight,
  SplitNodes,
  SubtreeForBranchOfNode,
  SubtreeForNode,
} from '@/src/common/branching'
import { ChainItem } from '@/types'

const chain: ChainItem[] = [
  { branch: 0, code: '0 [A0]' },
  { branch: 0, code: '1 [B0]', branches: ['0', '1', '4'] },
  { branch: 0, code: '2 [C0]' },
  { branch: 1, code: '3 [C1]', branches: ['1', '2', '3'] },
  { branch: 4, code: '4 [C4]' },
  { branch: 0, code: '5 [D0]' },
  { branch: 1, code: '6 [D1]' },
  { branch: 3, code: '7 [D3]' },
]

const getChainItems = (indexes: number[]) => indexes.map(index => chain[index])
const expectItemsToBe = (items: ChainItem[], expected: number[]) => expect(items).toStrictEqual(getChainItems(expected))

const testSibling = (index: number, isSibling: boolean) =>
  test(`Node at position ${index} is${isSibling ? '' : 'not '} a sibling`, () =>
    expect(IsSiblingNode(chain, index)).toBe(isSibling))

testSibling(0, false)
testSibling(1, false)
testSibling(2, false)
testSibling(3, true)
testSibling(4, true)
testSibling(5, false)
testSibling(6, true)
testSibling(7, true)

const testSubtree = (index: number, expected: number[]) =>
  test(`Subtree at position ${index} is [${expected}]`, () => expectItemsToBe(SubtreeForNode(chain, index), expected))

testSubtree(0, [0, 1, 2, 3, 4, 5, 6, 7])
testSubtree(1, [1, 2, 3, 4, 5, 6, 7])
testSubtree(2, [2, 5])
testSubtree(3, [3, 6, 7])
testSubtree(4, [4])
testSubtree(5, [5])
testSubtree(6, [6])
testSubtree(7, [7])

const testBranch = (index: number, branchIndex: number, expected: number[]) =>
  test(`Branch ${branchIndex} for branch at position ${index} is [${expected}]`, () =>
    expectItemsToBe(SubtreeForBranchOfNode(chain, index, branchIndex), expected))

testBranch(1, 0, [2, 5])
testBranch(1, 1, [3, 6, 7])
testBranch(1, 2, [4])
testBranch(3, 0, [6])
testBranch(3, 1, [])
testBranch(3, 2, [7])

test('Split nodes', () =>
  expect(SplitNodes(chain)).toStrictEqual([
    getChainItems([0]),
    getChainItems([1]),
    getChainItems([2, 3, 4]),
    getChainItems([5, 6, 7]),
  ]))

const testShiftRight = (index: number, expected: number[]) =>
  test(`Shift right at position ${index} shifts [${expected}]`, () =>
    expect(ShiftRight(chain, index)).toStrictEqual(
      chain.map(node => (expected.includes(chain.indexOf(node)) ? { ...node, branch: node.branch + 1 } : node))
    ))

testShiftRight(0, [])
testShiftRight(1, [])
testShiftRight(2, [3, 4, 6, 7])
testShiftRight(3, [4])
testShiftRight(4, [])
testShiftRight(5, [3, 4, 6, 7])
testShiftRight(6, [4, 7])
testShiftRight(7, [4])

const testShiftDown = (index: number, expected = chain.map((_, index) => index)) =>
  test(`Shift down at position ${index} yields [${expected}]`, () =>
    expect(ShiftDown(chain, index)).toStrictEqual(expected.map(index => chain[index])))

testShiftDown(0)
testShiftDown(1)
testShiftDown(2, [0, 1, 3, 4, 2, 6, 7, 5])
testShiftDown(3, [0, 1, 2, 4, 5, 3, 6, 7])
testShiftDown(4, [0, 1, 2, 3, 5, 6, 7, 4])
testShiftDown(5, [0, 1, 2, 3, 4, 6, 7, 5])
testShiftDown(6, [0, 1, 2, 3, 4, 5, 7, 6])
testShiftDown(7)
