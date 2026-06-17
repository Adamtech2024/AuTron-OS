export type AssetType = "video" | "audio" | "image";

export type MediaAsset = {
  id: string;
  name: string;
  type: AssetType;
  size: string;
  duration: string;
  source: "local" | "sample";
};

export type TimelineClip = {
  id: string;
  label: string;
  start: number;
  duration: number;
  color: string;
};

export type TimelineTrack = {
  id: string;
  name: string;
  type: "video" | "text" | "audio" | "effects";
  clips: TimelineClip[];
};

export type StudioProject = {
  id: string;
  name: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  durationSeconds: number;
  updatedAt: string;
  assets: MediaAsset[];
  tracks: TimelineTrack[];
};
