# HeyMarvin · Trust Layer — Interactive Prototype

> A demonstrable PM artifact by **Pranit Patil**. I did a product teardown of [HeyMarvin](https://heymarvin.com), found that **speaker/quote misattribution** is the biggest threat to its core "trust" promise, and built a working prototype of how I'd fix it in a first sprint.

**▶️ Live demo:** _https://vitejsvitenptm1zxw-za4v--5173--87cf54cd.local-credentialless.webcontainer.io/
---

## The problem (in one line)

HeyMarvin's superpower is trust — every insight cites its source. But its most-documented weakness is **speaker misattribution**: moderator prompts get surfaced as if the *customer* said them. One bad quote can invalidate an entire stakeholder deck.

## The fix — a "Trust Layer"

| Capability | What it does |
|---|---|
| 🎙️ **Auto speaker detection** | Separates moderator vs. participant on ingest and flags likely-misattributed quotes. |
| 🛡️ **Per-quote Trust Score** | Scores every surfaced quote on speaker confidence + source clarity + corroboration. |
| 👆 **One-tap correction** | Re-assign a speaker in a click; the score recalculates live (and, in production, the model learns). |
| 🔗 **Cited source jump** | Every score links back to the exact timestamped clip — the answer to "says who?" |

## Success metrics wired into the demo

- **Misattribution rate ↓** (target: → 0%)
- **Verified-before-use ↑** (target: → 100%)

These are live KPI cards — they update as you interact, so the demo *shows* the impact rather than claiming it.

---

## Try it in 30 seconds

1. Click **Run auto detection** → speakers separate, two mislabeled quotes get flagged red.
2. Click **Fix speaker** on each flagged quote → Trust Scores jump.
3. Click **Verify** on each quote → "verified-before-use" hits 100%.
4. Click **Source** on any quote → see the cited timestamp.

Watch all three KPI cards turn green. 🎉

---

## Tech stack

- **React 18** + **Vite** — fast, modern SPA tooling
- **Tailwind CSS** — utility-first styling
- **framer-motion** — micro-interactions & layout animation
- **lucide-react** — icons

## A note on the logic

The detection is **rule-based here to illustrate the UX**. In production, this layer would sit on top of a diarization + ASR pipeline and the existing citation infrastructure; the Trust Score would be a learned confidence signal, and corrections would feed a labeling feedback loop.

---

## How this maps to the role

This prototype demonstrates the full PM loop in one artifact:

- **Discovery** → teardown surfaced the real, documented weakness.
- **Prioritization** → chose the fix that attacks the biggest risk *and* reinforces the core differentiator (high value, low/medium effort).
- **Definition** → shippable feature with clear user stories and out-of-scope.
- **Measurement** → success metrics instrumented directly into the UI.
- **Building** → shipped a working, interactive prototype, not just a slide.

