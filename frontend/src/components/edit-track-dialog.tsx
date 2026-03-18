"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MusicItem, UpdateMusicItem } from "@/lib/api";

const GENRES = [
  "Pop",
  "Rock",
  "Jazz",
  "Classical",
  "Electronic",
  "Hip-Hop",
  "R&B",
  "Country",
  "Metal",
  "Indie",
  "Latin",
  "Blues",
  "Funk",
  "Soul",
  "Reggae",
];

const KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Am",
  "A#m",
  "Bm",
];

interface EditTrackDialogProps {
  track: MusicItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, data: UpdateMusicItem) => Promise<void>;
}

export function EditTrackDialog({
  track,
  open,
  onOpenChange,
  onSave,
}: EditTrackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    artist: "",
    genre: "",
    bpm: "",
    key: "",
  });

  useEffect(() => {
    if (track) {
      setForm({
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        bpm: String(track.bpm),
        key: track.key,
      });
    }
  }, [track]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;
    if (!form.title || !form.artist || !form.genre || !form.bpm || !form.key)
      return;

    setLoading(true);
    try {
      await onSave(track.id, {
        title: form.title,
        artist: form.artist,
        genre: form.genre,
        bpm: parseInt(form.bpm),
        key: form.key,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
            Edit Track
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update the track details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-zinc-300">
              Title
            </Label>
            <Input
              id="edit-title"
              placeholder="Enter track title"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, title: e.target.value })
              }
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-artist" className="text-zinc-300">
              Artist
            </Label>
            <Input
              id="edit-artist"
              placeholder="Enter artist name"
              value={form.artist}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, artist: e.target.value })
              }
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-genre" className="text-zinc-300">
                Genre
              </Label>
              <Select
                value={form.genre}
                onValueChange={(v) => v && setForm({ ...form, genre: v })}
              >
                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white focus:border-violet-500/50 focus:ring-violet-500/20">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-zinc-900">
                  {GENRES.map((g) => (
                    <SelectItem
                      key={g}
                      value={g}
                      className="text-zinc-200 focus:bg-violet-500/20 focus:text-white"
                    >
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bpm" className="text-zinc-300">
                BPM
              </Label>
              <Input
                id="edit-bpm"
                type="number"
                min={20}
                max={300}
                placeholder="120"
                value={form.bpm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, bpm: e.target.value })
                }
                className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-key" className="text-zinc-300">
              Key
            </Label>
            <Select
              value={form.key}
              onValueChange={(v) => v && setForm({ ...form, key: v })}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white focus:border-violet-500/50 focus:ring-violet-500/20">
                <SelectValue placeholder="Select key" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {KEYS.map((k) => (
                  <SelectItem
                    key={k}
                    value={k}
                    className="text-zinc-200 focus:bg-violet-500/20 focus:text-white"
                  >
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !form.title ||
                !form.artist ||
                !form.genre ||
                !form.bpm ||
                !form.key
              }
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
