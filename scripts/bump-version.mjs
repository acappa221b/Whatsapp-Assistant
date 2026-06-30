#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION_PATH = resolve(ROOT, 'version.json')

function readManifest() {
  if (!existsSync(VERSION_PATH)) {
    throw new Error('version.json not found')
  }
  return JSON.parse(readFileSync(VERSION_PATH, 'utf-8'))
}

function bumpPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/)
  if (!match) throw new Error(`Invalid version: ${version}`)
  const patch = Number(match[3]) + 1
  return `${match[1]}.${match[2]}.${patch}${match[4] ?? ''}`
}

const manifest = readManifest()
const nextVersion = bumpPatch(manifest.version)
const updated = {
  ...manifest,
  version: nextVersion,
  releasedAt: new Date().toISOString().slice(0, 10),
}
writeFileSync(VERSION_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8')
console.log(`Bumped version: ${manifest.version} -> ${nextVersion}`)
