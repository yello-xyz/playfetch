import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { EditorView, ViewUpdate, placeholder as placeholderText, lineNumbers } from '@codemirror/view'
import { StringStream, StreamLanguage, HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { Inter, Roboto_Mono } from 'next/font/google'
import { tags } from '@lezer/highlight'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500', '600'] })

const editorTheme = (preformatted: boolean) =>
  EditorView.theme({
    '&': { border: '1px solid #CFD3D8', borderRadius: '8px', overflowY: 'auto', height: '100%' },
    '&.cm-focused': { outline: 'none', border: '1px solid #3B8CEB', borderRadius: '8px' },
    '.cm-content': {
      fontFamily: preformatted ? mono.style.fontFamily : inter.style.fontFamily,
      color: preformatted ? '#71B892' : '#333A46',
      padding: '6px 12px',
    },
    '.cm-line': { padding: '0px' },
    '.cm-placeholder': { color: '#B5B7BF' },
    '.cm-gutters': {
      color: '#898D96',
      backgroundColor: 'transparent',
      border: 'none',
      fontFamily: mono.style.fontFamily,
      padding: '0px 6px',
    },
  })

const promptLanguage = {
  name: 'prompt',
  token: function (stream: StringStream) {
    var ch = stream.next()
    if (ch === '{' && stream.match(/^{([^{}])*}}/)) {
      return 'variable'
    }
    stream.match(/^([^{])*/)
    return 'string'
  },
}

const highlightStyle = HighlightStyle.define([
  {
    tag: tags.variableName,
    color: 'white',
    padding: '2px 6px',
    backgroundColor: '#E14BD2',
    whitespace: 'nowrap',
    borderRadius: '4px',
  },
])

export default function Editor({
  value,
  setValue,
  setExtractSelection,
  placeholder,
  disabled = false,
  preformatted = false,
  onKeyDown
}: {
  value: string
  setValue: (value: string) => void
  setExtractSelection?: (
    extractSelection: () => () => { text: string; from: number; to: number; isVariable: boolean }
  ) => void
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView>()

  const onUpdate = useMemo(
    () =>
      EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
        if (viewUpdate.docChanged) {
          setValue(viewUpdate.state.doc.toString())
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const extensions = useMemo(
    () => [
      ...(preformatted ? [lineNumbers()] : []),
      EditorView.lineWrapping,
      placeholderText(placeholder ?? ''),
      EditorView.editable.of(!disabled),
      editorTheme(preformatted),
      StreamLanguage.define(promptLanguage),
      syntaxHighlighting(highlightStyle),
      onUpdate,
    ],
    [disabled, placeholder, preformatted, onUpdate]
  )

  useEffect(() => {
    const view = new EditorView({ extensions, parent: ref?.current ?? undefined })

    setView(view)
    setTimeout(() => view.focus())

    return () => {
      view.destroy()
      setView(undefined)
    }
  }, [extensions])

  useEffect(() => {
    if (view) {
      const editorValue = view.state.doc.toString()

      if (value !== editorValue) {
        view.dispatch({ changes: { from: 0, to: editorValue.length, insert: value || '' } })
      }
    }
  }, [value, view])

  useEffect(() => {
    if (view && setExtractSelection) {
      setExtractSelection(() => () => {
        const state = view.state
        const selection = state.selection.main
        const tree = syntaxTree(state)
        const node = tree.resolve(selection.anchor, -1)
        const isVariable = node.type.name === 'variableName'
        const from = isVariable ? node.from : selection.from
        const to = isVariable ? node.to : selection.to
        return { isVariable, text: view.state.sliceDoc(from, to).toString(), from, to }
      })
    }
  }, [view, setExtractSelection])

  return <div className='flex-1 min-h-0' ref={ref} onKeyDown={onKeyDown} />
}
