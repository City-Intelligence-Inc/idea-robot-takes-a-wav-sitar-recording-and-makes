"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Headphones,
  AudioLines,
  Blend,
  ArrowRight,
  Zap,
  ScanSearch,
  Piano,
  Drum,
  Waves,
  Mail,
  Play,
  Pause,
  SkipBack,
} from "lucide-react";

const S3 = "https://fayez-app-audio.s3.us-east-1.amazonaws.com";

export default function Home() {
  const [activeRec, setActiveRec] = useState(0);
  const [activeSection, setActiveSection] = useState(1);

  const inputSrc = activeRec === 0
    ? `${S3}/inputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`
    : `${S3}/inputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`;
  const outputSrc = activeRec === 0
    ? `${S3}/outputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`
    : `${S3}/outputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-3xl px-5 py-10">

        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Headphones className="h-7 w-7 text-violet-400" />
            <h1 className="text-4xl font-bold text-white tracking-tight">Fayez</h1>
          </div>
          <p className="text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Takes a raw <strong className="text-white">.wav sitar recording</strong>, detects its rhythm and structure,
            then generates a synchronized <strong className="text-white">tabla accompaniment</strong> and mixes them together.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            ENGLISH 106A — Fayez Navid
          </p>
        </header>

        {/* ======== BEFORE / AFTER ======== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-1">Listen: Before &amp; After</h2>
          <p className="text-sm text-zinc-400 mb-4">
            The same 14-minute sitar performance — original vs. with AI-generated tabla.
          </p>

          {/* Recording tabs */}
          <div className="flex gap-2 mb-4">
            {["Recording 1", "Recording 2"].map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveRec(i)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  activeRec === i
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Players */}
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-900 p-5">
              <div className="flex items-center gap-3 mb-3">
                <AudioLines className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Before — Original Sitar</p>
                  <p className="text-xs text-zinc-500">244.8 MB · 44.1 kHz · Stereo · 14:50</p>
                </div>
              </div>
              <Player key={`in-${activeRec}`} src={inputSrc} color="zinc" />
            </div>

            <div className="flex items-center justify-center gap-3 py-1">
              <div className="h-px flex-1 bg-zinc-800" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400">
                <Waves className="h-3.5 w-3.5" />
                AI adds tabla
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="rounded-lg bg-zinc-900 p-5 ring-1 ring-violet-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Blend className="h-5 w-5 text-violet-400" />
                <div>
                  <p className="text-sm font-semibold text-white">After — Sitar + Tabla</p>
                  <p className="text-xs text-zinc-500">122.3 MB · Teentaal · 131 BPM · Key: C#</p>
                </div>
              </div>
              <Player key={`out-${activeRec}`} src={outputSrc} color="violet" />
            </div>
          </div>
        </section>

        <hr className="border-zinc-800 mb-10" />

        {/* ======== HOW IT WORKS ======== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-1">How It Works</h2>
          <p className="text-sm text-zinc-400 mb-6">Six steps from raw audio to final mix.</p>

          <div className="space-y-4">
            <Step n={1} icon={<AudioLines className="h-5 w-5" />} title="Load Audio">
              Read the 244.8 MB WAV file, convert stereo to mono, normalize to float32 arrays using <code>soundfile</code>.
            </Step>
            <Step n={2} icon={<Zap className="h-5 w-5" />} title="Detect Beats &amp; Tempo">
              <code>librosa.beat.beat_track</code> analyzes onset strength to find <strong>1,872 beats</strong> at <strong>130.8 BPM</strong> across the 14:50 recording.
            </Step>
            <Step n={3} icon={<ScanSearch className="h-5 w-5" />} title="Classify Sections">
              Measures spectral flux and RMS energy to label each segment:
              <br />
              <strong>Alap</strong> (24%) — slow, meditative. <strong>Jod</strong> (58%) — rhythmic pulse. <strong>Jhala</strong> (18%) — fast, climactic.
            </Step>
            <Step n={4} icon={<Piano className="h-5 w-5" />} title="Detect Tonic">
              Chroma feature analysis finds the root note: <strong>C# at 277.2 Hz</strong>. The tabla&apos;s bass drum (bayan) is tuned to this frequency.
            </Step>
            <Step n={5} icon={<Drum className="h-5 w-5" />} title="Generate Tabla">
              Maps the 16-beat <strong>Teentaal</strong> cycle onto every 16 detected beats using <code>pretty_midi</code>.
              Volume varies by section — silent in alap, 60% in jod, 100% in jhala.
            </Step>
            <Step n={6} icon={<Blend className="h-5 w-5" />} title="Mix &amp; Output">
              Synthesizes tabla MIDI to audio, mixes with original sitar at 60% level, applies 30% convolution reverb, renders final WAV.
            </Step>
          </div>
        </section>

        <hr className="border-zinc-800 mb-10" />

        {/* ======== SECTION MAP ======== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-1">How Tabla Adapts Per Section</h2>
          <p className="text-sm text-zinc-400 mb-4">Click a section to see what the tabla does.</p>

          {/* Timeline */}
          <div className="flex h-10 rounded-lg overflow-hidden mb-4 ring-1 ring-zinc-800">
            {[
              { name: "Alap", pct: 24, bg: "bg-zinc-700", active: "bg-zinc-600" },
              { name: "Jod", pct: 58, bg: "bg-violet-900/60", active: "bg-violet-800/80" },
              { name: "Jhala", pct: 18, bg: "bg-zinc-700", active: "bg-zinc-600" },
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`flex items-center justify-center text-sm font-medium transition-all ${
                  activeSection === i ? `${s.active} text-white` : `${s.bg} text-zinc-400 hover:text-zinc-200`
                }`}
                style={{ width: `${s.pct}%` }}
              >
                {s.name} ({s.pct}%)
              </button>
            ))}
          </div>

          {/* Detail */}
          {[
            {
              name: "Alap",
              what: "Slow, free-flowing melodic exploration of the raga.",
              tabla: "Tabla is silent or barely audible. The AI detects low spectral flux (little change in the sound spectrum) and low RMS energy, so it suppresses tabla volume to near zero. The sitar speaks alone.",
              notation: "Sa — Re — Ga — Ma ——— (no tabla)",
            },
            {
              name: "Jod",
              what: "Rhythmic strumming with a steady, repetitive pulse.",
              tabla: "Tabla plays at 60% volume. The AI locks the Teentaal cycle (dha-dhin-dhin-dha) to the sitar's detected beats. Each of the 16 bols maps to one beat, creating a steady rhythmic foundation under the sitar.",
              notation: "Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha",
            },
            {
              name: "Jhala",
              what: "Fast, climactic passages with rapid-fire string plucking.",
              tabla: "Tabla at full 100% volume. High spectral flux and peak RMS energy trigger maximum intensity. Both bayan (bass) and dayan (treble) sound with full force on every beat.",
              notation: "DHA DHIN DHIN DHA | DHA DHIN DHIN DHA | DHA TIN TIN TA | TA DHIN DHIN DHA",
            },
          ].map((s, i) => (
            activeSection === i && (
              <div key={i} className="rounded-lg bg-zinc-900 p-5">
                <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
                <p className="text-sm text-zinc-300 mb-3">{s.what}</p>
                <p className="text-sm text-zinc-400 mb-3">{s.tabla}</p>
                <pre className="rounded bg-zinc-800 px-4 py-2 text-sm font-mono text-zinc-300 overflow-x-auto">
                  {s.notation}
                </pre>
              </div>
            )
          ))}
        </section>

        <hr className="border-zinc-800 mb-10" />

        {/* ======== TAAL PATTERN ======== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-1">
            Teentaal — 16 Beats Per Cycle
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            The rhythmic framework mapped onto the sitar&apos;s beats. Each bol is a tabla stroke.
          </p>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sam (beat 1)", bols: ["dha", "dhin", "dhin", "dha"], bass: [true, true, true, true] },
              { label: "Vibhag 2", bols: ["dha", "dhin", "dhin", "dha"], bass: [true, true, true, true] },
              { label: "Khali (open)", bols: ["dha", "tin", "tin", "ta"], bass: [false, false, false, false] },
              { label: "Vibhag 4", bols: ["ta", "dhin", "dhin", "dha"], bass: [false, true, true, true] },
            ].map((group, gi) => (
              <div key={gi}>
                <p className="text-xs font-medium text-zinc-500 mb-2 text-center">{group.label}</p>
                <div className="space-y-1">
                  {group.bols.map((bol, bi) => (
                    <div
                      key={bi}
                      className={`rounded py-2 text-center text-sm font-mono font-semibold ${
                        group.bass[bi]
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {bol}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-3 text-xs text-zinc-500">
            <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-violet-500/15" />Both drums (bayan + dayan)</span>
            <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-zinc-800" />Dayan only (treble)</span>
          </div>
        </section>

        <hr className="border-zinc-800 mb-10" />

        {/* ======== REQUEST ACCESS ======== */}
        <section className="mb-10 text-center">
          <Mail className="mx-auto h-7 w-7 text-violet-400 mb-2" />
          <h2 className="text-xl font-bold text-white mb-1">Request Access</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Want to process your own sitar recordings? Get in touch.
          </p>
          <a
            href="mailto:stardroplin@stanford.edu"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-violet-500"
          >
            <Mail className="h-4 w-4" />
            Fayez Navid — stardroplin@stanford.edu
          </a>
        </section>
      </div>
    </div>
  );
}

