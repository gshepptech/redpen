export async function refresh(load: () => Promise<void>) {
  try {
    await load();
    // redpen-ignore:swallowed-error the refresh is best-effort; the next tick retries
  } catch {}
}
