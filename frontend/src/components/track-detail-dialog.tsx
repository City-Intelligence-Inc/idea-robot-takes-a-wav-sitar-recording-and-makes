"use client";

import { useState, useEffect } from "react";
import { Clock, Waves, Music2, Drum, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

const sectionColors: Record<string, string> = {
  alap: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  jod: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  jhala: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  gat: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const sectionDescriptions: Record<string, string> = {
  alap:
    "Slow, meditative introduction — tabla plays soft, sparse patterns to let the sitar melody breathe",
  jod: "Rhythmic development — tabla adds a steady pulse, matching the sitar's rhythmic strumming",
  jhala:
    "Fast, climactic passages — tabla plays intense, rapid patterns with full energy",
  gat: "Composed section — tabla plays the full taal cycle in tight sync with the sitar composition",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackDetailDialog({
  track,
  open,
  onOpenChange,
}: TrackDetailDialogProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!track || !open) return;
    // Try to load analysis from the /process/jobs endpoint or directly from the item
    const raw = track.analysis;
    if (raw && typeof raw === "string") {
      try {
        setAnalysis(JSON.parse(raw));
      } catch {
        setAnalysis(null);
      }
    } else if (raw && typeof raw === "object") {
      setAnalysis(raw as unknown as Analysis);
    } else {
      // Fetch from API
      fetch(`${API_BASE}/music/${track.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.analysis) {
            const a =
              typeof data.analysis === "string"
                ? JSON.parse(data.analysis)
                : data.analysis;
            setAnalysis(a);
          }
        })
        .catch(() => setAnalysis(null));
    }
  }, [track, open]);

  if (!track) return null;

  // Group consecutive same-type sections for cleaner display
  const groupedSections = analysis?.sections
    ? groupSections(analysis.sections)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
            {track.title || track.input_filename || "Track Details"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            How the tabla accompaniment was generated for this recording.
          </DialogDescription>
        </DialogHeader>

        {analysis ? (
          <div className="space-y-5">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label="Duration"
                value={formatTime(analysis.duration)}
              />
              <StatCard
                icon={<BarChart3 className="h-4 w-4" />}
                label="Tempo"
                value={`${analysis.global_tempo} BPM`}
              />
              <StatCard
                icon={<Music2 className="h-4 w-4" />}
                label="Tonic"
                value={`${analysis.tonic_note} (${analysis.tonic_hz} Hz)`}
              />
              <StatCard
                icon={<Drum className="h-4 w-4" />}
                label="Total Beats"
                value={String(analysis.total_beats)}
              />
            </div>

            {/* Taal Pattern */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Drum className="h-4 w-4 text-amber-400" />
                Taal Pattern ({track.taal || "teentaal"} — {analysis.taal_beats}{" "}
                beats)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.taal_pattern.map((bol, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-2 py-1 text-xs font-mono ${
                      bol === "dha" || bol === "dhin"
                        ? "bg-violet-500/20 text-violet-300"
                        : bol === "tin" || bol === "ta"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/[0.06] text-zinc-400"
                    }`}
                  >
                    {bol}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Each beat of the taal cycle is a tabla stroke. The AI maps these
                strokes to the sitar&apos;s rhythm, adjusting intensity per section.
              </p>
            </div>

            {/* How It Works */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Waves className="h-4 w-4 text-violet-400" />
                How the Transformation Works
              </h3>
              <ol className="space-y-2 text-xs text-zinc-400">
                <li className="flex gap-2">
                  <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                    1
                  </span>
                  <span>
                    <strong className="text-zinc-300">Beat detection</strong> —
                    Detects the sitar&apos;s rhythm and finds {analysis.total_beats}{" "}
                    beats at ~{analysis.global_tempo} BPM
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                    2
                  </span>
                  <span>
                    <strong className="text-zinc-300">
                      Section classification
                    </strong>{" "}
                    — Identifies alap (slow), jod (rhythmic), jhala (fast), and
                    gat (composed) sections using spectral analysis
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                    3
                  </span>
                  <span>
                    <strong className="text-zinc-300">Tonic detection</strong> —
                    Finds the root note ({analysis.tonic_note} at{" "}
                    {analysis.tonic_hz} Hz) to tune tabla pitch
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                    4
                  </span>
                  <span>
                    <strong className="text-zinc-300">
                      Tabla pattern generation
                    </strong>{" "}
                    — Places tabla strokes ({track.taal || "teentaal"}) on each
                    beat, with intensity varying by section type
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                    5
                  </span>
                  <span>
                    <strong className="text-zinc-300">Mix & reverb</strong> —
                    Mixes the tabla track with the original sitar at the
                    specified level and adds reverb for depth
                  </span>
                </li>
              </ol>
            </div>

            {/* Section Timeline */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Section Timeline — Where Tabla Was Added
              </h3>

              {/* Visual timeline bar */}
              <div className="mb-4 flex h-6 overflow-hidden rounded-md">
                {groupedSections.map((s, i) => {
                  const pct =
                    ((s.end - s.start) / analysis.duration) * 100;
                  if (pct < 0.3) return null;
                  const bg =
                    s.section === "alap"
                      ? "bg-blue-500/40"
                      : s.section === "jod"
                      ? "bg-violet-500/40"
                      : s.section === "jhala"
                      ? "bg-amber-500/40"
                      : "bg-emerald-500/40";
                  return (
                    <div
                      key={i}
                      className={`${bg} border-r border-black/20 transition-opacity hover:opacity-80`}
                      style={{ width: `${pct}%` }}
                      title={`${s.section}: ${formatTime(s.start)} – ${formatTime(s.end)}`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-3 text-[10px]">
                {Object.entries(sectionColors).map(([name, cls]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-sm ${cls.split(" ")[0]}`} />
                    <span className="capitalize text-zinc-400">{name}</span>
                  </div>
                ))}
              </div>

              {/* Section list */}
              <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {groupedSections.map((s, i) => {
                  const duration = s.end - s.start;
                  if (duration < 1) return null;
                  const cls = sectionColors[s.section] || sectionColors.jod;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md bg-white/[0.02] px-2.5 py-1.5"
                    >
                      <Badge
                        variant="outline"
                        className={`${cls} border px-1.5 py-0 text-[9px] font-bold uppercase`}
                      >
                        {s.section}
                      </Badge>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {formatTime(s.start)} – {formatTime(s.end)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        ({formatTime(duration)})
                      </span>
                      <span className="ml-auto text-[10px] text-zinc-500">
                        {sectionDescriptions[s.section]?.split("—")[0] || ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm text-zinc-400">
              No analysis data available for this recording.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Analysis is generated during the sitar → tabla processing step.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <div className="mb-1 flex justify-center text-violet-400">{icon}</div>
      <p className="text-xs font-medium text-white">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

/** Merge consecutive sections of the same type for cleaner display */
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
