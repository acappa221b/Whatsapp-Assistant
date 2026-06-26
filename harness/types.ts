export interface HarnessResult {
  name: string
  passed: boolean
  errors: string[]
}

export interface Harness {
  name: string
  run(): Promise<HarnessResult>
}

export function createResult(name: string, errors: string[]): HarnessResult {
  return { name, passed: errors.length === 0, errors }
}
