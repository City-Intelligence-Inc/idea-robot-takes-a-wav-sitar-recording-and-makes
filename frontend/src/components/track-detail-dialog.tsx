"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Waves,
  Music2,
  Drum,
  BarChart3,
  ArrowRight,
  Zap,
  AudioLines,
  ScanSearch,
  Piano,
  Blend,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MusicItem } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Analysis {
  duration: number;
  global_tempo: number;
  tonic_hz: number;
  tonic_note: string;
  total_beats: number;
  taal_pattern: string[];
  taal_beats: number;
  sections: { section: string; start: number; end: number }[];
}

interface TrackDetailDialogProps {
  track: MusicItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sectionMeta: Record<
  string,
  { color: string; bg: string; barBg: string; label: string; tablaRole: string; icon: string }
> = {
  alap: {
    color: "text-blue-300",
    bg: "bg-blue-500/15 border-blue-500/25",
    barBg: "bg-blue-500",
    label: "Alap",
    tablaRole: "Silent or very soft — lets the sitar introduce the raga freely",
    icon: "~",
  },
  jod: {
    color: "text-violet-300",
    bg: "bg-violet-500/15 border-violet-500/25",
    barBg: "bg-violet-500",
    label: "Jod",
    tablaRole: "Steady pulse — tabla matches the sitar's rhythmic strumming",
    icon: "||",
  },
  jhala: {
    color: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/25",
    barBg: "bg-amber-500",
    label: "Jhala",
    tablaRole: "High energy — rapid, intense tabla patterns at full volume",
    icon: "!!!",
  },
  gat: {
    color: "text-emerald-300",
    bg: "bg-emerald-500/15 border-emerald-500/25",
    barBg: "bg-emerald-500",
    label: "Gat",
    tablaRole: "Full taal cycle — tight rhythmic sync with the composition",
    icon: "=",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackDetailDialog({ track, open, onOpenChange }: TrackDetailDialogProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [visibleStep, setVisibleStep] = useState(0);
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleStep(0);
      setShowSections(false);
      return;
    }
    // Animate steps appearing one by one
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 6; i++) {
      timers.push(setTimeout(() => setVisibleStep(i), i * 400));
    }
    return () => timers.forEach(clearTimeout);
  }, [open]);

  useEffect(() => {
    if (!track || !open) return;
    const raw = track.analysis;
    if (raw && typeof raw === "string") {
      try { setAnalysis(JSON.parse(raw)); } catch { setAnalysis(null); }
    } else if (raw && typeof raw === "object") {
      setAnalysis(raw as unknown as Analysis);
    } else {
      fetch(`${API_BASE}/music/${track.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.analysis) {
            setAnalysis(typeof data.analysis === "string" ? JSON.parse(data.analysis) : data.analysis);
          }
        })
        .catch(() => setAnalysis(null));
    }
  }, [track, open]);

  if (!track) return null;

  const grouped = analysis?.sections ? groupSections(analysis.sections) : [];
  const sectionSummary = analysis ? getSectionSummary(grouped, analysis.duration) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {track.title || track.input_filename || "Track Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Input → Output Visual */}
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex-1 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 ring-1 ring-orange-500/30">
              <AudioLines className="h-7 w-7 text-orange-400" />
            </div>
            <p className="text-xs font-semibold text-white">Sitar Recording</p>
            <p className="text-[10px] text-zinc-500">{track.input_filename || ".wav input"}</p>
            {analysis && (
              <p className="mt-1 text-[10px] text-zinc-500">{formatTime(analysis.duration)} long</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="h-5 w-5 text-violet-400 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">AI</span>
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 ring-1 ring-violet-500/30">
              <Blend className="h-7 w-7 text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-white">Sitar + Tabla</p>
            <p className="text-[10px] text-zinc-500">Combined output .wav</p>
            {track.output_s3_key && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 gap-1 px-2 text-[10px] text-violet-400 hover:text-violet-300"
                onClick={() => window.open(`${API_BASE}/process/${track.id}/download`, "_blank")}
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Audio Players */}
        {track.output_s3_key && (
          <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white">Listen</h3>
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-orange-400">Original Sitar</p>
                <audio
                  controls
                  preload="none"
                  className="h-8 w-full [&::-webkit-media-controls-panel]:bg-zinc-900 [&::-webkit-media-controls-current-time-display]:text-zinc-400 [&::-webkit-media-controls-time-remaining-display]:text-zinc-400"
                  src={`${API_BASE}/process/${track.id}/download/input`}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-violet-400">Sitar + Tabla (Output)</p>
                <audio
                  controls
                  preload="none"
                  className="h-8 w-full [&::-webkit-media-controls-panel]:bg-zinc-900 [&::-webkit-media-controls-current-time-display]:text-zinc-400 [&::-webkit-media-controls-time-remaining-display]:text-zinc-400"
                  src={`${API_BASE}/process/${track.id}/download`}
                />
              </div>
            </div>
          </div>
        )}

        {analysis ? (
          <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <StatPill icon={<Clock className="h-3.5 w-3.5" />} value={formatTime(analysis.duration)} label="Duration" />
              <StatPill icon={<BarChart3 className="h-3.5 w-3.5" />} value={`${analysis.global_tempo}`} label="BPM" />
              <StatPill icon={<Music2 className="h-3.5 w-3.5" />} value={analysis.tonic_note} label="Tonic" />
              <StatPill icon={<Drum className="h-3.5 w-3.5" />} value={String(analysis.total_beats)} label="Beats" />
            </div>

            {/* Step-by-Step Pipeline */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-4 text-sm font-semibold text-white">
                Transformation Pipeline
              </h3>
              <div className="space-y-0">
                <PipelineStep
                  step={1}
                  visible={visibleStep >= 1}
                  icon={<AudioLines className="h-4 w-4" />}
                  title="Load & Analyze Audio"
                  detail={`Read the ${formatTime(analysis.duration)} sitar recording and extract audio features using librosa`}
                  color="text-orange-400"
                  bg="bg-orange-500/10"
                />
                <StepConnector visible={visibleStep >= 2} />
                <PipelineStep
                  step={2}
                  visible={visibleStep >= 2}
                  icon={<Zap className="h-4 w-4" />}
                  title="Beat & Tempo Detection"
                  detail={`Found ${analysis.total_beats} beats at ${analysis.global_tempo} BPM using onset detection and beat tracking`}
                  color="text-yellow-400"
                  bg="bg-yellow-500/10"
                />
                <StepConnector visible={visibleStep >= 3} />
                <PipelineStep
                  step={3}
                  visible={visibleStep >= 3}
                  icon={<ScanSearch className="h-4 w-4" />}
                  title="Section Classification"
                  detail={`Classified ${grouped.length} sections into alap (slow), jod (rhythmic), jhala (fast) using spectral flux and RMS energy analysis`}
                  color="text-blue-400"
                  bg="bg-blue-500/10"
                />
                <StepConnector visible={visibleStep >= 4} />
                <PipelineStep
                  step={4}
                  visible={visibleStep >= 4}
                  icon={<Piano className="h-4 w-4" />}
                  title="Tonic Detection"
                  detail={`Detected root note ${analysis.tonic_note} (${analysis.tonic_hz} Hz) using pitch class profiling — tabla tuned to match`}
                  color="text-emerald-400"
                  bg="bg-emerald-500/10"
                />
                <StepConnector visible={visibleStep >= 5} />
                <PipelineStep
                  step={5}
                  visible={visibleStep >= 5}
                  icon={<Drum className="h-4 w-4" />}
                  title="Tabla Generation"
                  detail={`Generated ${track.taal || "teentaal"} tabla pattern (${analysis.taal_beats} beat cycle) using pretty_midi — intensity varies per section type`}
                  color="text-violet-400"
                  bg="bg-violet-500/10"
                />
                <StepConnector visible={visibleStep >= 6} />
                <PipelineStep
                  step={6}
                  visible={visibleStep >= 6}
                  icon={<Blend className="h-4 w-4" />}
                  title="Mix & Output"
                  detail="Mixed sitar + tabla tracks, applied convolution reverb for spatial depth, rendered final .wav"
                  color="text-purple-400"
                  bg="bg-purple-500/10"
                />
              </div>
            </div>

            {/* Taal Pattern */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Drum className="h-4 w-4 text-amber-400" />
                {track.taal || "Teentaal"} Pattern — {analysis.taal_beats} beats per cycle
              </h3>
              <div className="flex flex-wrap gap-1">
                {analysis.taal_pattern.map((bol, i) => (
                  <span
                    key={i}
                    className={`rounded px-2.5 py-1.5 text-xs font-mono font-medium transition-all ${
                      bol === "dha" || bol === "dhin"
                        ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/20"
                        : bol === "tin" || bol === "ta"
                        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/20"
                        : "bg-white/[0.04] text-zinc-500 ring-1 ring-white/[0.06]"
                    }`}
                    style={{ animationDelay: `${i * 60}ms`, animation: "fadeInUp 0.3s ease-out backwards" }}
                  >
                    {bol}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-[10px] text-zinc-500">
                <span><span className="inline-block h-2 w-2 rounded-sm bg-violet-500/40 mr-1" />Bayan (bass)</span>
                <span><span className="inline-block h-2 w-2 rounded-sm bg-amber-500/40 mr-1" />Dayan (treble)</span>
              </div>
            </div>

            {/* Section Timeline */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Waves className="h-4 w-4 text-emerald-400" />
                Section Map — How Tabla Intensity Changes
              </h3>

              {/* Timeline bar */}
              <div className="mb-2 flex h-8 overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
                {grouped.map((s, i) => {
                  const pct = ((s.end - s.start) / analysis.duration) * 100;
                  if (pct < 0.3) return null;
                  const meta = sectionMeta[s.section] || sectionMeta.jod;
                  return (
                    <div
                      key={i}
                      className={`${meta.barBg}/30 flex items-center justify-center border-r border-black/30 text-[8px] font-bold uppercase tracking-wider transition-all hover:brightness-125`}
                      style={{
                        width: `${pct}%`,
                        animation: "fadeInUp 0.4s ease-out backwards",
                        animationDelay: `${800 + i * 40}ms`,
                      }}
                      title={`${s.section}: ${formatTime(s.start)} – ${formatTime(s.end)}`}
                    >
                      {pct > 4 && <span className={meta.color}>{s.section[0].toUpperCase()}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Time markers */}
              <div className="mb-4 flex justify-between text-[9px] font-mono text-zinc-600">
                <span>0:00</span>
                <span>{formatTime(analysis.duration / 4)}</span>
                <span>{formatTime(analysis.duration / 2)}</span>
                <span>{formatTime((analysis.duration * 3) / 4)}</span>
                <span>{formatTime(analysis.duration)}</span>
              </div>

              {/* Section summary cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sectionSummary.map((s) => {
                  const meta = sectionMeta[s.name] || sectionMeta.jod;
                  return (
                    <div key={s.name} className={`rounded-lg border ${meta.bg} p-2.5 text-center`}>
                      <p className={`text-lg font-bold ${meta.color}`}>{s.pct}%</p>
                      <p className="text-[10px] font-semibold capitalize text-white">{s.name}</p>
                      <p className="text-[9px] text-zinc-500">{formatTime(s.totalDuration)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Expandable section list */}
              <button
                onClick={() => setShowSections(!showSections)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300 transition-colors"
              >
                {showSections ? "Hide" : "Show"} all {grouped.length} sections
                <ChevronDown className={`h-3 w-3 transition-transform ${showSections ? "rotate-180" : ""}`} />
              </button>

              {showSections && (
                <div className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
                  {grouped.map((s, i) => {
                    const dur = s.end - s.start;
                    if (dur < 1) return null;
                    const meta = sectionMeta[s.section] || sectionMeta.jod;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md bg-white/[0.02] px-3 py-2"
                        style={{ animation: "fadeInUp 0.3s ease-out backwards", animationDelay: `${i * 30}ms` }}
                      >
                        <Badge variant="outline" className={`${meta.bg} ${meta.color} border px-1.5 py-0 text-[9px] font-bold uppercase`}>
                          {s.section}
                        </Badge>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {formatTime(s.start)} – {formatTime(s.end)}
                        </span>
                        <span className="hidden text-[10px] text-zinc-600 sm:inline">
                          ({formatTime(dur)})
                        </span>
                        <span className="ml-auto max-w-[180px] truncate text-[10px] text-zinc-500">
                          {meta.tablaRole.split("—")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <BarChart3 className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-white">No analysis data</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500">
              This recording was processed without saving analysis. Re-process it to generate the full breakdown.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PipelineStep({
  step,
  visible,
  icon,
  title,
  detail,
  color,
  bg,
}: {
  step: number;
  visible: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg p-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${bg}`}
    >
      <div className={`mt-0.5 shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${color}`}>STEP {step}</span>
          <span className="text-xs font-semibold text-white">{title}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{detail}</p>
      </div>
    </div>
  );
}

function StepConnector({ visible }: { visible: boolean }) {
  return (
    <div className={`flex justify-start pl-5 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="h-3 w-px bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="text-violet-400">{icon}</span>
      <div>
        <p className="text-xs font-bold text-white">{value}</p>
        <p className="text-[9px] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function getSectionSummary(
  grouped: { section: string; start: number; end: number }[],
  totalDuration: number
): { name: string; totalDuration: number; pct: number }[] {
  const map: Record<string, number> = {};
  for (const s of grouped) {
    map[s.section] = (map[s.section] || 0) + (s.end - s.start);
  }
  return Object.entries(map)
    .map(([name, dur]) => ({
      name,
      totalDuration: dur,
      pct: Math.round((dur / totalDuration) * 100),
    }))
    .sort((a, b) => b.totalDuration - a.totalDuration);
}

function groupSections(
  sections: { section: string; start: number; end: number }[]
): { section: string; start: number; end: number }[] {
  if (!sections.length) return [];
  const grouped: { section: string; start: number; end: number }[] = [];
  let current = { ...sections[0] };
  for (let i = 1; i < sections.length; i++) {
    if (sections[i].section === current.section) {
      current.end = sections[i].end;
    } else {
      grouped.push(current);
      current = { ...sections[i] };
    }
  }
  grouped.push(current);
  return grouped;
}
