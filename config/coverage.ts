/**
 * Centralized coverage policy — Finance AI Dashboard
 * @see docs/testing/strategy.md#coverage-policy
 */

export const coverageThresholds = {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
} as const

/** Files that must meet thresholds in Epic 01+02. */
export const coverageInclude = [
  'packages/core/src/events/**/*.ts',
  'packages/core/src/domain/**/*.ts',
  'packages/core/src/domains/**/domain/**/*.entity.ts',
  'packages/core/src/domains/**/application/**/*.ts',
  'packages/core/src/domains/**/infrastructure/**/*.ts',
  'packages/core/src/domains/whatsapp-message/**/*.ts',
  'packages/core/src/domains/message-processing/domain/**/*.ts',
  'packages/core/src/domains/message-processing/application/**/*.ts',
  'packages/core/src/domains/message-processing/infrastructure/**/*.ts',
  'packages/core/src/domains/extraction/domain/**/*.ts',
  'packages/core/src/domains/extraction/application/**/*.ts',
  'packages/core/src/domains/extraction/infrastructure/**/*.ts',
  'packages/ai/src/providers/ai-extraction.provider.ts',
  'packages/ai/src/providers/mock-ai-extraction.provider.ts',
  'packages/ai/src/providers/openai-extraction.provider.ts',
  'packages/ai/src/schemas/expense-candidate.schema.ts',
  'packages/ai/src/schemas/revenue-candidate.schema.ts',
  'packages/ai/src/schemas/extraction-result.schema.ts',
  'packages/database/src/mappers/**/*.ts',
  'packages/database/src/repositories/**/*.ts',
  'packages/whatsapp/src/utils/**/*.ts',
  'packages/whatsapp/src/pipeline/**/*.ts',
  'packages/shared/src/errors/**/*.ts',
  'packages/shared/src/utils/**/*.ts',
]

export const coverageExclude = [
  '**/*.test.ts',
  '**/tests/**',
  'packages/*/src/index.ts',
  'packages/core/src/domains/**/index.ts',
  'packages/core/src/domains/whatsapp-message/tests/**',
  'packages/core/src/domains/message-processing/tests/**',
  'packages/core/src/domains/extraction/tests/**',
  '**/*.repository.ts',
  '**/value-objects/index.ts',
  '**/*.d.ts',
]
