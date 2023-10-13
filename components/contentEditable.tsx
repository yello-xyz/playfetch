import { KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react'
import ReactContentEditable from 'react-contenteditable'
import sanitizeHtml from 'sanitize-html'

export default function ContentEditable({
  className,
  htmlValue,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onLoadedRef,
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
  onLoadedRef?: (node: ReactContentEditable | HTMLDivElement | null) => void
  innerRef?: RefObject<HTMLElement>
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  placeholder?: string
  disabled?: boolean
}) {
  const sanitize = (html: string) => sanitizeHtml(html, { allowedTags, allowedAttributes })

  const [rawHTML, setRawHTML] = useState(htmlValue)
  if (sanitize(htmlValue) !== sanitize(rawHTML)) {
    setRawHTML(htmlValue)
  }

  const updateRawHTML = (value: string) => {
    const allowedAndBaseTags = [...new Set([...allowedTags, 'br', 'div', 'span'])]
    setRawHTML(sanitizeHtml(value, { allowedTags: allowedAndBaseTags, allowedAttributes }))
    onChange(sanitize(value))
  }

  const ownRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const innerElement = (innerRef ?? ownRef).current
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
      innerRef={innerRef ?? ownRef}
      ref={onLoadedRef}
    />
  )
}
