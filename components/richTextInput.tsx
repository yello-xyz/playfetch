import { KeyboardEvent, RefObject, useState } from 'react'
import ContentEditable from './contentEditable'
import useFocusEndRef from '@/src/client/hooks/useFocusEndRef'

const escapeSpecialCharacters = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const unescapeSpecialCharacters = (html: string) =>
  html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

const linesToDivs = (text: string) =>
  text
    .split('\n')
    .map((line, index, lines) =>
      line.length === 0 && lines.length > 1 ? `<div><br /></div>` : index === 0 ? line : `<div>${line}<br /></div>`
    )
    .join('')

const flattenDivs = (html: string) =>
  html
    .replaceAll('<div></div>', '')
    .replace(/<div><div>(.*)<\/div><\/div>/g, '<div>$1</div>')
    .replace(/<div><div>(.*)<\/div>(.*)<\/div>/g, '<div>$1</div><div>$2</div>')
    .replace(/<div>(.*)<div>(.*)<\/div><\/div>/g, '<div>$1</div><div>$2</div>')

const divsToLines = (html: string) => {
  let flattened = html
  while (flattened !== (flattened = flattenDivs(flattened))) {}
  flattened = flattened
    .replaceAll('\n', '<br />')
    .replaceAll('<br /></div>', '</div>')
    .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
  const matches = [...flattened.matchAll(/(.*?)<div>(.*?)<\/div>/g)]
  const divs = matches.map(match => match[0]).join('')
  const end = flattened.indexOf(divs) + divs.length
  return [
    ...matches.flatMap(match => (match[1].length ? [match[1], match[2]] : [match[2]])),
    ...(end <= flattened.length - 1 ? [flattened.substring(end)] : []),
  ]
    .join('\n')
    .replaceAll('<br />', '\n')
}

export const RichTextToHTML = (text: string) => linesToDivs(escapeSpecialCharacters(text))

export const RichTextFromHTML = (html: string) => unescapeSpecialCharacters(divsToLines(html))

export default function RichTextInput({
  className,
  value,
  setValue,
  onFocus,
  onBlur,
  onKeyDown,
  focusOnLoad,
}: {
  className?: string
  value: string
  setValue: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (event: KeyboardEvent) => void
  focusOnLoad?: boolean
}) {
  const [htmlValue, setHTMLValue] = useState('')
  if (value !== RichTextFromHTML(htmlValue)) {
    setHTMLValue(RichTextToHTML(value))
  }
  const updateHTMLValue = (html: string) => {
    setHTMLValue(html)
    setValue(RichTextFromHTML(html))
  }

  const innerRef = useFocusEndRef(!!focusOnLoad)

  return (
    <ContentEditable
      className={className}
      htmlValue={htmlValue}
      onChange={updateHTMLValue}
      allowedTags={['br', 'div']}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      innerRef={innerRef}
    />
  )
}
