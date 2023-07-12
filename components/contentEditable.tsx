import { RefObject } from 'react'
import ReactContentEditable from 'react-contenteditable'
import sanitizeHtml from 'sanitize-html'

export default function ContentEditable({
  className,
  htmlValue,
  onChange,
  innerRef,
  allowedTags = [],
  allowedAttributes = {},
}: {
  className?: string
  htmlValue: string
  onChange: (sanitizedHTMLValue: string) => void
  innerRef?: RefObject<HTMLElement>
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
}) {
  return (
    <ReactContentEditable
      className={className}
      html={htmlValue}
      onChange={event => onChange(sanitizeHtml(event.currentTarget.innerHTML, { allowedTags, allowedAttributes }))}
      innerRef={innerRef}
    />
  )
}
