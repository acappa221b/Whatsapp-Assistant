export function rawVersionUrl(owner, repo, branch) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/version.json`
}

export function zipArchiveUrl(owner, repo, branch) {
  return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`
}
