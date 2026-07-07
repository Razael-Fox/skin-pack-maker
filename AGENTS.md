<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Context: Minecraft Bedrock Skin Pack Maker

## What is being worked on:

A client-side web tool to pack custom Minecraft Bedrock `.mcpack` files. No backend — everything (manifest construction, zip generation, 3D canvas preview) runs in the browser.

- **Active Code File:** [src/app/page.tsx](file:///data/data/com.termux/files/home/skin-pack-maker/src/app/page.tsx)
- **Active Styles File:** [src/app/globals.css](file:///data/data/com.termux/files/home/skin-pack-maker/src/app/globals.css)

## Tech Stack:

- **Framework**: Next.js `16.2.9` (App Router), React `19.2.4`
- **Styling**: Tailwind CSS v4 + `tw-animate-css`, shadcn/ui via `@base-ui/react` + `radix-ui`
- **Typography**: Montserrat (self-hosted via `@font-face` in `globals.css`, variable font + static fallbacks)
- **Zip**: `jszip@3.10.1` — dynamically imported inside `handleExport` to reduce initial bundle
- **Icons**: `lucide-react@1.21.0`
- **Lint/Format**: ESLint 9 + Prettier 3

## Component Architecture:

| File                                   | Responsibility                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/app/page.tsx`                     | Root layout: orchestrates all components, theme toggle, toast system, loading state              |
| `src/hooks/useSkinPack.ts`             | Core state: pack metadata, skin list, add/remove/update, export, toast, localStorage persistence |
| `src/components/PackSettings.tsx`      | Pack name, version, theme toggle inputs                                                          |
| `src/components/SkinList.tsx`          | Skin list with add/remove, highlight-add-button animation                                        |
| `src/components/SkinEditor.tsx`        | Per-skin name, geometry type (Steve/Alex), tier (free/paid) editing                              |
| `src/components/SkinPreviewCanvas.tsx` | 3D WebGL/Canvas Minecraft skin preview (Steve & Alex geometry, auto-rotate)                      |
| `src/components/TextureUploadBox.tsx`  | PNG drag-and-drop / file input upload                                                            |
| `src/components/WorkspaceSkeleton.tsx` | Loading skeleton shown before `mounted` state                                                    |

## Key Technical Decisions & Architectures:

1. **No Backend**: Everything runs client-side.
2. **Dynamic JSZip**: Imported only inside `handleExport` — optimizes TTFB and initial bundle size.
3. **Memory management**: Object URLs (`URL.createObjectURL`) must always be revoked in `removeSkin` and `handleTextureUpload`.
4. **Minecraft Bedrock Schema**:
   - `manifest.json` version arrays must have exactly 3 components (e.g. `[1, 0, 0]`).
   - Texture filenames inside zip are sanitized as `skin_${id}.png` to prevent collisions/traversal.
5. **3D Skin Preview**: `SkinPreviewCanvas.tsx` renders Steve (4px arm) vs Alex (3px arm) geometry dynamically, with `imageSmoothingEnabled = false`.
6. **Alex vs Steve Auto-Detection**: Geometry type is automatically detected when a skin PNG is uploaded (based on arm pixel-width analysis in `useSkinPack.ts`).
7. **LocalStorage Persistence**: Pack name, version, and all skin data (including textures as data URLs) are persisted across sessions.
8. **Toast System**: Custom animated toast with entry/exit transitions. State managed via `activeToast` / `isToastVisible` derived state pattern in `page.tsx` — avoids placing `setState` calls inside render.
9. **Pending Download Confirm**: `pendingDownload` / `confirmDownload` / `cancelDownload` flow in `useSkinPack` shows a confirmation modal before triggering the actual `.mcpack` download.
10. **Progress Loader**: `processingSkins` boolean triggers a fixed top-bar shimmer animation while skins are being processed/added.

## UI Design Guidelines (Current Theme):

- **Color Scheme**: Purple accent — `purple-600` (`oklch` / hex equiv.) on dark gray / smoke white backgrounds.
- **Background**: Fixed `bg.jpg` image + ambient purple/indigo blur glows (`blur-[120px]`). NOT a flat color.
- **Dark mode**: `oklch(0.12 0.01 286)` background, `oklch(0.96 0.005 286)` foreground.
- **Light mode**: `oklch(0.97 0.005 286)` background, `oklch(0.2 0.01 286)` foreground.
- **Border**: `border-purple-500/10` (light) / `border-purple-500/20` (dark), with hover glow to `/20` and `/30`.
- **Typography**: `Montserrat` variable font. UPPERCASE tracking-widest for buttons/labels.
- **Radius**: Max `4px` — sharp corners. No rounded-xl for core surfaces.
- **Scrollbar**: Custom purple-tinted via `.custom-scrollbar` utility in `globals.css`.
- **Constraint**: No retro pixel fonts, no bevel borders, no large rounded corners. Keep it clean and modern.
- **Selection highlight**: `selection:bg-purple-500/30 selection:text-white`.

## Work Checklist:

- **DO NOT** run `npm run dev` or `npm run build` locally — Termux Android does not support Next.js build tools (LightningCSS/Turbopack/arm64 incompatibility). Push to GitHub and let Vercel build remotely.
- Always run `npm run format && npm run lint` before committing/pushing.
- When modifying `layout.tsx`, keep all imports aligned with actual exported components (see skill: `nextjs-lint-import-matching`).
