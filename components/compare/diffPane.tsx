import { ChainVersion, PromptVersion } from '@/types'
import { PromptTab } from '../prompts/promptPanel'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

const getContent = (version: ChainVersion | PromptVersion, activePromptTab: PromptTab) => {
  switch (activePromptTab) {
    case 'main':
    case 'functions':
    case 'system':
      return version.prompts?.[activePromptTab]
    case 'settings':
      return JSON.stringify(version.config ?? {}, null, 2) // TODO: format
  }
}

export default function DiffPane({
  leftVersion,
  rightVersion,
  activePromptTab,
}: {
  leftVersion: PromptVersion | ChainVersion
  rightVersion: PromptVersion | ChainVersion
  activePromptTab: PromptTab
}) {
  const leftContent = leftVersion ? getContent(leftVersion, activePromptTab) : undefined
  const rightContent = rightVersion ? getContent(rightVersion, activePromptTab) : undefined

  return leftContent && rightContent ? (
    <div className='overflow-y-auto'>
      <ReactDiffViewer
        oldValue={leftContent || 'empty'}
        newValue={rightContent || 'empty'}
        splitView={false}
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
          wordAdded: { borderRadius: '0', padding: '1px', lineHeight: '100%', background: '#C0E2CF' },
          wordRemoved: { borderRadius: '0', padding: '1px', lineHeight: '100%', background: '#F4BBAF' },
        }}
      />
    </div>
  ) : null
}
