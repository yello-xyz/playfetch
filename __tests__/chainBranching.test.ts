import { CanChainNodeIncludeContext, SubtreeForChainNode } from '@/components/chains/chainNode'
import {
  FirstBranchForBranchOfNode,
  IsSiblingNode,
  LoopCompletionIndexForNode,
  MaxBranch,
  PruneBranchAndShiftLeft,
  PruneNodeAndShiftUp,
  ShiftDown,
  ShiftRight,
  ShouldBranchLoopOnCompletion,
  SplitNodes,
  SubtreeForBranchOfNode,
  SubtreeForNode,
} from '@/src/common/branching'
import { ChainItem } from '@/types'

const chain1: ChainItem[] = [
  { branch: 0, code: '0 [A0]', promptID: 1 },
  { branch: 0, code: '1 [B0]', branches: ['0', '1', '4'], loops: [1, 2] },
  { branch: 0, code: '2 [C0]', promptID: 2 },
  { branch: 1, code: '3 [C1]', branches: ['1', '2', '3'], loops: [1] },
  { branch: 4, code: '4 [C4]', promptID: 3 },
  { branch: 0, code: '5 [D0]' },
  { branch: 1, code: '6 [D1]' },
  { branch: 3, code: '7 [D3]' },
]

const chain2: ChainItem[] = [
  { branch: 0, code: '0 [A0]', branches: ['0', '2'] },
  { branch: 0, code: '1 [B0]', branches: ['0', '1'], promptID: 1 },
  { branch: 2, code: '2 [B2]' },
  { branch: 0, code: '3 [C0]', promptID: 2 },
]

const chain3: ChainItem[] = [{ branch: 0, code: '0 [A0]', branches: ['0', '1', '2'] }]

const chain4: ChainItem[] = [
  { branch: 0, code: '0 [A0]', branches: ['0', '2'] },
  { branch: 0, code: '1 [B0]', branches: ['0', '1'] },
]

const getChainItems = (indexes: number[], chain = chain1) => indexes.map(index => chain[index])
const expectItemsToBe = (items: ChainItem[], expected: number[], chain = chain1) =>
  expect(items).toStrictEqual(getChainItems(expected, chain))

const testSibling = (index: number, isSibling: boolean) =>
  test(`Node at position ${index} is ${isSibling ? '' : 'not'} a sibling`, () =>
    expect(IsSiblingNode(chain1, index)).toBe(isSibling))

testSibling(0, false)
testSibling(1, false)
testSibling(2, false)
testSibling(3, true)
testSibling(4, true)
testSibling(5, false)
testSibling(6, true)
testSibling(7, true)
testSibling(8, false)

const testLoopBranchOnCompletion = (branch: number, shouldLoop: boolean) =>
  test(`Branch ${branch} should ${shouldLoop ? '' : 'not'} loop on completion`, () =>
    expect(ShouldBranchLoopOnCompletion(chain1, branch)).toBe(shouldLoop))

testLoopBranchOnCompletion(0, false)
testLoopBranchOnCompletion(1, true)
testLoopBranchOnCompletion(2, true)
testLoopBranchOnCompletion(3, false)
testLoopBranchOnCompletion(4, true)
testLoopBranchOnCompletion(5, false)

const testLoopIndex = (index: number, branch: number, expectedIndex: number) =>
  test(`Loop completion index for node at position ${index} on branch ${branch} is node at position ${expectedIndex}`, () =>
    expect(LoopCompletionIndexForNode(chain1, index, branch)).toBe(expectedIndex))

testLoopIndex(0, 0, -1)
testLoopIndex(1, 0, -1)
testLoopIndex(1, 1, -1)
testLoopIndex(1, 4, -1)
testLoopIndex(2, 0, -1)
testLoopIndex(3, 1, -1)
testLoopIndex(3, 2, 3)
testLoopIndex(3, 3, -1)
testLoopIndex(4, 4, 1)
testLoopIndex(5, 0, -1)
testLoopIndex(6, 1, 1)
testLoopIndex(7, 3, -1)
testLoopIndex(8, 0, -1)

const testSubtree = (index: number, expected: number[], includingRoot = true) =>
  test(`Subtree at position ${index}${includingRoot ? ' including root' : ''} is [${expected}]`, () =>
    expectItemsToBe(SubtreeForNode(chain1, index, includingRoot), expected))

