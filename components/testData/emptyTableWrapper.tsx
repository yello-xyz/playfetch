import { ReactNode, useCallback, useEffect, useState } from 'react'
import Button from '../button'
import { useDropzone } from 'react-dropzone'
import { parse } from 'csv-parse/sync'
import { useRefreshActiveItem } from '@/src/client/context/projectContext'

export default function EmptyTableWrapper({
  isTableEmpty,
  bottomPadding,
  onAddInputValues,
  onImportComplete,
  importButton,
  children,
}: {
  isTableEmpty: boolean
  bottomPadding: string
  onAddInputValues: (variable: string, inputs: string[]) => Promise<void>
  onImportComplete?: () => void
  importButton?: (onImportComplete?: () => void) => ReactNode
  children?: ReactNode
}) {
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [progress, setProgress] = useState<number>()
  const refreshActiveItem = useRefreshActiveItem()

  const onDrop = useCallback(
    ([file]: File[]) => {
      if (file) {
        setShowFileUpload(false)
        setProgress(0)
        const reader = new FileReader()
        reader.onload = async () => {
          if (reader.result && typeof reader.result !== 'string') {
            const rows: string[][] = parse(Buffer.from(reader.result))
            const cols = rows[0].map((_, colIndex) => rows.map(row => row[colIndex]))
            for (const [index, col] of cols.entries()) {
              setProgress((index + 1) / cols.length)
              await onAddInputValues(col[0], col.slice(1))
            }
            await refreshActiveItem()
            setProgress(undefined)
            onImportComplete?.()
          }
        }
        reader.readAsArrayBuffer(file)
      }
    },
    [onAddInputValues, refreshActiveItem]
  )

  const {
    getRootProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({ onDrop, noClick: true, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 })

  const baseClass = 'flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg'
  const backgroundColor = isDragActive ? 'bg-gray-100' : 'bg-gray-25'
  const layoutClass = showFileUpload || progress !== undefined ? 'min-h-[136px] gap-3' : 'gap-1'
  const borderClass = showFileUpload ? 'border-dashed' : ''

  const [startFromScratch, setStartFromScratch] = useState(false)

  useEffect(() => setStartFromScratch(startFromScratch && isTableEmpty), [startFromScratch, isTableEmpty])

  return !isTableEmpty || startFromScratch ? (
    <>{children}</>
  ) : (
    <div className={`${bottomPadding} w-full px-4 pt-4 text-gray-700`} {...(showFileUpload ? getRootProps() : {})}>
      <div className={`${baseClass} ${backgroundColor} ${layoutClass} ${borderClass}`}>
        {showFileUpload ? (
          <>
            <span>Drag and drop to upload your CSV file.</span>
            <div className='flex items-center gap-2'>
              <Button type='secondary' onClick={() => setShowFileUpload(false)}>
                Cancel
              </Button>
              <Button type='primary' onClick={openFileDialog}>
                Browse for CSV file
              </Button>
            </div>
          </>
        ) : progress !== undefined ? (
          <>
            <span>Uploading...</span>
            <ProgressBar progress={progress} maxWidth='max-w-[380px]' />
          </>
        ) : (
          <>
            <span className='font-medium'>Create Test Data</span>
            <span className='text-sm text-center text-gray-400'>
              Test data allows you to test different inputs to your prompt.
            </span>
            <span className='flex items-center gap-2 mt-2'>
              {importButton && importButton(onImportComplete)}
              <Button type='secondary' onClick={() => setShowFileUpload(true)}>
                Import CSV
              </Button>
              <Button type='secondary' onClick={() => setStartFromScratch(true)}>
                Start from scratch
              </Button>
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const ProgressBar = ({ progress, maxWidth = '' }: { progress: number; maxWidth?: string }) => (
  <div className={`${maxWidth} w-full rounded h-1.5 bg-gray-200`}>
    <div
      className={`h-full bg-blue-400 rounded-l ${progress < 1 ? '' : 'rounded-r'}`}
      style={{ width: `${progress * 100}%` }}
    />
  </div>
)
