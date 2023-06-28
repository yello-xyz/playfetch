import { MouseEvent } from 'react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { ContentEditableEvent } from 'react-contenteditable'
import { FocusEvent } from 'react'
import { useRef } from 'react'
import { HiCodeBracketSquare } from 'react-icons/hi2'
import Label from './label'
import { ExtractPromptVariables } from '@/common/formatting'

export default function PromptInput({
  prompt,
  setPrompt,
  showInputs,
}: {
  prompt: string
  setPrompt: (prompt: string) => void
  showInputs?: boolean
}) {
  const styling = 'class="text-white rounded px-1 py-0.5 bg-violet-500 font-normal"'
  const contentEditableRef = useRef<HTMLElement>(null)
  const htmlContent = prompt
    .replaceAll(/{{([^{]*?)}}/g, `<b ${styling}>$1</b>`)
    .replaceAll(/\n(.*)$/gm, '<div>$1</div>')
    .replaceAll('<div></div>', '<div><br /></div>')

  const updateHTMLContent = (event: ContentEditableEvent | FocusEvent) => {
    setPrompt(
      sanitizeHtml(event.currentTarget.innerHTML, {
        allowedTags: ['br', 'div', 'b'],
        allowedAttributes: { b: ['class'] },
      })
        .replaceAll('<br />', '')
        .replaceAll(/<div>(.*?)<\/div>/g, '\n$1')
        .replaceAll(/<b[^>]*>(.*?)<\/b>/g, '{{$1}}')
        .replaceAll('{{}}', '')
        .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
        .replaceAll(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
        .replaceAll(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')
    )
  }

  const inputs = ExtractPromptVariables(prompt)

  const extractVariable = () => {
    const selection = window.getSelection()?.toString()?.trim()
    if (selection && selection.length > 0) {
      if (inputs.includes(selection)) {
        setPrompt(prompt.replaceAll(`{{${selection}}}`, selection))
      } else {
        setPrompt(prompt.replaceAll(selection, `{{${selection}}}`))
      }
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center block gap-2 mb-1'>
        <Label onClick={() => contentEditableRef.current?.focus()}>Prompt</Label>
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
