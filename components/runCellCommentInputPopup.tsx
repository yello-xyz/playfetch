import Icon from './icon'
import commentIcon from '@/public/comment.svg'

type Selection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

export default function RunCellCommentInputPopup({
  selection,
  onUpdateSelectionForComment,
  containerRect,
}: {
  selection: Selection
  onUpdateSelectionForComment: (selection?: Selection) => void
  containerRect: DOMRect
}) {
  return (
    <div
      className='absolute flex items-center justify-center overflow-visible text-center max-w-0'
      style={{
        top: selection.popupPoint.y - containerRect.top,
        left: Math.max(40, selection.popupPoint.x - containerRect.left),
      }}>
      <div className='p-1 bg-white rounded-lg shadow' onMouseDown={event => event.stopPropagation()}>
        <div
          className='flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-gray-100'
          onMouseDown={() => onUpdateSelectionForComment(selection)}>
          <Icon className='max-w-[24px]' icon={commentIcon} />
          <div>Comment</div>
        </div>
      </div>
    </div>
  )
}