testSubtree(0, [0, 1, 2, 3, 4, 5, 6, 7])
testSubtree(1, [1, 2, 3, 4, 5, 6, 7])
testSubtree(2, [2, 5])
testSubtree(3, [3, 6, 7])
testSubtree(4, [4])
testSubtree(5, [5])
testSubtree(6, [6])
testSubtree(7, [7])
testSubtree(8, [])

const testSubtreeExcludingRoot = (index: number, expected: number[]) => testSubtree(index, expected, false)

testSubtreeExcludingRoot(0, [1, 2, 3, 4, 5, 6, 7])
testSubtreeExcludingRoot(1, [2, 3, 4, 5, 6, 7])
testSubtreeExcludingRoot(2, [5])
testSubtreeExcludingRoot(3, [6, 7])
testSubtreeExcludingRoot(4, [])
testSubtreeExcludingRoot(5, [])
testSubtreeExcludingRoot(6, [])
testSubtreeExcludingRoot(7, [])
testSubtreeExcludingRoot(8, [])

const testLoopedChainSubtree = (index: number, expected: number[], includingRoot = true) =>
  test(`Looped chain subtree at position ${index}${includingRoot ? ' including root' : ''} is [${expected}]`, () =>
    expectItemsToBe(SubtreeForChainNode(chain1[index], chain1, includingRoot, true), expected))

