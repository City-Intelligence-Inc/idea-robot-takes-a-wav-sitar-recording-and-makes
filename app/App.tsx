import { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Dimensions,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";

const API_URL = "http://localhost:8001";
const TAALS = ["teentaal", "ektaal", "rupak", "jhaptaal", "keherwa"];
const SCREEN_WIDTH = Dimensions.get("window").width;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Section = { section: string; start: number; end: number };

type Analysis = {
  duration: number;
  global_tempo: number;
  tonic_hz: number;
  tonic_note: string;
  total_beats: number;
  sections: Section[];
  taal_pattern: string[];
  taal_beats: number;
};

type Job = {
  id: string;
  input_s3_key: string;
  output_s3_key: string;
  input_filename: string;
  taal: string;
  tabla_level: string;
  reverb: string;
  status: string;
  created_at: string;
  analysis?: Analysis;
};

type Tab = "create" | "gallery";

// ---------------------------------------------------------------------------
// Section colors and labels
// ---------------------------------------------------------------------------

const SECTION_STYLES: Record<string, { bg: string; border: string; label: string; desc: string }> = {
  alap: {
    bg: "#1A1A1A",
    border: "#333",
    label: "Alap",
    desc: "No tabla — free melodic exploration",
  },
  jod: {
    bg: "#2A2215",
    border: "#C8B88A55",
    label: "Jod",
    desc: "Light theka — sparse tabla on strong beats",
  },
  jhala: {
    bg: "#3D2E10",
    border: "#C8B88A",
    label: "Jhala",
    desc: "Full tabla — complete taal cycle",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Visual timeline showing where tabla plays */
function SectionTimeline({ sections, duration }: { sections: Section[]; duration: number }) {
  const barWidth = SCREEN_WIDTH - 76; // card padding
  return (
    <View style={tl.container}>
      {/* Timeline bar */}
      <View style={tl.bar}>
        {sections.map((s, i) => {
          const pct = ((s.end - s.start) / duration) * 100;
          const style = SECTION_STYLES[s.section] || SECTION_STYLES.jod;
          return (
            <View
              key={i}
              style={[
                tl.segment,
                {
                  width: `${pct}%`,
                  backgroundColor: style.bg,
                  borderColor: style.border,
                  borderWidth: s.section === "jhala" ? 1 : 0,
                },
              ]}
            />
          );
        })}
      </View>
      {/* Time labels */}
      <View style={tl.timeRow}>
        <Text style={tl.timeText}>{fmtTime(0)}</Text>
        <Text style={tl.timeText}>{fmtTime(duration / 2)}</Text>
        <Text style={tl.timeText}>{fmtTime(duration)}</Text>
      </View>
    </View>
  );
}

/** Musical notation display for the taal pattern */
function TaalNotation({ pattern, beats, taal }: { pattern: string[]; beats: number; taal: string }) {
  // Split into vibhags (groups of 4 for teentaal, varies by taal)
  const vibhagSize = taal === "rupak" ? 3 : taal === "jhaptaal" ? 2 : 4;
  const groups: string[][] = [];
  for (let i = 0; i < pattern.length; i += vibhagSize) {
    groups.push(pattern.slice(i, i + vibhagSize));
  }

  return (
    <View style={tn.container}>
      <View style={tn.header}>
        <Text style={tn.taalName}>{taal}</Text>
        <Text style={tn.beatCount}>{beats} beats</Text>
      </View>
      <View style={tn.staff}>
        {/* Staff lines */}
        <View style={tn.staffLine} />
        <View style={[tn.staffLine, { top: "50%" }]} />
        {/* Bol groups */}
        <View style={tn.bolRow}>
          {groups.map((group, gi) => (
            <View key={gi} style={tn.vibhag}>
              {gi === 0 && <View style={tn.samMarker} />}
              {group.map((bol, bi) => (
                <View key={bi} style={tn.bolCell}>
                  <Text
                    style={[
                      tn.bolText,
                      gi === 0 && bi === 0 && tn.bolSam,
                    ]}
                  >
                    {bol}
                  </Text>
                </View>
              ))}
              {gi < groups.length - 1 && <View style={tn.barLine} />}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Section legend */
function SectionLegend() {
  return (
    <View style={lg.container}>
      {(["alap", "jod", "jhala"] as const).map((key) => {
        const s = SECTION_STYLES[key];
        return (
          <View key={key} style={lg.row}>
            <View style={[lg.dot, { backgroundColor: s.border }]} />
            <View>
              <Text style={lg.label}>{s.label}</Text>
              <Text style={lg.desc}>{s.desc}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Section breakdown list */
function SectionBreakdown({ sections, duration }: { sections: Section[]; duration: number }) {
  // Merge very short adjacent sections of same type
  const merged: Section[] = [];
  for (const s of sections) {
    const last = merged[merged.length - 1];
    if (last && last.section === s.section) {
      last.end = s.end;
    } else {
      merged.push({ ...s });
    }
  }

  // Only show sections longer than 3 seconds
  const visible = merged.filter((s) => s.end - s.start > 3);

  return (
    <View style={sb.container}>
      {visible.map((s, i) => {
        const style = SECTION_STYLES[s.section] || SECTION_STYLES.jod;
        const pct = (((s.end - s.start) / duration) * 100).toFixed(1);
        return (
          <View key={i} style={[sb.row, { borderLeftColor: style.border }]}>
            <Text style={sb.time}>
              {fmtTime(s.start)} – {fmtTime(s.end)}
            </Text>
            <View style={sb.right}>
              <Text style={[sb.label, { color: style.border }]}>
                {style.label}
              </Text>
              <Text style={sb.pct}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Stats row showing key analysis numbers */
function AnalysisStats({ analysis }: { analysis: Analysis }) {
  const stats = [
    { label: "Tempo", value: `${analysis.global_tempo}`, unit: "BPM" },
    { label: "Tonic", value: analysis.tonic_note, unit: `${analysis.tonic_hz} Hz` },
    { label: "Duration", value: fmtTime(analysis.duration), unit: "" },
    { label: "Beats", value: `${analysis.total_beats}`, unit: "" },
  ];

  return (
    <View style={as.container}>
      {stats.map((s, i) => (
        <View key={i} style={as.stat}>
          <Text style={as.value}>{s.value}</Text>
          <Text style={as.unit}>{s.unit}</Text>
          <Text style={as.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [tab, setTab] = useState<Tab>("gallery");

  // Create tab state
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedTaal, setSelectedTaal] = useState("teentaal");
  const [tablaLevel, setTablaLevel] = useState(0.6);
  const [reverb, setReverb] = useState(0.3);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Gallery state
  const [galleryJobs, setGalleryJobs] = useState<Job[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingType, setPlayingType] = useState<"input" | "output" | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch(`${API_URL}/process/jobs`);
      if (!res.ok) throw new Error("Failed to load jobs");
      const jobs: Job[] = await res.json();
      jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setGalleryJobs(jobs);
    } catch (err: any) {
      // silently fail on initial load
    } finally {
      setLoadingGallery(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGallery();
    setRefreshing(false);
  }, []);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/wav", "audio/x-wav", "audio/wave", "audio/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setUploadProgress("Uploading...");
    try {
      const formData = new FormData();
      const filePayload: any = {
        uri: selectedFile.uri,
        name: selectedFile.name || "recording.wav",
        type: "audio/wav",
      };
      formData.append("file", filePayload);
      formData.append("taal", selectedTaal);
      formData.append("tabla_level", tablaLevel.toString());
      formData.append("reverb", reverb.toString());

      setUploadProgress("Analyzing & generating tabla...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      const response = await fetch(`${API_URL}/process/`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(await response.text());

      setSelectedFile(null);
      setUploadProgress(null);
      setTab("gallery");
      await loadGallery();
    } catch (err: any) {
      Alert.alert(
        err.name === "AbortError" ? "Timeout" : "Failed",
        err.message || "Unknown error"
      );
    } finally {
      setProcessing(false);
      setUploadProgress(null);
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingId(null);
    setPlayingType(null);
  };

  const playAudio = async (jobId: string, type: "input" | "output") => {
    try {
      if (playingId === jobId && playingType === type) {
        await stopPlayback();
        return;
      }
      await stopPlayback();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const suffix = type === "input" ? "/input" : "";
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${API_URL}/process/download/${jobId}${suffix}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(jobId);
      setPlayingType(type);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          setPlayingType(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (err: any) {
      Alert.alert("Playback error", err.message || "Could not play audio");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "create" && styles.tabBtnActive]}
          onPress={() => setTab("create")}
        >
          <Text style={[styles.tabText, tab === "create" && styles.tabTextActive]}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "gallery" && styles.tabBtnActive]}
          onPress={() => setTab("gallery")}
        >
          <Text style={[styles.tabText, tab === "gallery" && styles.tabTextActive]}>Gallery</Text>
          {galleryJobs.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{galleryJobs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================== CREATE TAB ==================== */}
      {tab === "create" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Fayez</Text>
            <Text style={styles.subtitle}>Sitar + AI Tabla Generator</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>1. SELECT RECORDING</Text>
            <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
              <Text style={styles.pickText}>
                {selectedFile ? selectedFile.name : "Pick a .wav file"}
              </Text>
            </TouchableOpacity>
            {selectedFile && (
              <Text style={styles.fileSize}>
                {(selectedFile.size! / (1024 * 1024)).toFixed(1)} MB
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>2. CHOOSE TAAL</Text>
            <View style={styles.chipRow}>
              {TAALS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTaal === t && styles.chipActive]}
                  onPress={() => setSelectedTaal(t)}
                >
                  <Text style={[styles.chipText, selectedTaal === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>3. MIX SETTINGS</Text>
            <Text style={styles.settingLabel}>Tabla Level</Text>
            <View style={styles.chipRow}>
              {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniChip, tablaLevel === v && styles.chipActive]}
                  onPress={() => setTablaLevel(v)}
                >
                  <Text style={[styles.miniChipText, tablaLevel === v && styles.chipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.settingLabel, { marginTop: 12 }]}>Reverb</Text>
            <View style={styles.chipRow}>
              {[0.0, 0.1, 0.2, 0.3, 0.5, 0.7].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniChip, reverb === v && styles.chipActive]}
                  onPress={() => setReverb(v)}
                >
                  <Text style={[styles.miniChipText, reverb === v && styles.chipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bigButton, (!selectedFile || processing) && styles.bigButtonDisabled]}
            onPress={processFile}
            disabled={!selectedFile || processing}
          >
            {processing ? (
              <View style={styles.row}>
                <ActivityIndicator color="#0D0D0D" size="small" />
                <Text style={styles.bigButtonText}> {uploadProgress}</Text>
              </View>
            ) : (
              <Text style={styles.bigButtonText}>Generate Tabla Track</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* ==================== GALLERY TAB ==================== */}
      {tab === "gallery" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8B88A" />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Your Music</Text>
            <Text style={styles.subtitle}>
              {galleryJobs.length} track{galleryJobs.length !== 1 ? "s" : ""} generated
            </Text>
          </View>

          {loadingGallery && galleryJobs.length === 0 && (
            <View style={styles.center}>
              <ActivityIndicator color="#C8B88A" size="large" />
            </View>
          )}

          {!loadingGallery && galleryJobs.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No tracks yet</Text>
              <Text style={styles.emptyDesc}>
                Upload a sitar or sarod recording to generate your first tabla track
              </Text>
              <TouchableOpacity style={styles.bigButton} onPress={() => setTab("create")}>
                <Text style={styles.bigButtonText}>Create First Track</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Section legend (show once if any jobs have analysis) */}
          {galleryJobs.some((j) => j.analysis) && <SectionLegend />}

          {galleryJobs.map((job) => {
            const expanded = expandedId === job.id;
            const hasAnalysis = !!job.analysis;

            return (
              <View key={job.id} style={styles.galleryCard}>
                {/* Header */}
                <TouchableOpacity
                  style={gc.header}
                  onPress={() => setExpandedId(expanded ? null : job.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={gc.filename} numberOfLines={1}>
                      {job.input_filename}
                    </Text>
                    <Text style={gc.date}>{fmtDate(job.created_at)}</Text>
                  </View>
                  <View style={gc.statusBadge}>
                    <Text style={gc.statusText}>{job.status}</Text>
                  </View>
                </TouchableOpacity>

                {/* Mini timeline (always visible) */}
                {hasAnalysis && (
                  <SectionTimeline
                    sections={job.analysis!.sections}
                    duration={job.analysis!.duration}
                  />
                )}

                {/* Tags */}
                <View style={gc.tagRow}>
                  <View style={gc.tag}>
                    <Text style={gc.tagText}>{job.taal}</Text>
                  </View>
                  {hasAnalysis && (
                    <>
                      <View style={gc.tag}>
                        <Text style={gc.tagText}>
                          {job.analysis!.global_tempo} BPM
                        </Text>
                      </View>
                      <View style={gc.tag}>
                        <Text style={gc.tagText}>
                          Sa = {job.analysis!.tonic_note}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={gc.tag}>
                    <Text style={gc.tagText}>tabla {job.tabla_level}</Text>
                  </View>
                </View>

                {/* Play buttons */}
                <View style={gc.playRow}>
                  <TouchableOpacity
                    style={[
                      gc.playBtn,
                      gc.playBtnOrig,
                      playingId === job.id && playingType === "input" && gc.playBtnActive,
                    ]}
                    onPress={() => playAudio(job.id, "input")}
                  >
                    <Text
                      style={[
                        gc.playBtnText,
                        playingId === job.id && playingType === "input" && gc.playBtnTextActive,
                      ]}
                    >
                      {playingId === job.id && playingType === "input" ? "Stop" : "Original"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      gc.playBtn,
                      gc.playBtnMixed,
                      playingId === job.id && playingType === "output" && gc.playBtnActive,
                    ]}
                    onPress={() => playAudio(job.id, "output")}
                  >
                    <Text
                      style={[
                        gc.playBtnText,
                        playingId === job.id && playingType === "output" && gc.playBtnTextActive,
                      ]}
                    >
                      {playingId === job.id && playingType === "output" ? "Stop" : "With Tabla"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Expanded detail */}
                {expanded && hasAnalysis && (
                  <View style={gc.detail}>
                    <AnalysisStats analysis={job.analysis!} />
                    <TaalNotation
                      pattern={job.analysis!.taal_pattern}
                      beats={job.analysis!.taal_beats}
                      taal={job.taal}
                    />
                    <Text style={gc.sectionTitle}>Section Breakdown</Text>
                    <SectionBreakdown
                      sections={job.analysis!.sections}
                      duration={job.analysis!.duration}
                    />
                    <View style={gc.s3Box}>
                      <Text style={gc.s3Label}>S3 Output</Text>
                      <Text style={gc.s3Key}>{job.output_s3_key}</Text>
                    </View>
                  </View>
                )}

                {/* Expand hint */}
                <TouchableOpacity
                  style={gc.expandHint}
                  onPress={() => setExpandedId(expanded ? null : job.id)}
                >
                  <Text style={gc.expandText}>
                    {expanded ? "Show less" : "Show analysis"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#0D0D0D",
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabBtnActive: { backgroundColor: "#1A1A1A" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#666" },
  tabTextActive: { color: "#F5F0E8" },
  badge: {
    backgroundColor: "#C8B88A",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: "#0D0D0D", fontSize: 12, fontWeight: "700" },

  // Header
  header: { marginBottom: 24, marginTop: 8 },
  title: { fontSize: 36, fontWeight: "800", color: "#F5F0E8", letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#8A8578", marginTop: 4 },

  // Cards
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A8578",
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  // File picker
  pickButton: {
    backgroundColor: "#252525",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
    alignItems: "center",
  },
  pickText: { color: "#C8B88A", fontSize: 16, fontWeight: "500" },
  fileSize: { color: "#666", fontSize: 13, marginTop: 8, textAlign: "center" },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#252525",
    borderWidth: 1,
    borderColor: "#333",
  },
  chipActive: { backgroundColor: "#C8B88A", borderColor: "#C8B88A" },
  chipText: { color: "#999", fontSize: 14, fontWeight: "500" },
  chipTextActive: { color: "#0D0D0D", fontWeight: "700" },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#252525",
    borderWidth: 1,
    borderColor: "#333",
  },
  miniChipText: { color: "#999", fontSize: 13 },
  settingLabel: { color: "#999", fontSize: 13, marginBottom: 8 },

  // Big button
  bigButton: {
    backgroundColor: "#C8B88A",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  bigButtonDisabled: { backgroundColor: "#333" },
  bigButtonText: { color: "#0D0D0D", fontSize: 17, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },

  // Empty / loading
  center: { alignItems: "center", paddingTop: 80, paddingHorizontal: 30 },
  emptyTitle: { color: "#F5F0E8", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { color: "#666", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },

  // Gallery card
  galleryCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
});

// Gallery card styles
const gc = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  filename: { color: "#F5F0E8", fontSize: 16, fontWeight: "600" },
  date: { color: "#555", fontSize: 12, marginTop: 2 },
  statusBadge: { backgroundColor: "#1B3A2A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: "#4ADE80", fontSize: 12, fontWeight: "600" },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: { backgroundColor: "#252525", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { color: "#8A8578", fontSize: 12, fontWeight: "500" },

  playRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  playBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  playBtnOrig: { backgroundColor: "#252525", borderColor: "#333" },
  playBtnMixed: { backgroundColor: "#2A2215", borderColor: "#C8B88A44" },
  playBtnActive: { backgroundColor: "#C8B88A", borderColor: "#C8B88A" },
  playBtnText: { color: "#F5F0E8", fontSize: 14, fontWeight: "600" },
  playBtnTextActive: { color: "#0D0D0D" },

  detail: { marginTop: 14, borderTopWidth: 1, borderTopColor: "#2A2A2A", paddingTop: 14 },
  sectionTitle: {
    color: "#8A8578",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 10,
  },

  s3Box: { backgroundColor: "#111", borderRadius: 8, padding: 10, marginTop: 14 },
  s3Label: { color: "#555", fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  s3Key: {
    color: "#444",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },

  expandHint: { alignItems: "center", paddingTop: 8 },
  expandText: { color: "#C8B88A", fontSize: 13, fontWeight: "500" },
});

// Timeline styles
const tl = StyleSheet.create({
  container: { marginBottom: 14 },
  bar: {
    flexDirection: "row",
    height: 24,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  segment: { height: "100%" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  timeText: { color: "#555", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

// Taal notation styles
const tn = StyleSheet.create({
  container: { marginTop: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  taalName: { color: "#C8B88A", fontSize: 16, fontWeight: "700", textTransform: "capitalize" },
  beatCount: { color: "#666", fontSize: 12 },
  staff: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  staffLine: {
    position: "absolute",
    left: 14,
    right: 14,
    top: "25%",
    height: 1,
    backgroundColor: "#222",
  },
  bolRow: { flexDirection: "row", flexWrap: "wrap" },
  vibhag: { flexDirection: "row", alignItems: "center", position: "relative" },
  samMarker: {
    position: "absolute",
    top: -6,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8B88A",
  },
  bolCell: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bolText: {
    color: "#F5F0E8",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  bolSam: { color: "#C8B88A", fontWeight: "700" },
  barLine: { width: 1, height: 28, backgroundColor: "#333", marginHorizontal: 4 },
});

// Legend styles
const lg = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 3 },
  label: { color: "#F5F0E8", fontSize: 13, fontWeight: "600" },
  desc: { color: "#666", fontSize: 11 },
});

// Section breakdown styles
const sb = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  time: {
    color: "#999",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 12, fontWeight: "600" },
  pct: { color: "#555", fontSize: 11 },
});

// Analysis stats styles
const as = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: { alignItems: "center" },
  value: { color: "#F5F0E8", fontSize: 20, fontWeight: "700" },
  unit: { color: "#666", fontSize: 11, marginTop: 1 },
  label: { color: "#8A8578", fontSize: 11, fontWeight: "600", marginTop: 4 },
});
