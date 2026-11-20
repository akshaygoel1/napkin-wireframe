# Napkin

Rapid, local-first wireframing with a Balsamiq feel and Material 3 manners.

Napkin is a browser-based wireframing board: a dotted infinite canvas, hand-drawn UI components, phone / tablet / desktop frames, and one-click PNG export. No account, no server, no ceremony — your board saves itself in your browser.

## Try it

- **Local:** `npm install && npm run dev`
- **Production build:** `npm run build && npm run preview`

## What is inside

- **Hand-drawn wireframes** — Rough.js strokes, a stable seed per element, and clean/sketchy export styles.
- **56 Material-3-flavoured components** across actions, containment, navigation, selection and text.
- **328 Material Symbols** with rounded, outlined and sharp styles, search, recents and favourites.
- **Infinite canvas** — pan, zoom, marquee selection, drag, resize, snapping and frame dragging.
- **Frames** — phone (390 × 844), tablet (820 × 1180), desktop (1440 × 900), blank and custom sizes, with real device/browser shells.
- **Quick-add** — press `/`, type "button", "card", ":home:", `[ Save ]`, `[x]`, `___` or `---`, then hit enter.
- **PNG export** — single frame, multi-frame ZIP, 1×–4×, transparent / white / paper background, sketchy or clean lines, optional titles and markup.
- **Local-first** — autosave to `localStorage`, `.napkin` project download/import, and a starter demo board.
- **Keyboard-first** — undo/redo, duplicate, copy/paste, nudging, reorder, zoom and fit-all.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Quick add | `/` or `+` |
| Component library | `C` |
| Icons | `I` |
| Text tool | `T` |
| New frame | `F` |
| Select / hand | `V` / `H` |
| Undo / redo | `Ctrl/⌘ Z` / `Ctrl/⌘ Shift Z` |
| Duplicate | `Ctrl/⌘ D` |
| Copy / paste | `Ctrl/⌘ C` / `Ctrl/⌘ V` |
| Copy frame as PNG | `Ctrl/⌘ Shift C` |
| Select all in frame | `Ctrl/⌘ A` |
| Export | `Ctrl/⌘ Shift E` |
| Fit all frames | `Shift 1` |
| Zoom to 100% | `Shift 0` |
| Nudge / big nudge | Arrows / `Shift` + arrows |
| Delete | `Backspace` or `Delete` |
| Shortcuts dialog | `?` |

## Stack

React 18 + TypeScript + Vite, Zustand + Immer for state, Rough.js for the hand-drawn look, html-to-image + JSZip for export, Lucide for chrome icons, and self-hosted Balsamiq Sans, Inter and subset Material Symbols.

The typeface and component feel are an homage to [Balsamiq](https://balsamiq.com/); this project is not affiliated with Balsamiq.
