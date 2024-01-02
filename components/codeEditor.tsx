import { useEffect, useRef, useState } from 'react'
import { EditorView, ViewUpdate } from '@codemirror/view'
import { StringStream, StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Inter } from 'next/font/google'
import { tags } from '@lezer/highlight'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

type OnChange = (value: string, viewUpdate: ViewUpdate) => void

function useCodeMirror(setValue: OnChange) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView>()

  const onUpdate = (onChange: OnChange) =>
    EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
      if (viewUpdate.docChanged) {
        onChange(viewUpdate.state.doc.toString(), viewUpdate)
      }
    })

  const editorTheme = EditorView.theme({
    '.cm-content': { fontFamily: inter.style.fontFamily },
    '&.cm-focused': { outline: '1px solid #3B8CEB', borderRadius: '8px' },
  })

  const promptLanguage = {
    name: 'prompt',
    token: function (stream: StringStream) {
      var ch = stream.next()
      if (ch === '{' && stream.match(/^{([^}])*}}/)) {
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

  useEffect(() => {
    const view = new EditorView({
      extensions: [
        EditorView.lineWrapping,
        onUpdate(setValue),
        editorTheme,
        StreamLanguage.define(promptLanguage),
        syntaxHighlighting(highlightStyle),
      ],
      parent: ref?.current ?? undefined,
    })

    setView(view)

    return () => {
      view.destroy()
      setView(undefined)
    }
  }, [])

  return { ref, view }
}

export default function CodeEditor({ value, setValue }: { value: string; setValue: OnChange }) {
  const { ref, view } = useCodeMirror(setValue)

  useEffect(() => {
    if (view) {
      const editorValue = view.state.doc.toString()

      if (value !== editorValue) {
        view.dispatch({
          changes: {
            from: 0,
            to: editorValue.length,
            insert: value || '',
          },
        })
      }
    }
  }, [value, view])

  return <div ref={ref} />
}
