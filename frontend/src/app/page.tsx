"use client";

import { useState } from "react";
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
  ChevronDown,
} from "lucide-react";

const RECORDINGS = [
  {
    title: "ZOOM0058 Sitar + Tabla (First Run)",
    input: "ZOOM0058 Denoised.wav",
    taal: "Teentaal (16 beats)",
    bpm: 131,
    key: "C#",
    duration: "14:50",
    inputUrl:
      "https://fayez-app-audio.s3.us-east-1.amazonaws.com/inputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQXPZDIX5EHE2B4FE%2F20260318%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260318T130828Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=2e92737339563706366e4d26892383d83cae6cb5e558156312ae918954482e36",
    outputUrl:
      "https://fayez-app-audio.s3.us-east-1.amazonaws.com/outputs/d6a42e1e-e0ce-4c9f-8c41-2d2715977338.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQXPZDIX5EHE2B4FE%2F20260318%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260318T130828Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=f960710855798b03ee9518f2015220c5988b97b6898731ba29a221e488ad1e70",
  },
  {
    title: "ZOOM0058 Sitar + Tabla (Second Run)",
    input: "Copy of ZOOM0058 Denoised.wav",
    taal: "Teentaal (16 beats)",
    bpm: 131,
    key: "C#",
    duration: "14:50",
    inputUrl:
      "https://fayez-app-audio.s3.us-east-1.amazonaws.com/inputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQXPZDIX5EHE2B4FE%2F20260318%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260318T130828Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=0ba572f0fa0c63ed96d0f01dd62574f51cd7eb3199158fd5688f9dbf7051031b",
    outputUrl:
      "https://fayez-app-audio.s3.us-east-1.amazonaws.com/outputs/254f949b-d8a0-4794-affc-c4e3207a6b34.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQXPZDIX5EHE2B4FE%2F20260318%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260318T130829Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=d445202fe8d88cb0cb9f729502ac91f764e90cefe399f78f9f2748238dbb6070",
  },
];

