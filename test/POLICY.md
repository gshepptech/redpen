# How this suite is allowed to pass

One rule, and it exists because the suite has been green while measuring
nothing four separate times:

> **Every new rule must be shown failing against its own fixture before it is
> shown passing.**

Revert the fix, run the test, watch it fail, restore the fix. If it passes both
ways it is not evidence, and a test that is not evidence is worse than no test,
because it occupies the space where a real one would have gone.

## Why this and not something more elaborate

The failures below were all caught this way and none by reading the code. That
is the whole argument — code review does not distinguish a check that passes
from a check that never ran.

**A colour parser that degraded harmlessly.** `parseColor` could not read
`color(srgb …)`, so a `color-mix` layer dropped silently out of the composite.
On the reported case — a 7% tint — the ground behind it was nearly the same
colour, so the answer stayed right by accident. The fixture, the test and the
fix all looked correct. The test passed with the fix reverted. It now carries a
94% wash alongside the 7% one, and only the wash discriminates.

**Evidence labelled from the request instead of the observation.** The
toggled-theme pass stamped `data-theme=dark` on the root, then labelled every
finding with what it had *asked for*. When the init script threw — an init
script runs before `documentElement` exists — the theme never applied, the pass
ran against the light page anyway, and every hit still said `data-theme=dark`.
The evidence was confidently wrong, which is strictly worse than absent. The
stamp is now read back off the page, and a pass that cannot enter its own
context is skipped and said out loud rather than reported under a theme it
never reached.

**A guard whose removal changed nothing.** From a peer project: a template's
`{{if .Snippet}}` was removed to prove the test caught it, and the test kept
passing — the handler had already blanked the value upstream, so it rendered as
an empty span either way. Three of the four deliberate breaks were real. The
fourth was recorded in the test as something it explicitly does *not* pin.

**A fixture that measured the opposite of its claim.** Also from that project: a
search test's fixture gave its why-match item a title containing the query, so
it matched on title rather than snippet. The assertion was inverted and the test
failed for the right-looking wrong reason. The code was nearly "fixed" to suit
it.

## What this means in practice

- A test asserting **no finding** is the dangerous shape. It passes when the
  detector is broken, when the rule is misconfigured, and when the fixture never
  loaded. Pair every one with a case where the same rule *does* fire.
- Prefer a fixture that carries its forgiving case and its discriminating case
  side by side, with a comment saying which is which. The forgiving one
  documents the boundary; the discriminating one is the test.
- When a rule is surface-gated, the fixture has to land on a surface where the
  rule applies. `empty-grid-cell` is scoped away from `operate`, and its first
  fixture had a search input in it, so the page classified as an app and the
  rule was correctly switched off — the test failed for a reason that had
  nothing to do with the detector.
- The failure mode of a verifier is silence, and silence is indistinguishable
  from success. That is why breaking it on purpose is the only check that
  counts.
