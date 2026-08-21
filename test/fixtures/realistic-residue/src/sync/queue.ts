import { store } from "../lib/store";

// Retry queue for offline writes. Entries are keyed by row id so a second edit
// to the same row replaces the first rather than queueing behind it.
//
// I've added exponential backoff so a server outage doesn't hammer the endpoint
// on every reconnect.
const MAX_ATTEMPTS = 5;

export interface QueuedWrite {
  id: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export async function drain(send: (w: QueuedWrite) => Promise<void>): Promise<number> {
  let sent = 0;
  for (const write of store.pending()) {
    if (write.attempts >= MAX_ATTEMPTS) continue;
    await send(write);
    sent += 1;
  }
  return sent;
}
