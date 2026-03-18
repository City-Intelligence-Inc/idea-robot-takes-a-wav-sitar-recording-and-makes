"use client";

import { Music, Disc3, Gauge, KeyRound, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MusicItem } from "@/lib/api";

interface TrackCardProps {
  track: MusicItem;
  onEdit: (track: MusicItem) => void;
  onDelete: (track: MusicItem) => void;
  index: number;
}

const genreColors: Record<string, string> = {
  pop: "from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30",
  rock: "from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30",
  jazz: "from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
  classical: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
  electronic: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
  "hip-hop": "from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30",
  "r&b": "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-300 border-fuchsia-500/30",
  country: "from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/30",
  metal: "from-zinc-500/20 to-neutral-500/20 text-zinc-300 border-zinc-500/30",
  indie: "from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30",
};

const defaultGenreColor =
  "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30";

export function TrackCard({ track, onEdit, onDelete, index }: TrackCardProps) {
  const genreColor =
    genreColors[(track.genre || "").toLowerCase()] || defaultGenreColor;

  return (
    <Card
      className="group relative overflow-hidden border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-violet-500/5"
      style={{
        animationDelay: `${index * 80}ms`,
        animation: "fadeInUp 0.5s ease-out backwards",
      }}
    >
      {/* Gradient line at top */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title & Artist */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-400">
                <Music className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">
                  {track.title}
                </h3>
                <p className="truncate text-xs text-zinc-400">
                  {track.artist}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              {track.genre && (
                <Badge
                  variant="outline"
                  className={`bg-gradient-to-r ${genreColor} border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider`}
                >
                  <Disc3 className="mr-1 h-3 w-3" />
                  {track.genre}
                </Badge>
              )}

              {track.bpm && (
                <div className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400">
                  <Gauge className="h-3 w-3" />
                  <span>{track.bpm} BPM</span>
                </div>
              )}

              {track.key && (
                <div className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400">
                  <KeyRound className="h-3 w-3" />
                  <span>{track.key}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:bg-violet-500/10 hover:text-violet-300"
              onClick={() => onEdit(track)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onDelete(track)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
