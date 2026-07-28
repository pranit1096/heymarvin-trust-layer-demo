import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, Sparkles, Play, RotateCcw,
  User, Mic, CheckCircle2, AlertTriangle, ArrowRight, Quote, TrendingDown,
  TrendingUp, Link2, Zap
} from "lucide-react";

// ---------------------------------------------------------------------------
// HeyMarvin "Trust Layer" — interactive prototype
// Feature proposed in the product teardown: auto speaker detection +
// per-quote Trust Score + one-tap correction that "learns".
// Built by Pranit Patil as a demonstrable PM artifact.
// ---------------------------------------------------------------------------

// Raw transcript lines. `truth` = who really said it. Marvin's naive model
// mislabels a couple of moderator prompts as participant insight (the real,
// documented flaw we're fixing).
const RAW_LINES = [
  { id: 1, truth: "moderator", naive: "moderator", text: "Thanks for joining! To start, can you walk me through how you currently track customer feedback?" },
  { id: 2, truth: "participant", naive: "participant", text: "Honestly it's a mess. Notes live in three different Notion pages and nobody looks at them after the readout.", insight: true },
  { id: 3, truth: "moderator", naive: "participant", text: "So it sounds like the biggest pain is that insights get lost after the presentation, right?", insight: true },
  { id: 4, truth: "participant", naive: "participant", text: "Exactly. By the next quarter we've basically forgotten what customers told us, so we end up re-running the same interviews.", insight: true },
  { id: 5, truth: "moderator", naive: "moderator", text: "Got it. And how does that affect your roadmap decisions?" },
  { id: 6, truth: "participant", naive: "participant", text: "We ship on gut feel more than I'd like to admit. If I could just search past research, I'd trust the roadmap way more.", insight: true },
  { id: 7, truth: "moderator", naive: "participant", text: "Would it help if every insight linked straight back to the original clip?", insight: true },
  { id: 8, truth: "participant", naive: "participant", text: "A hundred percent. My exec always asks 'says who?' and I never have the receipt handy.", insight: true },
];

// Extracted quotes = the "insight" lines the AI surfaces to stakeholders.
const QUOTE_IDS = RAW_LINES.filter(l => l.insight).map(l => l.id);