const PIPELINE_STEPS = [
  {
    icon: AudioLines,
    title: "Load Audio",
    detail: "Read the raw .wav sitar recording and convert to mono float32 arrays using soundfile",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Zap,
    title: "Beat & Tempo Detection",
    detail: "Use librosa's onset detection and beat tracking to find every rhythmic pulse — detected 1,872 beats at 130.8 BPM",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: ScanSearch,
    title: "Section Classification",
    detail: "Analyze spectral flux and RMS energy to classify each segment as alap (slow/meditative), jod (rhythmic strumming), or jhala (fast climactic passages)",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Piano,
    title: "Tonic Detection",
    detail: "Build a pitch class profile using chroma features to detect the root note — C# (277.2 Hz) — and tune the tabla samples to match",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Drum,
    title: "Tabla Pattern Generation",
    detail: "Map the 16-beat Teentaal cycle (dha dhin dhin dha / dha dhin dhin dha / dha tin tin ta / ta dhin dhin dha) onto detected beats using pretty_midi, varying intensity per section type",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Blend,
    title: "Mix & Output",
    detail: "Synthesize tabla MIDI to audio, mix with the original sitar at the configured level (0.6), apply convolution reverb (0.3) for spatial depth, render final .wav",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const TAAL_PATTERN = [
  "dha", "dhin", "dhin", "dha",
  "dha", "dhin", "dhin", "dha",
  "dha", "tin", "tin", "ta",
  "ta", "dhin", "dhin", "dha",
];

export default function Home() {
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

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
            <div
              className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25"
              style={{ animation: "fadeInUp 0.5s ease-out" }}
            >
              <Headphones className="h-8 w-8 text-white" />
            </div>

            <h1
              className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl"
              style={{ animation: "fadeInUp 0.5s ease-out 100ms backwards" }}
            >
              Fayez
            </h1>

            <p
              className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base"
              style={{ animation: "fadeInUp 0.5s ease-out 200ms backwards" }}
            >
              An AI-powered audio processing system that takes a raw{" "}
              <span className="text-violet-400">.wav sitar recording</span>, analyzes its
              rhythmic structure — detecting beats, tempo, tonic, and classifying sections
              (alap, jod, jhala) — then algorithmically generates a synchronized{" "}
              <span className="text-violet-400">tabla accompaniment</span> in a chosen
              taal and mixes both tracks into a single output file.
            </p>
            <p
              className="mt-2 text-xs text-zinc-500 sm:text-sm"
              style={{ animation: "fadeInUp 0.5s ease-out 250ms backwards" }}
            >
              Built with FastAPI, librosa, pretty_midi, and NumPy. Deployed on AWS App Runner + DynamoDB + S3.
              <br />
              <span className="text-zinc-600">ENGLISH 106A — Fayez Navid</span>
            </p>

            <div
              className="mt-8 h-[1px] w-24 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
              style={{ animation: "fadeInUp 0.5s ease-out 350ms backwards" }}
            />
          </div>
        </header>

        {/* Transformation Pipeline */}
        <section className="mb-12" style={{ animation: "fadeInUp 0.6s ease-out 400ms backwards" }}>
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            How the Transformation Works
          </h2>
          <div className="space-y-0">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i}>
                  <div
                    className={`flex items-start gap-3 rounded-lg p-4 ${step.bg}`}
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${500 + i * 150}ms backwards`,
                    }}
                  >
                    <div className={`mt-0.5 shrink-0 ${step.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${step.color}`}>
                          STEP {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {step.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="flex justify-start pl-6">
                      <div className="h-3 w-px bg-gradient-to-b from-white/10 to-transparent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Taal Pattern */}
        <section
          className="mb-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
          style={{ animation: "fadeInUp 0.6s ease-out 1400ms backwards" }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Drum className="h-5 w-5 text-amber-400" />
            Teentaal Pattern — 16 beats per cycle
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {TAAL_PATTERN.map((bol, i) => (
              <span
                key={i}
                className={`rounded px-3 py-2 text-sm font-mono font-medium ${
                  bol === "dha" || bol === "dhin"
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/20"
                    : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/20"
                }`}
                style={{
                  animation: `fadeInUp 0.3s ease-out ${1500 + i * 50}ms backwards`,
                }}
              >
                {bol}
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-zinc-500">
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-violet-500/40" />
              Bayan (bass drum)
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/40" />
              Dayan (treble drum)
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            Each beat of the taal cycle maps to a tabla stroke. The AI places these strokes
            on the detected beats of the sitar recording, adjusting volume and intensity
            based on section type — soft during alap, steady during jod, energetic during jhala.
          </p>
        </section>

        {/* Recordings — Before & After */}
        <section className="mb-12" style={{ animation: "fadeInUp 0.6s ease-out 1600ms backwards" }}>
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            Recordings — Before &amp; After
          </h2>

          <div className="space-y-4">
            {RECORDINGS.map((rec, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-violet-500/20"
              >
                {/* Header */}
                <button
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-400">
                      <AudioLines className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded bg-blue-500/15 px-2 py-0.5 text-blue-300">
                          {rec.taal}
                        </span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">
                          {rec.bpm} BPM
                        </span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">
                          Key: {rec.key}
                        </span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-zinc-400">
                          {rec.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-500 transition-transform ${
                      expandedRec === i ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded content */}
                {expandedRec === i && (
                  <div className="border-t border-white/[0.06] p-5 space-y-4" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                    {/* Before → After visual */}
                    <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-4">
                      <div className="flex-1 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                          <AudioLines className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium text-white">Sitar Only</p>
                        <p className="text-[10px] text-zinc-500">{rec.input}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-violet-400 animate-pulse" />
                      <div className="flex-1 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                          <Blend className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium text-white">Sitar + Tabla</p>
                        <p className="text-[10px] text-zinc-500">AI-generated output</p>
                      </div>
                    </div>

                    {/* Audio players */}
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-orange-400">
                          Before — Original Sitar Recording
                        </p>
                        <audio controls preload="none" className="w-full h-10" src={rec.inputUrl} />
                      </div>
                      <div>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-violet-400">
                          After — Sitar + Tabla (AI Generated)
                        </p>
                        <audio controls preload="none" className="w-full h-10" src={rec.outputUrl} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Request Access */}
        <section
          className="mb-20 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8 text-center"
          style={{ animation: "fadeInUp 0.6s ease-out 1800ms backwards" }}
        >
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
