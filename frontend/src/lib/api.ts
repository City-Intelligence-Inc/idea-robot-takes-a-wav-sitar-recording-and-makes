const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  bpm?: number;
  key?: string;
  status?: string;
  taal?: string;
  output_s3_key?: string;
  input_filename?: string;
  created_at?: string;
}

export type CreateMusicItem = Omit<MusicItem, "id">;
export type UpdateMusicItem = Partial<CreateMusicItem>;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchTracks(): Promise<MusicItem[]> {
  return request<MusicItem[]>("/music/");
}

export async function createTrack(data: CreateMusicItem): Promise<MusicItem> {
  return request<MusicItem>("/music/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTrack(
  id: string,
  data: UpdateMusicItem
): Promise<MusicItem> {
  return request<MusicItem>(`/music/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTrack(id: string): Promise<void> {
  await fetch(`${API_BASE}/music/${id}`, {
    method: "DELETE",
  });
}
