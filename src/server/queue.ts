// src/server/queue.ts
// Deprecated: BullMQ-based queue adapter. Kept for reference during transition to n8n.

function isBuildTime() {
  // během next buildu nemáme běžet žádné runtime připojení
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export async function getQueueEvents() {
  // Deprecated – BullMQ events no longer used. Function kept to avoid breaking imports.
  throw new Error('BullMQ is deprecated. QueueEvents are no longer available.');
}

export async function enqueueSubtitlesJob(): Promise<never> {
  // Deprecated – use n8n webhook from API route instead
  throw new Error('BullMQ enqueue is deprecated. Use n8n webhook orchestration.');
}
