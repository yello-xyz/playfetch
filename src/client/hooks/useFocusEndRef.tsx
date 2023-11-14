import { useEffect, useRef } from 'react'

const endRangeForNode = (node: ChildNode): Range => {
  if (node.nodeType === Node.TEXT_NODE || node.childNodes.length === 0) {
    const range = document.createRange()
    range.selectNode(node)
    range.setStart(node, 0)
    range.setEnd(node, node.textContent?.length ?? 0)
    return range
  } else {
    const childCount = node.childNodes.length
    return endRangeForNode(node.childNodes[childCount - 1])
  }
}

const moveCursorToEndOfNode = (node: ChildNode) => {
  const selection = node.ownerDocument?.getSelection()
  if (selection) {
    const range = endRangeForNode(node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export default function useFocusEndRef() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
      moveCursorToEndOfNode(ref.current)
    }
  }, [ref])

  return ref
}
