// The live region the consumers rely on, one file away from every one of them.
export function ToastHost({ children }: { children: React.ReactNode }) {
  return (
    <div aria-live="polite" className="toast-host">
      {children}
    </div>
  );
}
