import { useState } from "react";

// Saved data, really deleted, and guarded the two ways real projects guard it.
// Neither guard sits on the line a pattern lands on, and neither is named in
// the prose above it — a fixture that says the word in a comment tests the
// comment.

// One: the guard is the first statement inside the handler, which is below the
// `onClick={` line, not above it.
export function DeployRow({ id, refresh }: { id: string; refresh: () => void }) {
  async function deleteDeployment(d: string) {
    await fetch(`/api/deployments/${d}`, { method: "DELETE" });
  }
  return (
    <button
      type="button"
      className="text-error"
      onClick={async (e) => {
        e.stopPropagation();
        if (!confirm("Cancel this deployment? This will remove it from history.")) return;
        await deleteDeployment(id);
        refresh();
      }}
    >
      Cancel run
    </button>
  );
}

// Two: the row swaps itself for a second step, so the Delete button does not
// exist until the question has been asked.
export function ClusterRow({ id, refresh }: { id: string; refresh: () => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  async function destroyCluster(cluster: string) {
    await fetch(`/api/clusters/${cluster}`, { method: "DELETE" });
    refresh();
  }
  return confirmId === id ? (
    <span>
      <span>Confirm?</span>
      <button type="button" onClick={() => destroyCluster(id)}>Delete</button>
      <button type="button" onClick={() => setConfirmId(null)}>Cancel</button>
    </span>
  ) : (
    <button type="button" onClick={() => setConfirmId(id)}>Remove cluster</button>
  );
}
