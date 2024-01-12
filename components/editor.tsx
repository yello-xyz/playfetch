import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { EditorView, ViewUpdate, placeholder as placeholderText, lineNumbers, keymap } from '@codemirror/view'
import {
  StringStream,
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
  syntaxTree,
  TagStyle,
} from '@codemirror/language'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500', '600'] })

const editorTheme = (preformatted: boolean, bordered: boolean) =>
  EditorView.theme({
    '&': {
      ...(bordered ? { border: '1px solid #CFD3D8', borderRadius: '8px' } : {}),
      overflowY: 'auto',
      height: '100%',
    },
    '&.cm-focused': { outline: 'none', ...(bordered ? { border: '1px solid #3B8CEB', borderRadius: '8px' } : {}) },
    '.cm-content': {
      fontFamily: preformatted ? mono.style.fontFamily : inter.style.fontFamily,
      color: preformatted ? '#71B892' : '#333A46',
      padding: '6px 10px',
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

export default function Editor({
  value,
  setValue,
  tokenizer,
  tokenStyle,
  setExtractSelection,
  className = '',
  placeholder,
  disabled = false,
  preformatted = false,
  bordered = true,
  focusOnLoad = true,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  value: string
  setValue: (value: string) => void
  tokenizer?: (stream: StringStream) => string
  tokenStyle?: TagStyle
  setExtractSelection?: (
    extractSelection: () => (tokenType: string) => {
      root: Node
      text: string
      from: number
      to: number
      isToken: boolean
    }
  ) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
  bordered?: boolean
  focusOnLoad?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView>()

  const onUpdate = useMemo(
    () =>
      EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
        if (viewUpdate.docChanged) {
          setValue(viewUpdate.state.doc.toString())
        } else if (viewUpdate.focusChanged) {
          if (viewUpdate.view.hasFocus) {
            onFocus?.()
          } else {
            onBlur?.()
          }
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const extensions = useMemo(
    () => [
      ...(tokenizer ? [StreamLanguage.define({ token: tokenizer })] : []),
      ...(tokenStyle ? [syntaxHighlighting(HighlightStyle.define([tokenStyle]))] : []),
      ...(preformatted ? [lineNumbers()] : []),
      EditorView.lineWrapping,
      placeholderText(placeholder ?? ''),
      EditorView.editable.of(!disabled),
      editorTheme(preformatted, bordered),
      onUpdate,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
    ],
    [tokenizer, tokenStyle, disabled, placeholder, preformatted, bordered, onUpdate]
  )

  useEffect(() => {
    const view = new EditorView({ extensions, parent: ref?.current ?? undefined })

    setView(view)
    if (focusOnLoad) {
      setTimeout(() => view.focus())
    }

    return () => {
      view.destroy()
      setView(undefined)
    }
  }, [extensions, focusOnLoad])

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
      setExtractSelection(() => (tokenType: string) => {
        const state = view.state
        const selection = state.selection.main
        const tree = syntaxTree(state)
        const node = tree.resolve(selection.anchor, -1)
        const isToken = node.type.name === tokenType
        const from = isToken ? node.from : selection.from
        const to = isToken ? node.to : selection.to
        return { root: view.dom, isToken, text: view.state.sliceDoc(from, to).toString(), from, to }
      })
    }
  }, [view, setExtractSelection])

  return <div className={`flex-1 min-h-0 ${className}`} ref={ref} onKeyDown={onKeyDown} />
}
