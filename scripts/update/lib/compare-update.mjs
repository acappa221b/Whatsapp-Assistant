export function compareVersions(a, b) {
  const parse = (version) => {
    const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-rc(\d+))?$/)
    if (!match) return { major: 0, minor: 0, patch: 0, rc: Number.POSITIVE_INFINITY }
    return {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      rc: match[4] ? Number(match[4]) : Number.POSITIVE_INFINITY,
    }
  }
  const left = parse(a)
  const right = parse(b)
  if (left.major !== right.major) return left.major < right.major ? -1 : 1
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1
  if (left.rc === right.rc) return 0
  return left.rc < right.rc ? -1 : 1
}

export function isUpdateAvailable(local, remote) {
  return compareVersions(remote, local) > 0
}
