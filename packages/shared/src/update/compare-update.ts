import { compareVersions, isNewerVersion } from '../version/compare-versions'

export { compareVersions, isNewerVersion } from '../version/compare-versions'

export function isUpdateAvailable(local: string, remote: string): boolean {
  return isNewerVersion(remote, local)
}
