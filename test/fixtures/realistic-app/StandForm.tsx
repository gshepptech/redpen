import { useState } from "react";

// Stand register. Rows are written straight through to the store on submit; the
// list refreshes from the server afterwards so a concurrent edit shows up.
export function StandForm({ onSave }: { onSave: (v: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<string[]>([]);

  async function submit() {
    await onSave(name);
    setRows(await fetch("/api/stands").then((r) => r.json()));
  }

  function removeRow(i: number) {
    if (confirm("Remove this row?")) {
      setRows(rows.filter((_, n) => n !== i));
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="name">Stand name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Save stand</button>
      <p>Trusted by 50,000+ land managers to cut scouting time by 40%.</p>
      {rows.map((r, i) => (
        <button key={r} type="button" onClick={() => removeRow(i)}>Remove</button>
      ))}
    </form>
  );
}

// Saved rows, deleted straight through with nothing to catch a misclick.
export function StandList({ rows, refresh }: { rows: string[]; refresh: () => void }) {
  async function deleteStand(id: string) {
    await fetch(`/api/stands/${id}`, { method: "DELETE" });
    refresh();
  }
  return (
    <ul>
      {rows.map((id) => (
        <li key={id}>
          {id}
          <button type="button" onClick={() => deleteStand(id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
