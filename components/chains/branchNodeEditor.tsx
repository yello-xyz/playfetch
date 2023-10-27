import PromptInput from '../prompts/promptInput'
import { SingleTabHeader } from '../tabSelector'
import branchIcon from '@/public/branch.svg'
import { BranchChainItem, ChainItem } from '@/types'
import TextInput from '../textInput'
import Button from '../button'
import { Fragment } from 'react'
import { ChildrenForNode, IsSiblingNode, SubtreeForNode } from '@/src/common/branching'

const placeholderSuffix = (branchIndex: number) => {
  switch (branchIndex) {
    case 0:
      return ' (e.g. left)'
    case 1:
      return ' (e.g. right)'
    default:
      return ''
  }
}

export default function BranchNodeEditor({
  index,
  items,
  updateItems,
}: {
  index: number
  items: ChainItem[]
  updateItems: (items: ChainItem[]) => void
}) {
  const item = items[index] as BranchChainItem

  const updateItem = (item: BranchChainItem, updatedItems = items) =>
    updateItems([...updatedItems.slice(0, index), item, ...updatedItems.slice(index + 1)])
  const updateCode = (code: string) => updateItem({ ...item, code })

  const updateBranches = (branches: string[]) => ({ ...item, branches })
  const updateBranchName = (branchIndex: number, name: string) =>
    updateItem(updateBranches([...item.branches.slice(0, branchIndex), name, ...item.branches.slice(branchIndex + 1)]))

  const addBranch = () =>
    updateItem(updateBranches([...item.branches, '']), shiftBranchesBeforeAddingBranch(items, index))

  const deleteBranch = (branchIndex: number) =>
    updateItem(
      updateBranches([...item.branches.slice(0, branchIndex), ...item.branches.slice(branchIndex + 1)]),
      pruneBranchBeforeDeleting(items, index, branchIndex)
    )

  const showDeleteButtons = item.branches.length > 2
  const gridConfig = showDeleteButtons
    ? 'grid grid-cols-[120px_minmax(0,1fr)_74px]'
    : 'grid grid-cols-[120px_minmax(0,1fr)]'

  return (
    <>
      <div className='flex flex-col w-full overflow-y-auto'>
        <SingleTabHeader label='Branch' icon={branchIcon} />
        <div className='flex flex-col gap-2 px-4 pt-4'>
          <span className='font-medium'>Branches</span>
          <div
            className={`${gridConfig} w-full items-center gap-2 p-4 py-4 bg-white border-gray-200 border rounded-lg`}>
            {item.branches.map((branch, branchIndex) => (
              <Fragment key={branchIndex}>
                <span className='pl-2 font-medium'>Branch {branchIndex + 1}</span>
                <TextInput
                  placeholder={`Name of branch ${branchIndex + 1}${placeholderSuffix(branchIndex)}`}
                  value={branch}
                  setValue={value => updateBranchName(branchIndex, value)}
                />
                {showDeleteButtons && (
                  <Button type='destructive' onClick={() => deleteBranch(branchIndex)}>
                    Delete
                  </Button>
                )}
              </Fragment>
            ))}
            <Button type='outline' onClick={addBranch}>
              Add Branch
            </Button>
          </div>
          <span className='font-medium mt-2.5'>JavaScript Code</span>
          <div className='min-h-[150px]'>
            <PromptInput
              placeholder={`return Math.random() < 0.5 ? 'left' : 'right'`}
              value={item.code}
              setValue={updateCode}
              preformatted
            />
          </div>
        </div>
      </div>
    </>
  )
}

const shiftBranchesBeforeAddingBranch = (items: ChainItem[], index: number) => {
  const subTree = SubtreeForNode(items, index)
  const maxSubTreeBranch = Math.max(...subTree.map(node => node.branch))
  return items.map(node => ({ ...node, branch: node.branch > maxSubTreeBranch ? node.branch + 1 : node.branch }))
}

const pruneBranchBeforeDeleting = (items: ChainItem[], index: number, branchIndex: number) => {
  const nextNodes = items.slice(index + 1)
  const children = ChildrenForNode(items, index)
  const lowerBound = children[branchIndex]?.branch ?? Infinity
  const upperBound = children[branchIndex + 1]?.branch ?? Infinity
  return [...items.slice(0, index + 1), ...nextNodes.filter(node => node.branch < lowerBound || node.branch >= upperBound)]
}
