import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { MessageProcessingJob } from '../domain/message-processing-job.entity'
import { assertProcessingStatus } from '../domain/processing-enums'

describe('MessageProcessingJob entity', () => {
  const now = new Date('2025-06-01T10:00:00Z')

  it('creates with RECEIVED status', () => {
    const job = MessageProcessingJob.create({
      id: 'job-1',
      messageId: 'msg-1',
      messageType: 'TEXT',
      now,
    })
    expect(job.status).toBe('RECEIVED')
    expect(job.processor).toBeNull()
  })

  it('transitions through queue and processing', () => {
    const job = MessageProcessingJob.create({
      id: 'job-1',
      messageId: 'msg-1',
      messageType: 'IMAGE',
      now,
    })
      .markQueued(now)
      .markProcessing(new Date('2025-06-01T10:00:01Z'))
      .markCompleted({
        status: 'PROCESSED',
        processor: 'ImageMessageProcessor',
        metadata: { stub: true },
        now: new Date('2025-06-01T10:00:02Z'),
      })

    expect(job.status).toBe('PROCESSED')
    expect(job.durationMs).toBe(1000)
  })

  it('resets for requeue', () => {
    const job = MessageProcessingJob.create({
      id: 'job-1',
      messageId: 'msg-1',
      messageType: 'TEXT',
      now,
    })
      .markQueued(now)
      .markProcessing(now)
      .markCompleted({
        status: 'FAILED',
        processor: 'TextMessageProcessor',
        metadata: {},
        error: 'boom',
        now,
      })
      .resetForRequeue()

    expect(job.status).toBe('QUEUED')
    expect(job.error).toBeNull()
    expect(job.processedAt).toBeNull()
  })

  it('rejects empty messageId', () => {
    expect(() =>
      MessageProcessingJob.create({
        id: 'job-1',
        messageId: '  ',
        messageType: 'TEXT',
        now,
      }),
    ).toThrow(ValidationError)
  })

  it('assertProcessingStatus validates enum', () => {
    expect(assertProcessingStatus('QUEUED')).toBe('QUEUED')
    expect(() => assertProcessingStatus('INVALID')).toThrow(ValidationError)
  })
})