/* ---- Step ---- */
function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          {icon}
        </div>
        <div className="mt-1 w-px flex-1 bg-zinc-800" />
      </div>
      <div className="pb-4">
        <p className="text-xs font-medium text-zinc-500 mb-0.5">Step {n}</p>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

/* ---- Player ---- */
function Player({ src, color }: { src: string; color: "zinc" | "violet" }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  const accent = color === "violet"
    ? { btn: "bg-violet-600 hover:bg-violet-500", bar: "bg-violet-500", bg: "bg-violet-500/20" }
    : { btn: "bg-zinc-600 hover:bg-zinc-500", bar: "bg-zinc-500", bg: "bg-zinc-700" };

  const toggle = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) a.pause(); else a.play().catch(() => {});
    setPlaying(!playing);
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const t = () => setTime(a.currentTime);
    const m = () => setDur(a.duration);
    const e = () => setPlaying(false);
    a.addEventListener("timeupdate", t);
    a.addEventListener("loadedmetadata", m);
    a.addEventListener("ended", e);
    return () => { a.removeEventListener("timeupdate", t); a.removeEventListener("loadedmetadata", m); a.removeEventListener("ended", e); };
  }, []);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div>
      <audio ref={ref} preload="metadata" src={src} />
      <div className="flex items-center gap-3">
        <button onClick={() => { if (ref.current) ref.current.currentTime = 0; }} className="text-zinc-500 hover:text-zinc-300">
          <SkipBack className="h-4 w-4" />
        </button>
        <button onClick={toggle} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent.btn} transition-all active:scale-95`}>
          {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className={`h-2 w-full cursor-pointer rounded-full ${accent.bg}`} onClick={seek}>
            <div className={`h-full rounded-full ${accent.bar} transition-[width] duration-200`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-zinc-500 font-mono">
            <span>{fmt(time)}</span>
            <span>{dur ? fmt(dur) : "Loading..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
