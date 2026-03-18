"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Music2,
  Library,
  Disc3,
  Headphones,
  Search,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/track-card";
import { AddTrackDialog } from "@/components/add-track-dialog";
import { EditTrackDialog } from "@/components/edit-track-dialog";
import { TrackDetailDialog } from "@/components/track-detail-dialog";
import {
  fetchTracks,
  updateTrack,
  deleteTrack,
  type MusicItem,
  type UpdateMusicItem,
} from "@/lib/api";

export default function Home() {
  const [tracks, setTracks] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editTrack, setEditTrack] = useState<MusicItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailTrack, setDetailTrack] = useState<MusicItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadTracks = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTracks();
      setTracks(data);
    } catch {
      setError("Could not connect to the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleAdd = async () => {
    await loadTracks();
  };

  const handleUpdate = async (id: string, data: UpdateMusicItem) => {
    await updateTrack(id, data);
    await loadTracks();
  };

  const handleDelete = async (track: MusicItem) => {
    await deleteTrack(track.id);
    await loadTracks();
  };

  const handleEdit = (track: MusicItem) => {
    setEditTrack(track);
    setEditOpen(true);
  };

  const filteredTracks = tracks.filter((t) => {
    const s = search.toLowerCase();
    return (
      (t.title || "").toLowerCase().includes(s) ||
      (t.artist || "").toLowerCase().includes(s) ||
      (t.genre || "").toLowerCase().includes(s) ||
      (t.key || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        {/* Top gradient orb */}
        <div className="absolute -top-[400px] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[120px]" />
        {/* Side accent */}
        <div className="absolute -right-[200px] top-[20%] h-[600px] w-[400px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
        <div className="absolute -left-[200px] top-[60%] h-[500px] w-[400px] rounded-full bg-indigo-600/[0.04] blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header / Hero */}
        <header className="pb-8 pt-12 sm:pb-12 sm:pt-20">
          <div className="flex flex-col items-center text-center">
            {/* Logo mark */}
            <div className="animate-fade-in-up mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Headphones className="h-8 w-8 text-white" />
            </div>

            {/* Brand */}
            <h1
              className="animate-fade-in-up bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text font-[var(--font-display)] text-5xl font-bold tracking-tight text-transparent sm:text-7xl"
              style={{ animationDelay: "100ms" }}
            >
              Fayez
            </h1>

            <p
              className="animate-fade-in-up mt-3 text-base text-zinc-400 sm:text-lg"
              style={{ animationDelay: "200ms" }}
            >
              Your Music Library
            </p>

            {/* Decorative line */}
            <div
              className="animate-fade-in-up mt-8 h-[1px] w-24 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </header>

        {/* Toolbar */}
        <div
          className="animate-fade-in-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center gap-3">
            <Library className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">
              Library
              {tracks.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search tracks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-white/[0.08] bg-white/[0.03] pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/40 focus:ring-violet-500/20"
              />
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={loadTracks}
              className="h-9 w-9 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Add Track */}
            <AddTrackDialog onAdd={handleAdd} />
          </div>
        </div>

        {/* Content */}
        <main className="pb-20">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={loadTracks} />
          ) : filteredTracks.length === 0 && tracks.length === 0 ? (
            <EmptyState />
          ) : filteredTracks.length === 0 ? (
            <NoResultsState search={search} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTracks.map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={(t) => {
                    setDetailTrack(t);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Dialog */}
      <TrackDetailDialog
        track={detailTrack}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Edit Dialog */}
      <EditTrackDialog
        track={editTrack}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleUpdate}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-md bg-white/[0.04]" />
            <div className="h-5 w-14 animate-pulse rounded-md bg-white/[0.04]" />
            <div className="h-5 w-10 animate-pulse rounded-md bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="animate-float mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 ring-1 ring-violet-500/20">
        <Music2 className="h-10 w-10 text-violet-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">
        No tracks yet
      </h3>
      <p className="mb-1 max-w-sm text-sm text-zinc-400">
        Your music library is empty. Add your first track to get started.
      </p>
      <p className="text-xs text-zinc-500">
        Click the <span className="text-violet-400">&quot;Add Track&quot;</span>{" "}
        button above to begin.
      </p>
    </div>
  );
}

function NoResultsState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
        <Disc3 className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">No matches</h3>
      <p className="max-w-sm text-sm text-zinc-400">
        No tracks match &quot;{search}&quot;. Try a different search term.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
        <Music2 className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        Connection Error
      </h3>
      <p className="mb-4 max-w-sm text-sm text-zinc-400">{message}</p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
