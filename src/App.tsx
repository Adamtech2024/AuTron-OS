import { useEffect, useMemo, useRef, useState } from "react";
import { isStandalone, registerServiceWorker } from "./pwa";
import type { BeforeInstallPromptEvent } from "./pwa";
import { loadProjects, saveProject } from "./storage";
import type { AssetType, MediaAsset, StudioProject, TimelineTrack } from "./types";

const sampleAssets: MediaAsset[] = [
  {
    id: "asset-intro",
    name: "Launch intro.mov",
    type: "video",
    size: "38 MB",
    duration: "00:12",
    source: "sample",
  },
  {
    id: "asset-beat",
    name: "Future beat.wav",
    type: "audio",
    size: "9 MB",
    duration: "00:30",
    source: "sample",
  },
  {
    id: "asset-cover",
    name: "Neon cover.png",
    type: "image",
    size: "2 MB",
    duration: "Still",
    source: "sample",
  },
];

const defaultTracks: TimelineTrack[] = [
  {
    id: "track-video",
    name: "Video",
    type: "video",
    clips: [
      {
        id: "clip-1",
        label: "Intro",
        start: 0,
        duration: 18,
        color: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
      },
      {
        id: "clip-2",
        label: "Product shot",
        start: 22,
        duration: 28,
        color: "linear-gradient(135deg, #22c55e, #14b8a6)",
      },
    ],
  },
  {
    id: "track-text",
    name: "Text",
    type: "text",
    clips: [
      {
        id: "clip-3",
        label: "Title overlay",
        start: 4,
        duration: 16,
        color: "linear-gradient(135deg, #f97316, #ec4899)",
      },
    ],
  },
  {
    id: "track-audio",
    name: "Audio",
    type: "audio",
    clips: [
      {
        id: "clip-4",
        label: "Beat",
        start: 0,
        duration: 58,
        color: "linear-gradient(135deg, #a3e635, #10b981)",
      },
    ],
  },
];

const starterProject: StudioProject = {
  id: "local-starter",
  name: "Untitled local project",
  aspectRatio: "16:9",
  durationSeconds: 64,
  updatedAt: new Date().toISOString(),
  assets: sampleAssets,
  tracks: defaultTracks,
};

const tools = [
  "Trim",
  "Split",
  "Text",
  "Captions",
  "Filters",
  "Transitions",
  "Stickers",
  "Audio",
  "Speed",
  "Export",
];

const templateCards = [
  "Vertical short",
  "YouTube intro",
  "Podcast clip",
  "Gaming highlight",
];

function getAssetType(file: File): AssetType {
  if (file.type.startsWith("audio")) {
    return "audio";
  }

  if (file.type.startsWith("image")) {
    return "image";
  }

  return "video";
}

