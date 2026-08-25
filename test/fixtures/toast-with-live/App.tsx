export function App() {
  return (
    <div>
      <Toast message="Saved" />
    </div>
  );
}
function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>;
}
