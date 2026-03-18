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

const RECORDINGS = [
  {
    id: "first",
    title: "ZOOM0058 — Sitar + Tabla (First Run)",
    input: "ZOOM0058 Denoised.wav",
    taal: "Teentaal",
    beats: 16,
    bpm: 131,
    key: "C#",
    tonic_hz: 277.2,
    duration: "14:50",
    total_beats: 1872,
    inputUrl: `${S3}/inputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`,
    outputUrl: `${S3}/outputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav`,
  },
  {
    id: "second",
    title: "ZOOM0058 — Sitar + Tabla (Second Run)",
    input: "Copy of ZOOM0058 Denoised.wav",
    taal: "Teentaal",
    beats: 16,
    bpm: 131,
    key: "C#",
    tonic_hz: 277.2,
    duration: "14:50",
    total_beats: 1872,
    inputUrl: `${S3}/inputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`,
    outputUrl: `${S3}/outputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav`,
  },
];

const TAAL_PATTERN = [
  { bol: "dha", type: "bass", vibhag: 1 },
  { bol: "dhin", type: "bass", vibhag: 1 },
  { bol: "dhin", type: "bass", vibhag: 1 },
  { bol: "dha", type: "bass", vibhag: 1 },
  { bol: "dha", type: "bass", vibhag: 2 },
  { bol: "dhin", type: "bass", vibhag: 2 },
  { bol: "dhin", type: "bass", vibhag: 2 },
  { bol: "dha", type: "bass", vibhag: 2 },
  { bol: "dha", type: "treble", vibhag: 3 },
  { bol: "tin", type: "treble", vibhag: 3 },
  { bol: "tin", type: "treble", vibhag: 3 },
  { bol: "ta", type: "treble", vibhag: 3 },
  { bol: "ta", type: "treble", vibhag: 4 },
  { bol: "dhin", type: "bass", vibhag: 4 },
  { bol: "dhin", type: "bass", vibhag: 4 },
  { bol: "dha", type: "bass", vibhag: 4 },
];

