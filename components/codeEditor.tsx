import { useEffect, useRef, useState } from 'react'
import { basicSetup } from 'codemirror'
import { EditorView, ViewUpdate } from '@codemirror/view'

function useCodeMirror(extensions: any[] = []) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView>()

  useEffect(() => {
    const view = new EditorView({
      extensions: [basicSetup, ...extensions],
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

type OnChange = (value: string, viewUpdate: ViewUpdate) => void

const onUpdate = (onChange: OnChange) =>
  EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const doc = viewUpdate.state.doc
      const value = doc.toString()
      onChange(value, viewUpdate)
    }
  })

function useCodeEditor({ value, onChange, extensions }: { value: string; onChange: OnChange; extensions: any[] }) {
  const { ref, view } = useCodeMirror([onUpdate(onChange), ...extensions])

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

  return ref
}

export default function CodeEditor({
  value,
  onChange,
  extensions,
}: {
  value: string
  onChange: OnChange
  extensions: any[]
}) {
  const ref = useCodeEditor({ value, onChange, extensions })

  return <div ref={ref} />
}
