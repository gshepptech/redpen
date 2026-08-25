export function Wizard({
  services,
  setServices,
  status,
}: {
  services: string[];
  setServices: (s: string[]) => void;
  status: 'idle' | 'loading' | 'error';
}) {
  const removeService = (i: number) => setServices(services.filter((_, n) => n !== i));

  const notice =
    status === 'error'
      ? "Couldn't reach the deploy API, so the service list may be stale — reload to try again."
      : '';

  return (
    <form>
      {notice ? <p role="alert">{notice}</p> : null}
      {services.map((s, i) => (
        <span key={s}>{s}<button type="button" onClick={() => removeService(i)}>Remove</button></span>
      ))}
    </form>
  );
}
