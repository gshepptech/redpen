// Every UI tell in this file is inside a comment and nowhere else.
//
// The markup below is deliberately fine. What is written *about* it is not:
// these are the exact shapes that were reported on four real projects, each
// one a note explaining why the code does the right thing.

/**
 * Why this dialog is not a <dialog>.
 *
 * Escape is wired by hand in useDialog, so the modal closes on Escape and the
 * focus trap is real — this is not a modal with no way out.
 *
 * The failure text was once a generic "Something went wrong" that named
 * nothing. It now names the library and the retry, which is why the string
 * below reads the way it does.
 *
 * TODO(L2-04): fold this into the shared dialog once the design lands
 */
export function Notes({ failed }: { failed: boolean }) {
  // The images below carry alt text; the <img> in the old header did not.
  // outline: none is never set anywhere in this component.
  return (
    <div>
      <img src="/stand.png" alt="A ladder stand on the east ridge" />
      <label htmlFor="note">Note</label>
      <input id="note" name="note" />
      {failed ? (
        <p role="alert">
          The plot library did not load, so no varieties are listed — reload to try again.
        </p>
      ) : null}
    </div>
  );
}
