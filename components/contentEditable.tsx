import { RefObject, useState } from 'react'
import ReactContentEditable from 'react-contenteditable'
import sanitizeHtml from 'sanitize-html'

export default function ContentEditable({
  className,
  htmlValue,
  onChange,
  innerRef,
  allowedTags = [],
  allowedAttributes = {},
  disabled,
}: {
  className?: string
  htmlValue: string
  onChange: (sanitizedHTMLValue: string) => void
  innerRef?: RefObject<HTMLElement>
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  disabled?: boolean
}) {
  const sanitize = (html: string) => sanitizeHtml(html, { allowedTags, allowedAttributes })

  const [rawHTML, setRawHTML] = useState(htmlValue)
  if (sanitize(htmlValue) !== sanitize(rawHTML)) {
    setRawHTML(htmlValue)
  }

  const updateRawHTML = (value: string) => {
    const baseTags = ['br', 'div', 'span']
    setRawHTML(sanitizeHtml(value, { allowedTags: baseTags }))
    onChange(sanitize(value))
  }

  return (
    <ReactContentEditable
      disabled={disabled}
      className={className}
      html={rawHTML}
      onChange={event => updateRawHTML(event.currentTarget.innerHTML)}
      innerRef={innerRef}
    />
  )
}
