import PromptInput from '../prompts/promptInput'
import { SingleTabHeader } from '../tabSelector'
import branchIcon from '@/public/branch.svg'
import { BranchChainItem } from '@/types'
import TextInput from '../textInput'
import Button from '../button'
import { Fragment } from 'react'

export default function BranchNodeEditor({
  item,
  updateItem,
}: {
  item: BranchChainItem
  updateItem: (item: BranchChainItem) => void
}) {
  const updateCode = (code: string) => updateItem({ ...item, code })
  const updateBranches = (branches: string[]) => updateItem({ ...item, branches })

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
            {item.branches.map((branch, index, branches) => (
              <Fragment key={index}>
                <span className='pl-2 font-medium'>Branch {index + 1}</span>
                <TextInput
                  placeholder={`Name of branch ${index + 1}${
                    index === 0 ? ' (e.g. left)' : index === 1 ? ' (e.g. right)' : ''
                  }`}
                  value={branch}
                  setValue={value => updateBranches([...branches.slice(0, index), value, ...branches.slice(index + 1)])}
                />
                {showDeleteButtons && (
                  <Button
                    type='destructive'
                    onClick={() => updateBranches([...branches.slice(0, index), ...branches.slice(index + 1)])}>
                    Delete
                  </Button>
                )}
              </Fragment>
            ))}
            <Button type='outline' onClick={() => updateBranches([...item.branches, ''])}>
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
