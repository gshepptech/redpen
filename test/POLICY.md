# How this suite is allowed to pass

One rule:

> **Every new rule must be shown failing against its own fixture before it is
> shown passing.**

Revert the fix, run the test, watch it fail, restore the fix. If it passes both
ways it is not evidence, and a test that is not evidence is worse than no test,
because it occupies the space where a real one would have gone.

## Why this and not something more elaborate

Code review does not distinguish a check that passes from a check that never
ran. Breaking the code on purpose does. The failures it catches look like this:

**A parser that degrades harmlessly.** If `parseColor` cannot read
`color(srgb …)`, a `color-mix` layer drops silently out of the composite. On a
7% tint the ground behind it is nearly the same colour, so the answer stays
right by accident and the test passes with the fix reverted. The fixture
carries a 94% wash alongside the 7% one, and only the wash discriminates.

**Evidence labelled from the request instead of the observation.** A
toggled-theme pass that labels findings with the theme it *asked for* stays
confidently wrong when the theme never applied. The stamp is read back off the
page, and a pass that cannot enter its own context is skipped and said out
loud.

**A guard whose removal changes nothing.** If a value is already blanked
upstream, removing the guard that hides it renders the same output, and the
test keeps passing. That test does not pin the guard, and it should say so.

**A fixture that measures the opposite of its claim.** A search fixture whose
title contains the query matches on title rather than snippet, and the test
passes or fails for a reason unrelated to what it names.

## What this means in practice

- A test asserting **no finding** is the dangerous shape. It passes when the
  detector is broken, when the rule is misconfigured, and when the fixture never
  loaded. Pair every one with a case where the same rule *does* fire.
- Prefer a fixture that carries its forgiving case and its discriminating case
  side by side, with a comment saying which is which. The forgiving one
  documents the boundary; the discriminating one is the test.
- When a rule is surface-gated, the fixture has to land on a surface where the
  rule applies. `empty-grid-cell` is scoped away from `operate`, so a fixture
  with a search input in it classifies as an app and the rule is correctly
  switched off. The test then fails for a reason unrelated to the detector.
- The failure mode of a verifier is silence, and silence is indistinguishable
  from success. That is why breaking it on purpose is the only check that
  counts.
