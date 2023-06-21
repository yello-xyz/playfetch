import { MouseEvent } from 'react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { ContentEditableEvent } from 'react-contenteditable'
import { FocusEvent } from 'react'
import { useRef } from 'react'
import { HiCodeBracketSquare } from 'react-icons/hi2'

export default function PromptInput({
  prompt,
  setPrompt,
  showInputs,
}: {
  prompt: string
  setPrompt: (prompt: string) => void
  showInputs?: boolean
}) {
  const contentEditableRef = useRef<HTMLElement>(null)
  const htmlContent = prompt
    .replaceAll(/{{([^{]*?)}}/g, '<b>$1</b>')
    .replaceAll(/\n(.*)$/gm, '<div>$1</div>')
    .replaceAll('<div></div>', '<div><br /></div>')

  const updateHTMLContent = (event: ContentEditableEvent | FocusEvent) => {
    setPrompt(
      sanitizeHtml(event.currentTarget.innerHTML, {
        allowedTags: ['br', 'div', 'b'],
        allowedAttributes: {},
      })
        .replaceAll('<br />', '')
        .replaceAll(/<div>(.*?)<\/div>/g, '\n$1')
        .replaceAll(/<b>(.*?)<\/b>/g, '{{$1}}')
        .replaceAll('{{}}', '')
        .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
        .replaceAll(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
        .replaceAll(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')
    )
  }

  const extractVariable = (event: MouseEvent) => {
    event.preventDefault()
    document.execCommand('bold', false)
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center block gap-2 mb-1'>
        <div className='font-medium text-gray-600' onClick={() => contentEditableRef.current?.focus()}>
          Prompt
        </div>
        {showInputs && <HiCodeBracketSquare size={24} className='cursor-pointer' onMouseDown={extractVariable} />}
      </div>
      <ContentEditable
        className='p-4 text-gray-800 border border-gray-300 rounded-lg'
        onChange={updateHTMLContent}
        html={htmlContent}
        innerRef={contentEditableRef}
      />
    </div>
  )
}
