export function rawVersionUrl(owner: string, repo: string, branch: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/version.json`
}

export function zipArchiveUrl(owner: string, repo: string, branch: string): string {
  return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`
}

export function releasesPageUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}/releases`
}

export function releaseTagUrl(owner: string, repo: string, version: string): string {
  const tag = version.startsWith('v') ? version : `v${version}`
  return `https://github.com/${owner}/${repo}/releases/tag/${tag}`
}
