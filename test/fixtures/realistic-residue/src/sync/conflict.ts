import type { QueuedWrite } from "./queue";

// Last-write-wins on updatedAt, with the server as tiebreaker.
// See MIGRATION_PLAN.md for details on why we didn't use CRDTs here.
export function resolve(local: QueuedWrite, remote: QueuedWrite): QueuedWrite {
  const l = Number(local.payload.updatedAt ?? 0);
  const r = Number(remote.payload.updatedAt ?? 0);
  return r >= l ? remote : local;
}
