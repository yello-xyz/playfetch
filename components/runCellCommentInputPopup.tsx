import Icon from './icon'
import commentIcon from '@/public/comment.svg'
import { CommentInput } from './commentPopupMenu'

type Selection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

export default function RunCellCommentInputPopup({
  selection,
  selectionForComment,
  versionID,
  runID,
  onClose,
  onUpdateSelectionForComment,
  scrollTop,
}: {
  selection?: Selection
  selectionForComment?: Selection
  versionID: number
  runID: number
  onClose: () => void
  onUpdateSelectionForComment: (selection?: Selection) => void
  scrollTop: number
}) {
  return (
    <div
      className='absolute flex items-center justify-center overflow-visible text-center max-w-0'
      style={{
        top: (selection || selectionForComment)!.popupPoint.y - scrollTop,
        left: (selection || selectionForComment)!.popupPoint.x,
      }}>
      <div className='p-1 bg-white rounded-lg shadow' onMouseDown={event => event.stopPropagation()}>
        {selectionForComment ? (
          <div className='px-1 w-80'>
            <CommentInput
              versionID={versionID}
              selection={selectionForComment.text}
              runID={runID}
              startIndex={selectionForComment.startIndex}
              callback={onClose}
              focus
            />
          </div>
        ) : (
          <div
            className='flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-gray-100'
            onMouseDown={() => onUpdateSelectionForComment(selection)}>
            <Icon className='max-w-[24px]' icon={commentIcon} />
            <div>Comment</div>
          </div>
        )}
      </div>
    </div>
  )
}
