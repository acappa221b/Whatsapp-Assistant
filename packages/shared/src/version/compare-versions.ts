export type ParsedVersion = {
  major: number
  minor: number
  patch: number
  rc?: number
}

export function parseVersion(version: string): ParsedVersion {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-rc(\d+))?$/)
  if (!match) {
    return { major: 0, minor: 0, patch: 0 }
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    rc: match[4] ? Number(match[4]) : undefined,
  }
}

/** @returns -1 if a < b, 0 if equal, 1 if a > b */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const left = parseVersion(a)
  const right = parseVersion(b)

  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1
  }
  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1
  }
  if (left.patch !== right.patch) {
    return left.patch < right.patch ? -1 : 1
  }

  const leftRc = left.rc ?? Number.POSITIVE_INFINITY
  const rightRc = right.rc ?? Number.POSITIVE_INFINITY
  if (leftRc === rightRc) return 0
  return leftRc < rightRc ? -1 : 1
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0
}
