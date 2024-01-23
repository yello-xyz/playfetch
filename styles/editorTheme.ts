import { EditorView } from '@codemirror/view'
import { TagStyle } from '@codemirror/language'
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500', '600'] })

const EditorTheme = (preformatted: boolean, bordered: boolean, tokenStyle?: TagStyle) =>
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
    '.cm-tooltip-autocomplete': {
      padding: '4px 8px',
      backgroundColor: '#DCEAFA',
      border: '1px solid #E3E6E9',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete ul li': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'start',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'transparent' },
    '.cm-tooltip-autocomplete .cm-completionLabel': {
      ...tokenStyle,
      tag: null,
      backgroundColor: '#F4B8EE',
      fontFamily: preformatted ? mono.style.fontFamily : inter.style.fontFamily,
    },
    '.cm-tooltip-autocomplete li[aria-selected] .cm-completionLabel': { backgroundColor: '#E14BD2' },
  })

export default EditorTheme