const SECTIONS = [
  {
    name: "Alap",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/25",
    text: "text-blue-300",
    bar: "bg-blue-500",
    pct: 24,
    desc: "Slow, free-flowing melodic exploration",
    tabla: "Silent or barely audible — the sitar speaks alone, establishing the raga. The AI detects low spectral flux and suppresses tabla volume to near zero.",
    notation: "Sa Re Ga Ma Pa — (no tabla)",
  },
  {
    name: "Jod",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/25",
    text: "text-violet-300",
    bar: "bg-violet-500",
    pct: 58,
    desc: "Rhythmic strumming with steady pulse",
    tabla: "Medium intensity — the AI places tabla strokes on every detected beat at 60% volume. The Teentaal cycle (dha-dhin-dhin-dha) locks to the sitar's pulse, creating a rhythmic foundation.",
    notation: "Dha Dhin Dhin Dha | Dha Dhin Dhin Dha",
  },
  {
    name: "Jhala",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/25",
    text: "text-amber-300",
    bar: "bg-amber-500",
    pct: 18,
    desc: "Fast, climactic rapid-fire passages",
    tabla: "Full energy — the AI detects high spectral flux and RMS peaks, pushing tabla to 100% volume with rapid strokes. Bayan (bass) and Dayan (treble) both sound with full force.",
    notation: "DHA dhin DHIN dha | DHA DHIN dhin DHA !!!",
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[400px] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[120px]" />
        <div className="absolute -right-[200px] top-[20%] h-[600px] w-[400px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
        <div className="absolute -left-[200px] top-[60%] h-[500px] w-[400px] rounded-full bg-indigo-600/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="pb-10 pt-16 sm:pt-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25" style={{ animation: "fadeInUp 0.5s ease-out" }}>
              <Headphones className="h-8 w-8 text-white" />
            </div>
            <h1 className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl" style={{ animation: "fadeInUp 0.5s ease-out 100ms backwards" }}>
              Fayez
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base" style={{ animation: "fadeInUp 0.5s ease-out 200ms backwards" }}>
              An AI-powered audio processing system that takes a raw <span className="text-violet-400">.wav sitar recording</span>, analyzes its rhythmic structure — detecting beats, tempo, tonic, and classifying sections (alap, jod, jhala) — then algorithmically generates a synchronized <span className="text-violet-400">tabla accompaniment</span> in a chosen taal and mixes both tracks into a single output file.
            </p>
            <p className="mt-2 text-xs text-zinc-500 sm:text-sm" style={{ animation: "fadeInUp 0.5s ease-out 250ms backwards" }}>
              Built with FastAPI, librosa, pretty_midi, and NumPy. Deployed on AWS.<br />
              <span className="text-zinc-600">ENGLISH 106A — Fayez Navid</span>
            </p>
            <div className="mt-8 h-[1px] w-24 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" style={{ animation: "fadeInUp 0.5s ease-out 350ms backwards" }} />
          </div>
        </header>

        {/* What Happened to This Recording */}
        <section className="mb-14" style={{ animation: "fadeInUp 0.6s ease-out 400ms backwards" }}>
          <h2 className="mb-2 text-center text-lg font-semibold text-white">
            What the AI Did to This Recording
          </h2>
          <p className="mb-8 text-center text-xs text-zinc-500">
            ZOOM0058 Denoised.wav — a 14 minute 50 second sitar performance in Raga C#
          </p>

          {/* Step-by-step with musical context */}
          <div className="space-y-6">
            {/* Step 1: Input */}
            <StepCard
              step={1}
              delay={500}
              icon={<AudioLines className="h-5 w-5" />}
              color="text-orange-400"
              bg="bg-orange-500/10 border-orange-500/15"
              title="Input: Raw Sitar Recording"
              subtitle="244.8 MB WAV, 44.1 kHz, Stereo → Mono"
            >
              <p className="text-xs text-zinc-400">
                The recording captures a full sitar performance — starting with a meditative <em className="text-blue-300">alap</em>, building through rhythmic <em className="text-violet-300">jod</em> passages, and climaxing with rapid <em className="text-amber-300">jhala</em> sections. The AI&apos;s job: figure out the rhythm, the key, and where each section is, then add tabla that fits.
              </p>
            </StepCard>

            {/* Step 2: Beat detection */}
            <StepCard
              step={2}
              delay={650}
              icon={<Zap className="h-5 w-5" />}
              color="text-yellow-400"
              bg="bg-yellow-500/10 border-yellow-500/15"
              title="Beat & Tempo Detection"
              subtitle="librosa.beat.beat_track → 1,872 beats at 130.8 BPM"
            >
              <p className="text-xs text-zinc-400 mb-3">
                The algorithm analyzes onset strength (sudden energy spikes in the audio) to find every rhythmic pulse. It found <span className="font-mono text-yellow-300">1,872 beats</span> across 14:50 — an average tempo of <span className="font-mono text-yellow-300">130.8 BPM</span>.
              </p>
              {/* Beat visualization */}
              <div className="flex items-end gap-[2px] h-8">
                {Array.from({ length: 64 }).map((_, i) => {
                  const h = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-yellow-500/40"
                      style={{
                        height: `${h}%`,
                        animation: `fadeInUp 0.2s ease-out ${700 + i * 20}ms backwards`,
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-1 text-[9px] text-zinc-600 text-center">Onset strength envelope (simplified)</p>
            </StepCard>

            {/* Step 3: Section classification */}
            <StepCard
              step={3}
              delay={800}
              icon={<ScanSearch className="h-5 w-5" />}
              color="text-blue-400"
              bg="bg-blue-500/10 border-blue-500/15"
              title="Section Classification"
              subtitle="Spectral flux + RMS energy → alap / jod / jhala"
            >
              <p className="text-xs text-zinc-400 mb-4">
                The AI measures how quickly the sound spectrum changes (spectral flux) and how loud the signal is (RMS energy). Low flux + low energy = <em className="text-blue-300">alap</em>. Medium flux + steady energy = <em className="text-violet-300">jod</em>. High flux + peak energy = <em className="text-amber-300">jhala</em>.
              </p>

              {/* Section timeline */}
              <div className="flex h-10 overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
                {SECTIONS.map((s, i) => (
                  <button
                    key={i}
                    className={`${s.bar}/30 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-125 ${activeSection === i ? "ring-2 ring-white/30" : ""}`}
                    style={{ width: `${s.pct}%` }}
                    onClick={() => setActiveSection(i)}
                  >
                    <span className={s.text}>{s.name}</span>
                  </button>
                ))}
              </div>

              {/* Active section detail */}
              <div className={`mt-3 rounded-lg border ${SECTIONS[activeSection].color} p-3`} style={{ animation: "fadeInUp 0.3s ease-out" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${SECTIONS[activeSection].text}`}>
                    {SECTIONS[activeSection].name}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    — {SECTIONS[activeSection].pct}% of the recording
                  </span>
                </div>
                <p className={`text-xs font-medium ${SECTIONS[activeSection].text} mb-1`}>
                  {SECTIONS[activeSection].desc}
                </p>
                <p className="text-[11px] text-zinc-400 mb-2">
                  {SECTIONS[activeSection].tabla}
                </p>
                <div className="rounded bg-black/20 px-3 py-1.5 font-mono text-xs text-zinc-300">
                  {SECTIONS[activeSection].notation}
                </div>
              </div>
            </StepCard>

            {/* Step 4: Tonic */}
            <StepCard
              step={4}
              delay={950}
              icon={<Piano className="h-5 w-5" />}
              color="text-emerald-400"
              bg="bg-emerald-500/10 border-emerald-500/15"
              title="Tonic Detection"
              subtitle="Chroma features → C# (277.2 Hz)"
            >
              <p className="text-xs text-zinc-400 mb-3">
                Using pitch class profiles (chroma features), the AI builds a histogram of which notes appear most. The dominant pitch class is <span className="font-mono text-emerald-300">C# at 277.2 Hz</span> — the <em>Sa</em> (tonic) of the raga. The tabla&apos;s <em>bayan</em> (bass drum) is tuned to resonate at this frequency.
              </p>
              {/* Note circle */}
              <div className="flex justify-center gap-1.5">
                {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((note) => (
                  <div
                    key={note}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                      note === "C#"
                        ? "bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/50 scale-125"
                        : "bg-white/[0.04] text-zinc-600"
                    }`}
                  >
                    {note}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[9px] text-zinc-600">Pitch class circle — C# detected as tonic (Sa)</p>
            </StepCard>

            {/* Step 5: Tabla generation */}
            <StepCard
              step={5}
              delay={1100}
              icon={<Drum className="h-5 w-5" />}
              color="text-violet-400"
              bg="bg-violet-500/10 border-violet-500/15"
              title="Tabla Pattern Generation"
              subtitle="pretty_midi → Teentaal mapped onto 1,872 beats"
            >
              <p className="text-xs text-zinc-400 mb-4">
                The 16-beat <em>Teentaal</em> cycle is mapped onto every set of 16 detected beats. Each <em>bol</em> (syllable) corresponds to a specific tabla stroke — <span className="text-violet-300">dha/dhin</span> hit both drums (bass + treble), while <span className="text-amber-300">tin/ta</span> hit only the treble <em>dayan</em>.
              </p>

              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((vibhag) => (
                  <div key={vibhag} className="text-center">
                    <p className="text-[8px] font-bold text-zinc-600 mb-1">
                      {vibhag === 1 ? "Sam (X)" : vibhag === 3 ? "Khali (0)" : `Vibhag ${vibhag}`}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {TAAL_PATTERN.filter((b) => b.vibhag === vibhag).map((b, j) => (
                        <div
                          key={j}
                          className={`rounded px-2 py-1.5 text-center text-xs font-mono font-semibold ${
                            b.type === "bass"
                              ? "bg-violet-500/20 text-violet-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                          style={{ animation: `fadeInUp 0.3s ease-out ${1200 + (vibhag - 1) * 200 + j * 50}ms backwards` }}
                        >
                          {b.bol}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-center gap-4 text-[10px] text-zinc-500">
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-violet-500/40" />Bayan + Dayan (both drums)</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/40" />Dayan only (treble)</span>
              </div>
            </StepCard>

            {/* Step 6: Mix */}
            <StepCard
              step={6}
              delay={1250}
              icon={<Blend className="h-5 w-5" />}
              color="text-purple-400"
              bg="bg-purple-500/10 border-purple-500/15"
              title="Mix & Output"
              subtitle="Tabla level: 0.6 | Reverb: 0.3 | Output: 122.3 MB WAV"
            >
              <p className="text-xs text-zinc-400">
                The synthesized tabla track is mixed with the original sitar at 60% volume. A convolution reverb (30% wet) is applied to simulate a room, giving the tabla natural spatial depth. The final stereo .wav file is rendered — ready to play.
              </p>
            </StepCard>
          </div>
        </section>

        {/* Listen — Before & After */}
        <section className="mb-14" style={{ animation: "fadeInUp 0.6s ease-out 1500ms backwards" }}>
          <h2 className="mb-2 text-center text-lg font-semibold text-white">
            Listen — Before &amp; After
          </h2>
          <p className="mb-8 text-center text-xs text-zinc-500">
            Compare the original sitar recording with the AI-generated sitar + tabla mix
          </p>

          <div className="space-y-6">
            {RECORDINGS.map((rec, i) => (
              <div key={rec.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden" style={{ animation: `fadeInUp 0.5s ease-out ${1600 + i * 200}ms backwards` }}>
                <div className="p-5 pb-3">
                  <h3 className="text-sm font-semibold text-white mb-1">{rec.title}</h3>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded bg-violet-500/15 px-2 py-0.5 text-violet-300">{rec.taal} ({rec.beats} beats)</span>
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">{rec.bpm} BPM</span>
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">Key: {rec.key}</span>
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">{rec.duration}</span>
                  </div>
                </div>

                {/* Before */}
                <div className="px-5 pb-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-orange-400">
                    Before — Original Sitar
                  </p>
                  <MusicPlayer src={rec.inputUrl} accent="orange" />
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-violet-400">
                    <Waves className="h-3 w-3" />
                    AI Transformation
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                </div>

                {/* After */}
                <div className="px-5 pb-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                    After — Sitar + Tabla (AI Generated)
                  </p>
                  <MusicPlayer src={rec.outputUrl} accent="violet" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Request Access */}
        <section className="mb-20 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8 text-center" style={{ animation: "fadeInUp 0.6s ease-out 2000ms backwards" }}>
          <Mail className="mx-auto mb-3 h-8 w-8 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Request Access</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Want to process your own sitar recordings? Get in touch.
          </p>
          <a
            href="mailto:stardroplin@stanford.edu"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40"
          >
            <Mail className="h-4 w-4" />
            Contact Fayez Navid — stardroplin@stanford.edu
          </a>
        </section>
      </div>
    </div>
  );
}

/* ---- Step Card ---- */
function StepCard({
  step,
  delay,
  icon,
  color,
  bg,
  title,
  subtitle,
  children,
}: {
  step: number;
  delay: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border ${bg} p-5`}
      style={{ animation: `fadeInUp 0.5s ease-out ${delay}ms backwards` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`shrink-0 ${color}`}>{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold ${color}`}>STEP {step}</span>
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">{subtitle}</p>
        </div>
      </div>
      {children}
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

  const accentClasses = accent === "orange"
    ? { btn: "bg-orange-500 hover:bg-orange-400 shadow-orange-500/30", bar: "bg-orange-500", barBg: "bg-orange-500/20" }
    : { btn: "bg-violet-500 hover:bg-violet-400 shadow-violet-500/30", bar: "bg-violet-500", barBg: "bg-violet-500/20" };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => { setDuration(audio.duration); setLoaded(true); };
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/[0.06]">
      <audio ref={audioRef} preload="metadata" src={src} />

      <div className="flex items-center gap-3">
        {/* Controls */}
        <button onClick={restart} className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors">
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={togglePlay}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accentClasses.btn} shadow-lg transition-all active:scale-95`}
        >
          {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
        </button>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div
            className={`h-1.5 w-full cursor-pointer rounded-full ${accentClasses.barBg}`}
            onClick={seek}
          >
            <div
              className={`h-full rounded-full ${accentClasses.bar} transition-[width] duration-200 relative`}
              style={{ width: `${pct}%` }}
            >
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${accentClasses.bar} ring-2 ring-background shadow-lg opacity-0 group-hover:opacity-100 ${playing ? "opacity-100" : ""}`} />
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-mono text-zinc-500">
            <span>{fmt(currentTime)}</span>
            <span>{loaded ? fmt(duration) : "Loading..."}</span>
          </div>
        </div>

        <Volume2 className="h-4 w-4 shrink-0 text-zinc-600" />
      </div>
    </div>
  );
}
