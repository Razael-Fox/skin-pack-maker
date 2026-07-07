# Minecraft Skin Pack Maker

Build instructions and command cheat sheet for the Bedrock `.mcpack` tool.

## Commands

- Format code: `npm run format`
- Lint code: `npm run lint`
- Format + Lint (pre-commit): `npm run format && npm run lint`
- Running builds: **Vercel only.** Do NOT build locally on Termux Android.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Root page — layout, theme, toast orchestration
│   ├── globals.css       # Tailwind v4 config, Montserrat font faces, CSS vars
│   └── layout.tsx        # App layout
├── components/
│   ├── PackSettings.tsx       # Pack name/version/theme inputs
│   ├── SkinList.tsx           # Skin list, add/remove, highlight animation
│   ├── SkinEditor.tsx         # Per-skin metadata editor
│   ├── SkinPreviewCanvas.tsx  # 3D skin preview (Steve/Alex geometry)
│   ├── TextureUploadBox.tsx   # PNG drag-drop / file upload
│   └── WorkspaceSkeleton.tsx  # Skeleton loader (pre-mount)
├── hooks/
│   └── useSkinPack.ts    # Core state, localStorage persistence, export logic
└── types/                # Shared TypeScript types (SkinItem, GeometryType, etc.)
```

## Directives

See full project details, tech stack, and style guidelines in [AGENTS.md](file:///data/data/com.termux/files/home/skin-pack-maker/AGENTS.md).

## Current Work & Status

- **Current Task:** Added Import `.mcpack` / load existing skin pack feature
- **Status:** stable
- **Last Updated:** 2026-07-07
- **Notes:** Purple theme active. 3D skin preview implemented. Alex/Steve auto-detection. Light/dark mode. Toast + pending download/import confirm flow. LocalStorage persistence. Added `mcpackParser.ts` for .mcpack validation and parsing, integrated drag-and-drop pack import overlay.
