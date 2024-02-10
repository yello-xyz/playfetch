import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export default function DiffPane({ leftContent, rightContent }: { leftContent: string; rightContent: string }) {
  return (
    <div className='border-b border-gray-200'>
      <ReactDiffViewer
        oldValue={leftContent || 'empty'}
        newValue={rightContent || 'empty'}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        showDiffOnly={false}
        useDarkTheme={false}
        styles={{
          variables: {
            light: {
              addedBackground: '#DDF1E7',
              addedGutterBackground: '#C0E2CF',
              removedBackground: '#FDE5E0',
              removedGutterBackground: '#F4BBAF',
            },
          },
          contentText: { fontFamily: 'var(--font-inter)' },
          wordAdded: { borderRadius: '0', padding: '0', lineHeight: '100%', background: '#C0E2CF' },
          wordRemoved: { borderRadius: '0', padding: '0', lineHeight: '100%', background: '#F4BBAF' },
        }}
      />
    </div>
  )
}
