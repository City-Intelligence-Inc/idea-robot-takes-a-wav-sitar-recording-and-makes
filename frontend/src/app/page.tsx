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
  Volume2,
} from "lucide-react";

const S3 = "https://fayez-app-audio.s3.us-east-1.amazonaws.com";

const REC = {
  inputUrl: `${S3}/inputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`,
  outputUrl: `${S3}/outputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`,
  inputUrl2: `${S3}/inputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`,
  outputUrl2: `${S3}/outputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`,
};

const TAAL = [
  { bol: "dha", bass: true }, { bol: "dhin", bass: true }, { bol: "dhin", bass: true }, { bol: "dha", bass: true },
  { bol: "dha", bass: true }, { bol: "dhin", bass: true }, { bol: "dhin", bass: true }, { bol: "dha", bass: true },
  { bol: "dha", bass: false }, { bol: "tin", bass: false }, { bol: "tin", bass: false }, { bol: "ta", bass: false },
  { bol: "ta", bass: false }, { bol: "dhin", bass: true }, { bol: "dhin", bass: true }, { bol: "dha", bass: true },
];

export default function Home() {
  const [activeRec, setActiveRec] = useState(0);
  const [activeSection, setActiveSection] = useState(1);

  const inputSrc = activeRec === 0 ? REC.inputUrl : REC.inputUrl2;
  const outputSrc = activeRec === 0 ? REC.outputUrl : REC.outputUrl2;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[400px] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[120px]" />
        <div className="absolute -right-[200px] top-[20%] h-[600px] w-[400px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Compact Hero */}
        <header className="pt-10 pb-6 text-center" style={{ animation: "fadeInUp 0.5s ease-out" }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Fayez
            </h1>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl mx-auto">
            AI-powered sitar → tabla accompaniment. Detects beats, tempo, tonic &amp; sections, then generates synchronized tabla in Teentaal.
            <br /><span className="text-zinc-600">ENGLISH 106A — Fayez Navid</span>
          </p>
        </header>

        {/* ====== BEFORE / AFTER — TOP ====== */}
        <section className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 200ms backwards" }}>
          {/* Recording selector */}
          <div className="flex justify-center gap-2 mb-4">
            {["First Run", "Second Run"].map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveRec(i)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                  activeRec === i
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                    : "bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Side by side players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* BEFORE */}
            <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.04] to-amber-500/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                  <AudioLines className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-300">BEFORE</p>
                  <p className="text-[10px] text-zinc-500">Original Sitar Recording</p>
                </div>
              </div>
              <MusicPlayer key={`in-${activeRec}`} src={inputSrc} accent="orange" />
              <div className="mt-2 flex gap-2 text-[9px] text-zinc-600">
                <span>244.8 MB</span>
                <span>44.1 kHz</span>
                <span>Stereo</span>
                <span>14:50</span>
              </div>
            </div>

            {/* AFTER */}
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] to-purple-500/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                  <Blend className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-300">AFTER</p>
                  <p className="text-[10px] text-zinc-500">Sitar + AI Tabla</p>
                </div>
              </div>
              <MusicPlayer key={`out-${activeRec}`} src={outputSrc} accent="violet" />
              <div className="mt-2 flex gap-2 text-[9px] text-zinc-600">
                <span>122.3 MB</span>
                <span>Teentaal</span>
                <span>131 BPM</span>
                <span>Key: C#</span>
              </div>
            </div>
          </div>

          {/* Animated arrow between */}
          <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center" style={{ top: "calc(50% - 20px)", pointerEvents: "none" }}>
          </div>
        </section>

        {/* ====== TRANSFORMATION PIPELINE ====== */}
        <section className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 400ms backwards" }}>
          <h2 className="text-sm font-semibold text-white mb-4 text-center">How It Works — 6 Steps</h2>

          {/* Horizontal pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: AudioLines, label: "Load", detail: "244.8 MB WAV → mono float32", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/15" },
              { icon: Zap, label: "Beats", detail: "1,872 beats at 130.8 BPM", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/15" },
              { icon: ScanSearch, label: "Sections", detail: "Alap / Jod / Jhala classified", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
              { icon: Piano, label: "Tonic", detail: "C# (277.2 Hz) detected", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
              { icon: Drum, label: "Tabla", detail: "Teentaal 16-beat cycle", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
              { icon: Blend, label: "Mix", detail: "60% tabla + 30% reverb", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/15" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`rounded-lg border ${step.bg} p-3 text-center`}
                  style={{ animation: `fadeInUp 0.4s ease-out ${500 + i * 100}ms backwards` }}
                >
                  <Icon className={`mx-auto h-5 w-5 ${step.color} mb-1.5`} />
                  <p className={`text-[10px] font-bold ${step.color}`}>STEP {i + 1}</p>
                  <p className="text-xs font-semibold text-white">{step.label}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====== SECTION MAP ====== */}
        <section className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 1100ms backwards" }}>
          <h2 className="text-sm font-semibold text-white mb-3 text-center">
            How Tabla Adapts to Each Section
          </h2>

          {/* Timeline bar */}
          <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-white/[0.06] mb-3">
            {[
              { name: "Alap", pct: 24, color: "bg-blue-500", text: "text-blue-200" },
              { name: "Jod", pct: 58, color: "bg-violet-500", text: "text-violet-200" },
              { name: "Jhala", pct: 18, color: "bg-amber-500", text: "text-amber-200" },
            ].map((s, i) => (
              <button
                key={i}
                className={`${s.color}/30 flex items-center justify-center text-[10px] font-bold transition-all hover:brightness-125 ${activeSection === i ? "ring-2 ring-white/40 z-10" : ""}`}
                style={{ width: `${s.pct}%` }}
                onClick={() => setActiveSection(i)}
              >
                <span className={s.text}>{s.name} ({s.pct}%)</span>
              </button>
            ))}
          </div>

          {/* Section details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                name: "Alap",
                icon: "~",
                color: "border-blue-500/25 bg-blue-500/[0.05]",
                text: "text-blue-300",
                heading: "Slow, meditative",
                body: "No tabla. The sitar explores the raga freely. The AI detects low spectral flux and RMS energy, suppressing tabla to near silence.",
                notation: "Sa — Re — Ga — Ma ——— (silence)",
              },
              {
                name: "Jod",
                icon: "||",
                color: "border-violet-500/25 bg-violet-500/[0.05]",
                text: "text-violet-300",
                heading: "Rhythmic pulse",
                body: "Tabla at 60% volume. Every detected beat gets a Teentaal stroke. The dha-dhin-dhin-dha cycle locks to the sitar's strumming rhythm.",
                notation: "Dha Dhin Dhin Dha | Dha Dhin Dhin Dha",
              },
              {
                name: "Jhala",
                icon: "!!!",
                color: "border-amber-500/25 bg-amber-500/[0.05]",
                text: "text-amber-300",
                heading: "Fast, climactic",
                body: "Tabla at 100% volume. High spectral flux triggers maximum intensity. Both bayan (bass) and dayan (treble) sound with full force.",
                notation: "DHA DHIN DHIN DHA | DHA TIN TIN TA !!!",
              },
            ].map((s, i) => (
              <div
                key={i}
                className={`rounded-lg border ${s.color} p-3 transition-all ${activeSection === i ? "ring-1 ring-white/20 scale-[1.02]" : "opacity-60"}`}
                onClick={() => setActiveSection(i)}
                style={{ cursor: "pointer" }}
              >
                <p className={`text-xs font-bold ${s.text} mb-0.5`}>{s.name}</p>
                <p className="text-[10px] font-medium text-white mb-1">{s.heading}</p>
                <p className="text-[10px] text-zinc-400 mb-2">{s.body}</p>
                <div className="rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-zinc-300">
                  {s.notation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== TAAL PATTERN ====== */}
        <section className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 1300ms backwards" }}>
          <h2 className="text-sm font-semibold text-white mb-3 text-center">
            <Drum className="inline h-4 w-4 text-amber-400 mr-1" />
            Teentaal — 16 Beats Per Cycle
          </h2>

          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            {[
              { label: "Sam (X)", beats: TAAL.slice(0, 4) },
              { label: "Vibhag 2", beats: TAAL.slice(4, 8) },
              { label: "Khali (0)", beats: TAAL.slice(8, 12) },
              { label: "Vibhag 4", beats: TAAL.slice(12, 16) },
            ].map((group, gi) => (
              <div key={gi} className="text-center">
                <p className="text-[8px] font-bold text-zinc-600 mb-1">{group.label}</p>
                {group.beats.map((b, bi) => (
                  <div
                    key={bi}
                    className={`mb-0.5 rounded py-1 text-[11px] font-mono font-semibold ${
                      b.bass
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                    style={{ animation: `fadeInUp 0.3s ease-out ${1400 + gi * 150 + bi * 40}ms backwards` }}
                  >
                    {b.bol}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-2 text-[9px] text-zinc-500">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-violet-500/40" />Bayan + Dayan</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-500/40" />Dayan only</span>
          </div>
        </section>

        {/* ====== TONIC ====== */}
        <section className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 1500ms backwards" }}>
          <h2 className="text-sm font-semibold text-white mb-3 text-center">
            <Piano className="inline h-4 w-4 text-emerald-400 mr-1" />
            Detected Tonic: C# (277.2 Hz)
          </h2>
          <div className="flex justify-center gap-1">
            {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((note) => (
              <div
                key={note}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
                  note === "C#"
                    ? "bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/50 scale-125"
                    : "bg-white/[0.04] text-zinc-600"
                }`}
              >
                {note}
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] text-zinc-600 mt-2">Tabla bayan tuned to resonate at the detected Sa (tonic)</p>
        </section>

        {/* Request Access */}
        <section className="mb-12 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6 text-center" style={{ animation: "fadeInUp 0.5s ease-out 1700ms backwards" }}>
          <h3 className="text-sm font-semibold text-white">Request Access</h3>
          <p className="mt-1 text-xs text-zinc-400">Want to process your own sitar recordings?</p>
          <a
            href="mailto:stardroplin@stanford.edu"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500"
          >
            <Mail className="h-3.5 w-3.5" />
            Fayez Navid — stardroplin@stanford.edu
          </a>
        </section>
      </div>
    </div>
  );
}

/* ---- Apple Music Style Player ---- */
function MusicPlayer({ src, accent }: { src: string; accent: "orange" | "violet" }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const ac = accent === "orange"
    ? { btn: "bg-orange-500 hover:bg-orange-400 shadow-orange-500/30", bar: "bg-orange-500", barBg: "bg-orange-500/20", dot: "bg-orange-400" }
    : { btn: "bg-violet-500 hover:bg-violet-400 shadow-violet-500/30", bar: "bg-violet-500", barBg: "bg-violet-500/20", dot: "bg-violet-400" };

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause(); else a.play();
    setPlaying(!playing);
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => { setDuration(a.duration); setLoaded(true); };
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("ended", onEnd); };
  }, []);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-lg bg-black/20 p-2.5 ring-1 ring-white/[0.06]">
      <audio ref={audioRef} preload="metadata" src={src} />
      <div className="flex items-center gap-2.5">
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }} className="text-zinc-500 hover:text-zinc-300">
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button onClick={togglePlay} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ac.btn} shadow-lg transition-all active:scale-95`}>
          {playing ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`h-1.5 w-full cursor-pointer rounded-full ${ac.barBg}`} onClick={seek}>
            <div className={`h-full rounded-full ${ac.bar} relative transition-[width] duration-200`} style={{ width: `${pct}%` }}>
              {playing && <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${ac.dot} ring-2 ring-background`} />}
            </div>
          </div>
          <div className="mt-0.5 flex justify-between text-[9px] font-mono text-zinc-600">
            <span>{fmt(currentTime)}</span>
            <span>{loaded ? fmt(duration) : "..."}</span>
          </div>
        </div>
        <Volume2 className="h-3.5 w-3.5 text-zinc-600" />
      </div>
    </div>
  );
}
