import PromptInput from '../prompts/promptInput'
import { SingleTabHeader } from '../tabSelector'
import branchIcon from '@/public/branch.svg'
import { BranchChainItem, ChainItem } from '@/types'
import TextInput from '../textInput'
import Button from '../button'
import { Fragment } from 'react'
import { ShiftRight, PruneBranchAndShiftLeft } from '@/src/common/branching'

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

  const toggleLoop = (branchIndex: number, loop: boolean) => {
    const loops = item.loops ?? []
    const updatedLoops = loop ? [...loops, branchIndex].sort((a, b) => a - b) : loops.filter(i => i !== branchIndex)
    updateItem({ ...item, loops: updatedLoops.length > 0 ? updatedLoops : undefined })
  }

  const addBranch = () => updateItem(updateBranches([...item.branches, '']), ShiftRight(items, index))

  const deleteBranch = (branchIndex: number) => {
    updateItem(
      updateBranches([...item.branches.slice(0, branchIndex), ...item.branches.slice(branchIndex + 1)]),
      PruneBranchAndShiftLeft(items, index, branchIndex)
    )
  }

  const showDeleteButtons = item.branches.length > 2
  const gridConfig = showDeleteButtons
    ? 'grid grid-cols-[120px_minmax(0,1fr)_74px_32px]'
    : 'grid grid-cols-[120px_minmax(0,1fr)_32px]'

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
                <div key={index} className='relative flex justify-center group'>
                  {branchIndex > 0 && (
                    <>
                      <input
                        type='checkbox'
                        className='cursor-pointer'
                        checked={(item.loops ?? []).includes(branchIndex)}
                        onChange={event => toggleLoop(branchIndex, event.target.checked)}
                      />
                      <div className='absolute z-10 justify-center hidden overflow-visible group-hover:flex -top-8 max-w-0'>
                        <span className='px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md whitespace-nowrap'>
                          Loop branch
                        </span>
                      </div>
                    </>
                  )}
                </div>
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
