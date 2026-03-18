"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Loader2, Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TAALS = [
  { value: "teentaal", label: "Teentaal (16 beats)" },
  { value: "ektaal", label: "Ektaal (12 beats)" },
  { value: "jhaptaal", label: "Jhaptaal (10 beats)" },
  { value: "rupak", label: "Rupak (7 beats)" },
  { value: "dadra", label: "Dadra (6 beats)" },
  { value: "keherwa", label: "Keherwa (8 beats)" },
];

interface AddTrackDialogProps {
  onAdd: () => Promise<void>;
}

export function AddTrackDialog({ onAdd }: AddTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [taal, setTaal] = useState("teentaal");
  const [tablaLevel, setTablaLevel] = useState("0.6");
  const [reverb, setReverb] = useState("0.3");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.toLowerCase().endsWith(".wav")) {
      setFile(dropped);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setProgress("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taal", taal);
      formData.append("tabla_level", tablaLevel);
      formData.append("reverb", reverb);

      setProgress("Processing sitar → tabla (this may take a few minutes)...");

      const res = await fetch(`${API_BASE}/process/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }

      setProgress("Done!");
      setFile(null);
      setTaal("teentaal");
      setTablaLevel("0.6");
      setReverb("0.3");
      setOpen(false);
      await onAdd();
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40"
      >
        <Plus className="h-4 w-4" />
        Add Track
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
            Process Sitar Recording
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload a .wav sitar recording and we&apos;ll generate a tabla accompaniment track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-violet-500 bg-violet-500/10"
                : file
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FileAudio className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-zinc-500">{fileSizeMB} MB</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-7 gap-1 text-xs text-zinc-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-3 w-3" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Drag & drop your .wav file here
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    or click to browse — WAV files only
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Taal</Label>
              <Select
                value={taal}
                onValueChange={(v) => v && setTaal(v)}
              >
                <SelectTrigger className="h-8 w-full border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-zinc-900">
                  {TAALS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs text-zinc-200">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Tabla Level</Label>
              <Input
                type="number"
                min={0.1}
                max={1.0}
                step={0.1}
                value={tablaLevel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTablaLevel(e.target.value)}
                className="h-8 border-white/10 bg-white/5 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Reverb</Label>
              <Input
                type="number"
                min={0}
                max={1.0}
                step={0.1}
                value={reverb}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReverb(e.target.value)}
                className="h-8 border-white/10 bg-white/5 text-xs text-white"
              />
            </div>
          </div>

          {/* Progress */}
          {loading && progress && (
            <div className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
              {progress}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Process Recording
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
