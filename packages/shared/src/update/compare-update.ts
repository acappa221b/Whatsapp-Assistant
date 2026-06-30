import { compareVersions, isNewerVersion, parseVersion } from '../version/compare-versions'

export { compareVersions, isNewerVersion, parseVersion } from '../version/compare-versions'

export function isUpdateAvailable(local: string, remote: string): boolean {
  return isNewerVersion(remote, local)
}
