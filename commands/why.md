---
description: Explain one redpen rule — what it means, who named it, and whether humans actually notice it
argument-hint: "<rule-id>"
allowed-tools: Bash
---

Run `npx redpen why $ARGUMENTS` and relay what it says.

If the user gave no rule id, run `npx redpen rules` and ask which one they mean.
If the id does not exist, `redpen rules <partial>` filters by substring.

Two fields decide how much weight the rule deserves, and you should say which
applies:

- **an evidence rank** means the tell was measured against 3,033 real complaints.
  The rank is how often humans actually named it.
- **"never measured"** means the weight is redpen's own judgement of consequence.
  Say so — it is a weaker claim, and the user is entitled to disagree with it.
