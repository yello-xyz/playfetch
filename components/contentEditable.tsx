import { KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react'
import ReactContentEditable from 'react-contenteditable'
import sanitizeHtml from 'sanitize-html'

const isEmptyTextNode = (node: Node) => node.textContent?.length === 0

const getCharacterCount = (node: Node, sentinel?: Node): number => {
  if (node === sentinel) {
    return 0
  } else if (node.nodeType === Node.TEXT_NODE || node.childNodes.length === 0) {
    return isEmptyTextNode(node) ? 1 : node.textContent?.length ?? 0
  } else {
    const children = node.childNodes
    let count = 0
    for (let i = 0; i < children.length; i++) {
      if (sentinel && children[i].contains(sentinel)) {
        return count + getCharacterCount(children[i], sentinel)
      }
      count += getCharacterCount(children[i])
    }
    return count
  }
}

const getCursorPosition = (node: Node): number => {
  const selection = node.ownerDocument?.getSelection()
  if (selection && selection.rangeCount === 1) {
    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      const selectionNode = selection.anchorNode
      if (selectionNode && node.contains(selectionNode)) {
        return getCharacterCount(node, selectionNode) + range.startOffset
      }
    }
  }
  return -1
}

const setCursorPosition = (node: Node, position: number): void => {
  if (node.nodeType === Node.TEXT_NODE || node.childNodes.length === 0) {
    const range = document.createRange()
    range.selectNode(node)
    range.setStart(node, 0)
    range.setEnd(node, position)
    range.collapse(false)
    const selection = node.ownerDocument?.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  } else {
    const children = node.childNodes
    for (let i = 0; i < children.length; i++) {
      const count = getCharacterCount(children[i])
      if (isEmptyTextNode(children[i]) ? count > position : count >= position) {
        return setCursorPosition(children[i], position)
      }
      position -= count
    }
  }
}

const withPersistedCursor = (node: Node | null, action: () => void) => {
  const beforePosition = node ? getCursorPosition(node) : -1
  action()
  if (node && beforePosition >= 0) {
    setTimeout(() => {
      const afterPosition = getCursorPosition(node)
      if (beforePosition >= 0 && afterPosition >= 0 && afterPosition !== beforePosition) {
        setCursorPosition(node, beforePosition)
      }
    })
  }
}

export default function ContentEditable({
  className,
  htmlValue,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  innerRef,
  allowedTags = [],
  allowedAttributes = {},
  placeholder,
  disabled,
}: {
  className?: string
  htmlValue: string
  onChange: (sanitizedHTMLValue: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (event: KeyboardEvent) => void
  innerRef?: RefObject<HTMLElement>
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  placeholder?: string
  disabled?: boolean
}) {
  const ownRef = useRef<HTMLElement>(null)
  const ref = innerRef ?? ownRef

  const sanitize = (html: string) => sanitizeHtml(html, { allowedTags, allowedAttributes })

  const [rawHTML, setRawHTML] = useState(htmlValue)
  if (sanitize(htmlValue) !== sanitize(rawHTML)) {
    setRawHTML(htmlValue)
  }

  const updateRawHTML = (value: string) => {
    const allowedAndBaseTags = [...new Set([...allowedTags, 'br', 'div', 'span'])]
    withPersistedCursor(ref.current, () =>
      setRawHTML(sanitizeHtml(value, { allowedTags: allowedAndBaseTags, allowedAttributes }))
    )
    onChange(sanitize(value))
  }

  useEffect(() => {
    const innerElement = ref.current
    if (innerElement && onFocus) {
      innerElement.onfocus = onFocus
    }
    if (innerElement && onBlur) {
      innerElement.onblur = onBlur
    }
    if (innerElement && onKeyDown) {
      innerElement.onkeydown = onKeyDown as any
    }
  }, [innerRef, onFocus, onBlur, onKeyDown])

  return (
    <ReactContentEditable
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      html={rawHTML}
      onChange={event => updateRawHTML(event.currentTarget.innerHTML)}
      innerRef={ref}
    />
  )
}
