import { PromptVersion, ChainVersion, IsPromptVersion } from '@/types'
import VersionComparison from './versionComparison'

export default function VersionCellBody<Version extends PromptVersion | ChainVersion>({
  version,
  isActiveVersion,
  compareVersion,
}: {
  version: Version
  isActiveVersion: boolean
  compareVersion?: PromptVersion
}) {
  return IsPromptVersion(version) ? (
    <>
      <div className='border-b border-gray-200 border-b-1' />
      <div className={isActiveVersion ? '' : 'line-clamp-2'}>
        <VersionComparison version={version} compareVersion={compareVersion} />
      </div>
    </>
  ) : null
}
