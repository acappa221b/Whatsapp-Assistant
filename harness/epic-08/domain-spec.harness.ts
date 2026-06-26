import { createEpic08Harness } from './spec-validation'

export const FinancialCandidateSpecHarness = createEpic08Harness(
  'FinancialCandidateSpecHarness',
  'financial-candidate',
  (content, errors) => {
    for (const field of [
      'sourceMessageId',
      'extractionId',
      'candidateType',
      'status',
      'confidence',
      'reasoning',
      'MIXED',
      'PARTIALLY_APPROVED',
      'MIXED_RESOLUTION',
    ]) {
      if (!content.includes(field)) {
        errors.push(`financial-candidate: missing field documentation: ${field}`)
      }
    }
    for (const event of ['CandidateCreated', 'CandidateUpdated', 'CandidateApproved', 'CandidateRejected']) {
      if (!content.includes(event)) {
        errors.push(`financial-candidate: missing event: ${event}`)
      }
    }
  },
)

export const CandidateItemSpecHarness = createEpic08Harness(
  'CandidateItemSpecHarness',
  'candidate-item',
  (content, errors) => {
    for (const field of [
      'itemType',
      'description',
      'amount',
      'suggestedCategory',
      'suggestedSupplier',
      'expenseDate',
      'confidence',
      'sourceMessageId',
      'extractionId',
      'sourceFile',
      'APPROVED',
      'REJECTED',
    ]) {
      if (!content.includes(field)) {
        errors.push(`candidate-item: missing field documentation: ${field}`)
      }
    }
    for (const modality of ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO']) {
      if (!content.includes(modality)) {
        errors.push(`candidate-item: missing modality coverage: ${modality}`)
      }
    }
  },
)

export const ApprovalQueueSpecHarness = createEpic08Harness(
  'ApprovalQueueSpecHarness',
  'approval-queue',
  (content, errors) => {
    for (const field of ['decision', 'userId', 'timestamp', 'comment', 'changes', 'itemId']) {
      if (!content.includes(field)) {
        errors.push(`approval-queue: missing decision field: ${field}`)
      }
    }
    for (const artifact of [
      'Approve',
      'Reject',
      '/dashboard/approvals',
      'ApprovalDecision',
      'Approve All',
      'Reject All',
      'Approve Selected',
      'Reject Selected',
      'EditCandidateItemInQueue',
    ]) {
      if (!content.includes(artifact)) {
        errors.push(`approval-queue: missing approval concept: ${artifact}`)
      }
    }
  },
)
