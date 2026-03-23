# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Qoder** — a Chrome Extension (Manifest V3) that summarizes webpages using AI services, with text-to-speech playback. The main source code lives in the `ai-page-summarizer/` subdirectory.

## Commands

All commands run from `ai-page-summarizer/`:

```bash
cd ai-page-summarizer

npm run build       # Full production build (UI bundles + content script)
npm run dev         # Watch mode for development
npm run typecheck   # TypeScript validation (vue-tsc --noEmit)
```

Build produces `dist/` with all extension assets ready to load in Chrome (`chrome://extensions` → Load unpacked).

## Architecture

### Chrome Extension Components

The extension has four independently built pieces communicating via `chrome.runtime` message passing:

```
Content Script ←→ Background Service Worker ←→ Side Panel / Popup / Options
```

- **Background** (`src/background/index.ts`) — Service Worker; orchestrates summarization, relays messages between content script and UI
- **Content Script** (`src/content/index.ts`) — Injected into all pages; extracts page content using `@mozilla/readability` and can render a floating widget
- **Side Panel** (`src/sidepanel/`) — Primary UI, opened when user clicks extension icon
- **Popup / Options** (`src/popup/`, `src/options/`) — Alternative UI and settings page

### Build Configuration

Two Vite configs exist because the content script must be built separately (different CSP requirements, no minification):

- `vite.config.ts` — Builds sidepanel, popup, options, and background
- `vite.config.content.ts` — Builds content script only

`npm run build` runs both in sequence.

### Message Protocol

All IPC uses typed messages defined in `src/types/index.ts`:
- UI → Background: `SUMMARIZE`, `STOP_SUMMARIZE`, `GET_SETTINGS`, `SAVE_SETTINGS`
- Content → Background: `GET_PAGE_CONTENT`, `EXTRACT_CONTENT`
- Background → UI: `SUMMARY_CHUNK` (streaming), `SUMMARY_COMPLETE`, `SUMMARY_ERROR`

### AI Provider System

`src/services/ai-service.ts` is a factory that returns the appropriate provider. All providers implement:
```typescript
interface AIProvider {
  summarize(content, options?, signal?): Promise<string>;
  streamSummarize(content, onChunk, options?, signal?): Promise<void>;
}
```

Providers live in `src/services/providers/`: `openai.ts`, `claude.ts`, `qwen.ts`, `custom.ts` (OpenAI-compatible endpoints).

### State Management

No global store — state is managed via Vue composables in `src/composables/`:
- `useSettings.ts` — Settings load/save via `storage-service.ts` (wraps `chrome.storage.local`)
- `useSummary.ts` — Summarization workflow and streaming state
- `useTTS.ts` — Text-to-speech playback via Web Speech API

### Path Alias

`@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

### Content Extraction

`src/services/content-extractor.ts` uses a 3-step fallback strategy:
1. **Readability** (`@mozilla/readability`) — primary; clones and cleans the DOM
2. **Semantic selectors** — falls back to `article`, `main`, `[role="main"]`, common class names
3. **Largest text block** — finds the `div/section/article` with the most text

Content is capped at 50,000 characters before being sent to the AI.

### Background → UI Broadcasting

`broadcast()` in the background calls `chrome.runtime.sendMessage()` (not tab-targeted), so **all** open extension pages (sidepanel, popup, floating widget) receive streaming chunks simultaneously. `getActiveTabId()` uses `lastFocusedWindow: true` instead of `currentWindow: true` to find the user's actual browser tab rather than the sidepanel window.

### Prompt System

`BaseAIProvider.buildPrompt()` in `src/services/providers/base.ts` handles two modes:
- **Default**: uses `displayFormat` to inject one of four format templates (`standard`, `compact`, `cards`, `outline`)
- **Custom**: replaces `{content}`, `{title}`, `{url}` variables in the user's custom prompt string

### StorageService Write Queue

`StorageService` in `src/services/storage-service.ts` has a queue to serialize writes and prevent race conditions — `saveSettings` and `saveProviderConfig` both `await waitForSave()` before proceeding.

### UI Modes

Three modes controlled by `settings.uiMode`, toggled in Settings and enforced by the background:
- `sidepanel` — default; opens via `chrome.sidePanel.open()`
- `popup` — sets `chrome.action.setPopup('popup.html')`
- `floating` — clears the popup and content script renders `floating-widget.ts` directly into the page DOM

### Dev Mode Hot Reload

In development (`import.meta.env.DEV`), the background service worker listens for `onInstalled` and reloads all non-chrome:// tabs automatically.
