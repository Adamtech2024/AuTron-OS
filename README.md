# AuTron Studio

AuTron Studio is a free, installable, offline-ready web video editor. The first
frontend MVP is built as a local-first PWA so people can install it from the
browser and keep using the app shell without Wi-Fi.

The editor layout is inspired by modern short-form video editors: media bin,
preview canvas, timeline tracks, tools, inspector controls, templates, and
export actions. It avoids copied branding/assets and is ready for open-source
development.

## Current MVP

- Vite + React + TypeScript frontend.
- Responsive editor UI for desktop, tablet, and mobile.
- PWA manifest with app name, icon, theme colors, and install shortcut.
- Service worker for offline app shell caching.
- Download/install CTA for supported browsers.
- Local project persistence using IndexedDB.
- Local media import metadata in the media bin.
- Timeline mock with video, text, and audio tracks.

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Backend contract

The app should remain usable without a backend. Backend sync, accounts, asset
storage, collaboration, and cloud render jobs should be optional add-ons, not
requirements for basic editing/exporting.

Recommended backend modules:

- `/auth`
- `/users`
- `/projects`
- `/assets`
- `/templates`
- `/effects`
- `/render-jobs`
- `/health`

Project timeline JSON should be treated as the source of truth for synced
projects, while raw media remains local unless the user explicitly uploads it.
