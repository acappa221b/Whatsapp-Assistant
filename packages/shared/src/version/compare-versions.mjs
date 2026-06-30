/** Plain JS copy — keep in sync with compare-versions.ts (launcher / scripts). */

const VERSION_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-rc(\d+)([a-z])?|-([a-z0-9.-]+))?$/i

export function parseVersion(version) {
  const trimmed = version.trim()
  const match = trimmed.match(VERSION_RE)
  if (!match) {
    const base = trimmed.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!base) return null
    return {
      major: Number(base[1]),
      minor: Number(base[2]),
      patch: Number(base[3]),
    }
  }

  let prerelease
  if (match[4]) {
    prerelease = {
      kind: 'rc',
      rc: Number(match[4]),
      suffix: (match[5] ?? '').toLowerCase(),
    }
  } else if (match[6]) {
    prerelease = { kind: 'tag', tag: match[6].toLowerCase() }
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  }
}

function prereleaseKey(prerelease) {
  if (prerelease.kind === 'rc') {
    return `rc:${String(prerelease.rc).padStart(6, '0')}:${prerelease.suffix}`
  }
  return `tag:${prerelease.tag}`
}

function comparePrerelease(left, right) {
  if (!left && !right) return 0
  if (!left && right) return 1
  if (left && !right) return -1
  const leftKey = prereleaseKey(left)
  const rightKey = prereleaseKey(right)
  if (leftKey === rightKey) return 0
  return leftKey < rightKey ? -1 : 1
}

export function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!left || !right) return null

  if (left.major !== right.major) return left.major < right.major ? -1 : 1
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1
  return comparePrerelease(left.prerelease, right.prerelease)
}

export function isNewerVersion(latest, current) {
  const cmp = compareVersions(latest, current)
  if (cmp === null) return false
  return cmp > 0
}

export function isUpdateAvailable(local, remote) {
  return isNewerVersion(remote, local)
}