testLoopedChainSubtree(0, [0, 1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtree(1, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtree(2, [2, 5])
testLoopedChainSubtree(3, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtree(4, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtree(5, [5])
testLoopedChainSubtree(6, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtree(7, [7])

const testLoopedChainSubtreeExcludingRoot = (index: number, expected: number[]) =>
  testLoopedChainSubtree(index, expected, false)

testLoopedChainSubtreeExcludingRoot(0, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtreeExcludingRoot(1, [2, 3, 4, 5, 6, 7])
testLoopedChainSubtreeExcludingRoot(2, [5])
testLoopedChainSubtreeExcludingRoot(3, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtreeExcludingRoot(4, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtreeExcludingRoot(5, [])
testLoopedChainSubtreeExcludingRoot(6, [1, 2, 3, 4, 5, 6, 7])
testLoopedChainSubtreeExcludingRoot(7, [])

const testIncludeContext = (index: number, expected: boolean, chain = chain1) =>
  test(`Item at position ${index} ${expected ? 'can' : 'cannot'} include previous prompt context`, () =>
    expect(CanChainNodeIncludeContext(chain[index], chain)).toBe(expected))

testIncludeContext(0, false)
testIncludeContext(1, false)
testIncludeContext(2, true)
testIncludeContext(3, false)
testIncludeContext(4, true)
testIncludeContext(5, false)
testIncludeContext(6, false)
testIncludeContext(7, false)

testIncludeContext(0, false, chain2)
testIncludeContext(1, false, chain2)
testIncludeContext(2, false, chain2)
testIncludeContext(3, true, chain2)

const testMaxBranch = (index: number, expected: number, chain = chain1) =>
  test(`Max branch for subtree at position ${index} is ${expected}`, () =>
    expect(MaxBranch(SubtreeForNode(chain, index))).toBe(expected))

testMaxBranch(0, 4)
testMaxBranch(1, 4)
testMaxBranch(2, 0)
testMaxBranch(3, 3)
testMaxBranch(4, 4)
testMaxBranch(5, 0)
testMaxBranch(6, 1)
testMaxBranch(7, 3)

testMaxBranch(0, 2, chain2)
testMaxBranch(1, 1, chain2)
testMaxBranch(2, 2, chain2)
testMaxBranch(3, 0, chain2)

testMaxBranch(0, 2, chain3)

testMaxBranch(0, 2, chain4)
testMaxBranch(1, 1, chain4)

const testBranch = (index: number, branchIndex: number, expected: number[], chain = chain1) =>
  test(`Branch ${branchIndex} for branch at position ${index} is [${expected}]`, () =>
    expectItemsToBe(SubtreeForBranchOfNode(chain, index, branchIndex), expected, chain))

testBranch(1, 0, [2, 5])
testBranch(1, 1, [3, 6, 7])
testBranch(1, 2, [4])
testBranch(3, 0, [6])
testBranch(3, 1, [])
testBranch(3, 2, [7])

testBranch(0, 0, [1, 3], chain2)
testBranch(0, 1, [2], chain2)
testBranch(1, 0, [3], chain2)
testBranch(1, 1, [], chain2)

const testBranchStart = (index: number, branchIndex: number, expected: number, chain = chain1) =>
  test(`Start of branch ${branchIndex} for branch at position ${index} is ${expected}`, () =>
    expect(FirstBranchForBranchOfNode(chain, index, branchIndex)).toBe(expected))

testBranchStart(1, 0, 0)
testBranchStart(1, 1, 1)
testBranchStart(1, 2, 4)
testBranchStart(3, 0, 1)
testBranchStart(3, 1, 2)
testBranchStart(3, 2, 3)

testBranchStart(0, 0, 0, chain2)
testBranchStart(0, 1, 2, chain2)
testBranchStart(1, 0, 0, chain2)
testBranchStart(1, 1, 1, chain2)

testBranchStart(0, 0, 0, chain3)
testBranchStart(0, 1, 1, chain3)
testBranchStart(0, 2, 2, chain3)

test('Split nodes', () =>
  expect(SplitNodes(chain1)).toStrictEqual([
    getChainItems([0]),
    getChainItems([1]),
    getChainItems([2, 3, 4]),
    getChainItems([5, 6, 7]),
  ]))

const testShiftRight = (index: number, expected: number[], branch?: number) =>
  test(`Shift right at position ${index} shifts [${expected}]`, () =>
    expect(ShiftRight(chain1, index, branch)).toStrictEqual(
      chain1.map(node => (expected.includes(chain1.indexOf(node)) ? { ...node, branch: node.branch + 1 } : node))
    ))

testShiftRight(0, [])
testShiftRight(1, [])
testShiftRight(2, [3, 4, 6, 7])
testShiftRight(3, [4])
testShiftRight(4, [])
testShiftRight(5, [3, 4, 6, 7])
testShiftRight(6, [4, 7])
testShiftRight(7, [4])
testShiftRight(8, [3, 4, 6, 7])

testShiftRight(7, [4], 3)
testShiftRight(7, [4, 7], 2)

const testPruneBranch = (
  index: number,
  branchIndex: number,
  expectDeleted: number[] = [],
  expectShifted: number[] = [],
  expectedPositions: number = 1,
  chain = chain1
) =>
  test(`Prune branch ${branchIndex} for branch at position ${index} yields [${expectDeleted}][${expectShifted}]`, () =>
    expect(PruneBranchAndShiftLeft(chain, index, branchIndex)).toStrictEqual(
      chain
        .map(node =>
          expectShifted.includes(chain.indexOf(node)) ? { ...node, branch: node.branch - expectedPositions } : node
        )
        .filter((_, index) => !expectDeleted.includes(index))
    ))

testPruneBranch(1, 0, [2, 5])
testPruneBranch(1, 1, [3, 6, 7], [4], 2)
testPruneBranch(1, 2, [4])
testPruneBranch(3, 0, [6])
testPruneBranch(3, 1)
testPruneBranch(3, 2, [7])

const testShiftDown = (index: number, expected = chain1.map((_, index) => index), chain = chain1) =>
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
testShiftDown(8)

testShiftDown(0, [0, 1, 2, 3], chain2)
testShiftDown(1, [0, 2, 1, 3], chain2)
testShiftDown(2, [0, 1, 3, 2], chain2)
testShiftDown(3, [0, 1, 2, 3], chain2)
testShiftDown(4, [0, 1, 2, 3], chain2)

const testPruneNode = (index: number, expected = chain1.map((_, index) => index), chain = chain1) =>
  test(`Prune node at position ${index} yields [${expected}]`, () =>
    expect(PruneNodeAndShiftUp(chain, index)).toStrictEqual(expected.map(index => chain[index])))

testPruneNode(0, [1, 2, 3, 4, 5, 6, 7])
testPruneNode(1, [0, 2, 3, 4, 5, 6, 7])
testPruneNode(2, [0, 1, 5, 3, 4, 6, 7])
testPruneNode(3, [0, 1, 2, 6, 7, 4, 5])
testPruneNode(4, [0, 1, 2, 3, 5, 6, 7])
testPruneNode(5, [0, 1, 2, 3, 4, 6, 7])
testPruneNode(6, [0, 1, 2, 3, 4, 5, 7])
testPruneNode(7, [0, 1, 2, 3, 4, 5, 6])
testPruneNode(8, [0, 1, 2, 3, 4, 5, 6, 7])

testPruneNode(0, [1, 2, 3], chain2)
testPruneNode(1, [0, 3, 2], chain2)
testPruneNode(2, [0, 1, 3], chain2)
testPruneNode(3, [0, 1, 2], chain2)
