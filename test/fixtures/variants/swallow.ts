export function v1(): void {
  try { risky(); } catch {}
}
export function v2(): void {
  try { risky(); } catch (e) { console.log(e); }
}
export function v3(): void {
  try { risky(); } catch (e) { console.log(e); return; }
}
export function v4(): void {
  try { risky(); } catch { /* ignore */ }
}
export function v5(): void {
  try { risky(); } catch (e) { console.debug(e); return; }
}
function risky(): void {}