function formatFileSize(bytes: number) {
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function App() {
  const [project, setProject] = useState<StudioProject>(starterProject);
  const [online, setOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState(
    isStandalone() ? "Installed" : "Ready to install"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerServiceWorker();

    loadProjects()
      .then((projects) => {
        const lastProject = projects[0];
        if (lastProject) {
          setProject(lastProject);
        } else {
          return saveProject(starterProject);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallStatus("Install available");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    saveProject(project).catch(() => undefined);
  }, [project]);

  const totalClips = useMemo(
    () => project.tracks.reduce((count, track) => count + track.clips.length, 0),
    [project.tracks]
  );

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setInstallStatus(
        isStandalone()
          ? "Already installed"
          : "Use your browser menu to install"
      );
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setInstallStatus(
      choice.outcome === "accepted" ? "Install accepted" : "Install dismissed"
    );
    setDeferredPrompt(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const importedAssets: MediaAsset[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: getAssetType(file),
      size: formatFileSize(file.size),
      duration: file.type.startsWith("image") ? "Still" : "Local",
      source: "local",
    }));

    setProject((currentProject) => ({
      ...currentProject,
      updatedAt: new Date().toISOString(),
      assets: [...importedAssets, ...currentProject.assets],
    }));
  };

  return (
    <main className="studio">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/icon.svg" alt="" />
          <div>
            <strong>AuTron Studio</strong>
            <span>Free web video editor</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {["Home", "Editor", "Templates", "Assets", "Exports", "Settings"].map(
            (item) => (
              <button className={item === "Editor" ? "active" : ""} key={item}>
                {item}
              </button>
            )
          )}
        </nav>

        <section className="install-card">
          <div>
            <span className="eyebrow">Offline mode</span>
            <h2>Download like a local app</h2>
            <p>
              Install the PWA, reopen it from your device, and keep editing
              cached projects without Wi-Fi.
            </p>
          </div>
          <button className="primary" onClick={handleInstall}>
            Download app
          </button>
          <small>{installStatus}</small>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Local-first workspace</span>
            <h1>{project.name}</h1>
          </div>
          <div className="topbar-actions">
            <span className={online ? "status online" : "status offline"}>
              {online ? "Online sync optional" : "Offline ready"}
            </span>
            <button
              className="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Import media
            </button>
            <button className="primary">Export video</button>
            <input
              ref={fileInputRef}
              className="hidden-input"
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
        </header>

        <section className="hero-grid">
          <article className="preview-panel">
            <div className="preview-toolbar">
              <span>{project.aspectRatio}</span>
              <span>1080p preview</span>
              <span>{project.durationSeconds}s</span>
            </div>
            <div className="preview-canvas">
              <div className="play-button">▶</div>
              <div className="preview-title">
                <span>AuTron Studio</span>
                <strong>Edit anywhere. Export free.</strong>
              </div>
            </div>
            <div className="transport">
              <button>⏮</button>
              <button>▶</button>
              <button>⏭</button>
              <span>00:00 / 01:04</span>
            </div>
          </article>

          <aside className="inspector">
            <div className="panel-heading">
              <span className="eyebrow">Inspector</span>
              <h2>Smart edit controls</h2>
            </div>
            <div className="control-group">
              <label>Canvas</label>
              <div className="segmented">
                {["16:9", "9:16", "1:1"].map((ratio) => (
                  <button
                    className={project.aspectRatio === ratio ? "selected" : ""}
                    key={ratio}
                    onClick={() =>
                      setProject((currentProject) => ({
                        ...currentProject,
                        aspectRatio: ratio as StudioProject["aspectRatio"],
                      }))
                    }
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            <div className="metrics">
              <div>
                <strong>{project.assets.length}</strong>
                <span>assets</span>
              </div>
              <div>
                <strong>{totalClips}</strong>
                <span>clips</span>
              </div>
              <div>
                <strong>0</strong>
                <span>limits</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="tool-strip" aria-label="Editing tools">
          {tools.map((tool) => (
            <button key={tool}>{tool}</button>
          ))}
        </section>

        <section className="editor-grid">
          <article className="media-bin">
            <div className="panel-heading">
              <span className="eyebrow">Media bin</span>
              <h2>Local assets</h2>
            </div>
            <div className="asset-list">
              {project.assets.map((asset) => (
                <div className="asset-row" key={asset.id}>
                  <span className={`asset-badge ${asset.type}`}>
                    {asset.type}
                  </span>
                  <div>
                    <strong>{asset.name}</strong>
                    <span>
                      {asset.size} · {asset.duration} · {asset.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="timeline-panel">
            <div className="panel-heading timeline-heading">
              <div>
                <span className="eyebrow">Timeline</span>
                <h2>Multi-track editor</h2>
              </div>
              <span>Autosaved locally</span>
            </div>
            <div className="timeline-ruler">
              {["00:00", "00:15", "00:30", "00:45", "01:00"].map((time) => (
                <span key={time}>{time}</span>
              ))}
            </div>
            <div className="tracks">
              {project.tracks.map((track) => (
                <div className="track" key={track.id}>
                  <div className="track-label">
                    <strong>{track.name}</strong>
                    <span>{track.type}</span>
                  </div>
                  <div className="clip-lane">
                    {track.clips.map((clip) => (
                      <div
                        className="clip"
                        key={clip.id}
                        style={{
                          marginLeft: `${clip.start}%`,
                          width: `${clip.duration}%`,
                          background: clip.color,
                        }}
                      >
                        {clip.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="template-row">
          {templateCards.map((template) => (
            <article key={template}>
              <span className="eyebrow">Template</span>
              <strong>{template}</strong>
              <p>Community-ready preset with editable tracks and assets.</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default App;
