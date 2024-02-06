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
import { CompletionContext, autocompletion } from '@codemirror/autocomplete'
import EditorTheme from '@/styles/editorTheme'

const buildCompletions = (regexp: RegExp, completions: string[] | undefined) =>
  completions
    ? [
        (context: CompletionContext) => {
          const word = context.matchBefore(regexp)
          return word && word.from !== word.to
            ? { from: word.from, options: completions.map(completion => ({ label: completion })) }
            : null
        },
      ]
    : []

export default function Editor({
  value,
  setValue,
  tokenizer,
  tokenStyle,
  variables,
  completions,
  setExtractSelection,
  className = '',
  placeholder,
  disabled = false,
  preformatted = false,
  bordered = true,
  initialCursorLocation,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  value: string
  setValue: (value: string) => void
  tokenizer?: (stream: StringStream) => string
  tokenStyle?: TagStyle
  variables?: string[]
  completions?: string[]
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
  initialCursorLocation?: { x: number; y: number }
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

  const autocomplete = useMemo(
    () =>
      variables || completions
        ? autocompletion({
            activateOnTyping: true,
            icons: false,
            override: [
              ...buildCompletions(
                /{[^}]*}?/,
                variables?.map(v => `{{${v}}}`)
              ),
              ...buildCompletions(/\w*/, completions),
            ],
          })
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const extensions = useMemo(
    () => [
      ...(tokenizer ? [StreamLanguage.define({ token: tokenizer })] : []),
      ...(autocomplete ? [autocomplete] : []),
      ...(tokenStyle ? [syntaxHighlighting(HighlightStyle.define([tokenStyle]))] : []),
      ...(preformatted ? [lineNumbers()] : []),
      EditorView.lineWrapping,
      placeholderText(placeholder ?? ''),
      EditorView.editable.of(!disabled),
      EditorTheme(preformatted, bordered, tokenStyle),
      onUpdate,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
    ],
    [tokenizer, tokenStyle, disabled, placeholder, preformatted, bordered, onUpdate, autocomplete]
  )

  useEffect(() => {
    const view = new EditorView({ extensions, parent: ref?.current ?? undefined })

    setView(view)
    setTimeout(() => {
      view.focus()
      if (initialCursorLocation) {
        const anchor = view.posAtCoords(initialCursorLocation)
        if (anchor) {
          view.dispatch({ selection: { anchor } })
        }
      }
    })

    return () => {
      view.destroy()
      setView(undefined)
    }
  }, [extensions, initialCursorLocation])

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