const SPEAKER_META = {
  moderator: { label: "Moderator", icon: Mic, color: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", dot: "bg-amber-500" },
  participant: { label: "Participant", icon: User, color: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-200", dot: "bg-sky-500" },
};

// Trust score depends on: correct speaker + source clarity + corroboration.
function scoreFor(line, correctedSpeaker, verified) {
  const speaker = correctedSpeaker || line.detected;
  // If the surfaced quote is actually a moderator prompt, it's a bad insight.
  const isRealParticipant = speaker === "participant" && line.truth === "participant";
  const speakerConfidence = speaker === line.truth ? 0.94 : 0.42;
  const sourceClarity = 0.9; // we always have the timestamped clip
  const corroboration = line.truth === "participant" ? 0.8 : 0.3;
  let raw = 0.45 * speakerConfidence + 0.25 * sourceClarity + 0.3 * corroboration;
  if (verified) raw = Math.min(1, raw + 0.08);
  return { pct: Math.round(raw * 100), isRealParticipant };
}

function trustBucket(pct) {
  if (pct >= 78) return { label: "High trust", icon: ShieldCheck, color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-500" };
  if (pct >= 55) return { label: "Review", icon: ShieldQuestion, color: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", bar: "bg-amber-500" };
  return { label: "Low trust", icon: ShieldAlert, color: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200", bar: "bg-rose-500" };
}

export default function TrustLayerDemo() {
  const [detected, setDetected] = useState(false); // has auto-detection run?
  const [corrections, setCorrections] = useState({}); // id -> speaker
  const [verified, setVerified] = useState({}); // id -> bool
  const [activeSource, setActiveSource] = useState(null);

  // Build the working lines with detected labels (naive until user corrects).
  const lines = useMemo(() => RAW_LINES.map(l => ({
    ...l,
    detected: corrections[l.id] || (detected ? l.truth : l.naive),
  })), [detected, corrections]);

  const quotes = lines.filter(l => QUOTE_IDS.includes(l.id));

  // KPIs
  const total = quotes.length;
  const misattributed = quotes.filter(q => q.detected !== q.truth).length;
  const misRate = Math.round((misattributed / total) * 100);
  const verifiedCount = quotes.filter(q => verified[q.id]).length;
  const verifiedRate = Math.round((verifiedCount / total) * 100);

  const reset = () => { setDetected(false); setCorrections({}); setVerified({}); setActiveSource(null); };

  const runDetection = () => setDetected(true);

  const correctSpeaker = (id, current) => {
    const next = current === "participant" ? "moderator" : "participant";
    setCorrections(c => ({ ...c, [id]: next }));
  };

  const toggleVerify = (id) => setVerified(v => ({ ...v, [id]: !v[id] }));

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-6xl px-5 py-8">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-600">
              <Sparkles className="h-4 w-4" /> HeyMarvin · Prototype
            </div>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Trust Layer <span className="text-slate-400 font-medium">for AI insights</span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Auto-detects speaker vs. participant, scores every surfaced quote for trust,
              and lets you fix a label in one tap — so no moderator prompt ever reaches a stakeholder deck as "customer insight."
            </p>
          </div>
          <button onClick={reset}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
        </div>

        {/* Stepper hint */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <Step n={1} done={detected} label="Run auto speaker detection" />
          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
          <Step n={2} done={misRate === 0 && detected} label="Fix any misattributed quotes" />
          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
          <Step n={3} done={verifiedRate === 100} label="Verify before use" />
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Kpi
            title="Misattribution rate"
            value={`${misRate}%`}
            sub={misRate === 0 ? "No moderator prompts mislabeled" : `${misattributed} of ${total} quotes mislabeled`}
            good={misRate === 0}
            icon={misRate === 0 ? TrendingDown : AlertTriangle}
            tone={misRate === 0 ? "emerald" : "rose"}
          />
          <Kpi
            title="Verified before use"
            value={`${verifiedRate}%`}
            sub={`${verifiedCount} of ${total} quotes checked`}
            good={verifiedRate === 100}
            icon={TrendingUp}
            tone={verifiedRate === 100 ? "emerald" : "sky"}
          />
          <Kpi
            title="Detection status"
            value={detected ? "Active" : "Off"}
            sub={detected ? "Speakers separated on ingest" : "Naive labels (Marvin today)"}
            good={detected}
            icon={Zap}
            tone={detected ? "emerald" : "amber"}
          />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Transcript */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Interview transcript</h2>
              {!detected && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={runDetection}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                  <Play className="h-4 w-4" /> Run auto detection
                </motion.button>
              )}
              {detected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Speakers separated
                </span>
              )}
            </div>

            <div className="space-y-2">
              {lines.map(line => {
                const meta = SPEAKER_META[line.detected];
                const Icon = meta.icon;
                const wasCorrected = corrections[line.id];
                return (
                  <motion.div layout key={line.id}
                    onClick={() => setActiveSource(line.id)}
                    className={`cursor-pointer rounded-xl p-3 ring-1 transition ${meta.bg} ${meta.ring} ${activeSource === line.id ? "ring-2 ring-offset-1" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold ${meta.color}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                      {wasCorrected && (
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">corrected ✓</span>
                      )}
                      {line.insight && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <Quote className="h-3 w-3" /> surfaced as insight
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-snug text-slate-700">{line.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Surfaced insights with Trust Scores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Insights surfaced to stakeholders
            </h2>

            {!detected && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Marvin today surfaces these quotes with naive labels. Two moderator prompts are about to reach a deck as "customer insight." Run detection to see the Trust Layer catch them.</span>
              </div>
            )}

            <div className="space-y-3">
              {quotes.map(q => {
                const { pct, isRealParticipant } = scoreFor(q, corrections[q.id], verified[q.id]);
                const bucket = trustBucket(pct);
                const BIcon = bucket.icon;
                const mislabeled = q.detected !== q.truth;
                return (
                  <motion.div layout key={q.id}
                    className={`rounded-xl border p-3.5 transition ${mislabeled ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-snug text-slate-700">“{q.text}”</p>
                      <div className={`shrink-0 rounded-lg px-2 py-1 text-center ring-1 ${bucket.bg} ${bucket.ring}`}>
                        <div className={`flex items-center gap-1 text-[11px] font-bold ${bucket.color}`}>
                          <BIcon className="h-3.5 w-3.5" /> {pct}
                        </div>
                      </div>
                    </div>

                    {/* trust bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div className={`h-full ${bucket.bar}`} initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SPEAKER_META[q.detected].bg} ${SPEAKER_META[q.detected].color}`}>
                        {React.createElement(SPEAKER_META[q.detected].icon, { className: "h-3 w-3" })}
                        {SPEAKER_META[q.detected].label}
                      </span>

                      {mislabeled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                          <AlertTriangle className="h-3 w-3" /> likely a moderator prompt
                        </span>
                      )}

                      <button onClick={() => correctSpeaker(q.id, q.detected)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
                        <RotateCcw className="h-3 w-3" /> Fix speaker
                      </button>

                      <button onClick={() => toggleVerify(q.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${verified[q.id] ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        <CheckCircle2 className="h-3 w-3" /> {verified[q.id] ? "Verified" : "Verify"}
                      </button>

                      <button onClick={() => setActiveSource(q.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-sky-600 transition hover:bg-sky-50">
                        <Link2 className="h-3 w-3" /> Source
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Source peek toast */}
        <AnimatePresence>
          {activeSource && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-5 left-1/2 z-20 w-[92%] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-600">
                  <Link2 className="h-4 w-4" /> Cited source · 00:0{activeSource}:12
                </div>
                <button onClick={() => setActiveSource(null)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                “{lines.find(l => l.id === activeSource)?.text}”
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Every score links back to the exact timestamped clip — the answer to your exec’s “says who?”
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer note */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 shadow-sm">
          <p className="font-semibold text-slate-700">How this maps to the roadmap</p>
          <p className="mt-1">
            Prototype of the <span className="font-semibold text-slate-700">Trust Layer</span> feature from my HeyMarvin teardown.
            It attacks the platform’s most-documented weakness (speaker/quote misattribution) while reinforcing its core differentiator (cited, trustworthy AI).
            Detection logic is rule-based here to illustrate the UX; in production it would run on the diarization + citation pipeline.
            Success metrics wired into the demo: <span className="font-semibold text-slate-700">misattribution rate ↓</span> and <span className="font-semibold text-slate-700">verified-before-use ↑</span>.
          </p>
          <p className="mt-2 text-slate-400">Built by Pranit Patil · Product Manager candidate</p>
        </div>
      </div>
    </div>
  );
}

function Step({ n, done, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 transition ${done ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-slate-500 ring-slate-200"}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}

function Kpi({ title, value, sub, good, icon: Icon, tone }) {
  const tones = {
    emerald: "text-emerald-600 bg-emerald-50 ring-emerald-100",
    rose: "text-rose-600 bg-rose-50 ring-rose-100",
    sky: "text-sky-600 bg-sky-50 ring-sky-100",
    amber: "text-amber-600 bg-amber-50 ring-amber-100",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        <span className={`rounded-lg p-1.5 ring-1 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${good ? "text-emerald-600" : "text-slate-900"}`}>{value}</div>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
