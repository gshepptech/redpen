export function Wizard({ services, setServices }: { services: string[]; setServices: (s: string[]) => void }) {
  const removeService = (i: number) => setServices(services.filter((_, n) => n !== i));
  return (
    <form>
      {services.map((s, i) => (
        <span key={s}>{s}<button type="button" onClick={() => removeService(i)}>Remove</button></span>
      ))}
    </form>
  );
}
