import { MouseEvent } from 'react'

export default function RunCellBody({
  identifier,
  output,
  selectionRanges,
  onSelectComment,
}: {
  identifier: string
  output: string
  selectionRanges: { startIndex: number; endIndex: number }[]
  onSelectComment: (event: MouseEvent, startIndex: number) => void
}) {
  const spans = []

  let index = 0
  for (const { startIndex, endIndex } of selectionRanges.sort((a, b) => a.startIndex - b.startIndex)) {
    if (startIndex < index) {
      continue
    }
    if (startIndex > index) {
      spans.push(<span key={index}>{output.substring(index, startIndex)}</span>)
    }
    spans.push(
      <span
        key={startIndex}
        className='underline cursor-pointer bg-blue-50 decoration-blue-100 decoration-2 underline-offset-2'
        onClick={event => onSelectComment(event, startIndex)}>
        {output.substring(startIndex, endIndex)}
      </span>
    )
    index = endIndex
  }
  if (index < output.length) {
    spans.push(<span key={index}>{output.substring(index)}</span>)
  }

  return (
    <div className='flex-1' id={identifier}>
      {spans}
    </div>
  )
}
