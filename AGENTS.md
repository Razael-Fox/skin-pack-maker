<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Context: Minecraft Bedrock Skin Pack Maker (OreUI Modern Theme)

## What is being worked on:
We are building a client-side Web tool to pack custom Minecraft Bedrock `.mcpack` files.
- **Active Code File:** [src/app/page.tsx](file:///data/data/com.termux/files/home/skin-pack-tools/src/app/page.tsx)
- **Active Styles File:** [src/app/globals.css](file:///data/data/com.termux/files/home/skin-pack-tools/src/app/globals.css)

## Key Technical Decisions & Architectures:
1. **No Backend**: Everything runs client-side (manifest construction, zip generation, canvas preview rendering).
2. **Dynamic JSZip**: The JSZip library is dynamically imported inside `handleExport` to optimize initial page bundle size and TTFB.
3. **Memory management**: Preview object URLs (`URL.createObjectURL`) must be cleaned up using `URL.revokeObjectURL()` inside `removeSkin` and `handleTextureUpload` to prevent leakage.
4. **Minecraft Bedrock Schema**:
   - `manifest.json`: expects exactly 3 components for arrays in version keys (e.g., `[1, 0, 0]`).
   - Secure filename mapping: texture names inside zip are sanitized or forced as `skin_${id}.png` to prevent naming collisions and traversal attacks.
5. **Canvas Projection**: Dynamic, pixel-perfect standard vs. slim geometry models (Steve vs Alex) rendered cleanly with `imageSmoothingEnabled = false`.

## OreUI UI Design Guidelines:
- **Visuals**: Modern dark Minecraft theme (Background: `#0a0a0a`, Cards: `#1a1a1a`, Borders: `1px solid rgba(0,230,118,0.2)` with green glowing states using neon green accent `#00e676`).
- **Typography**: System-ui / Inter. UPPERCASE headers, `letter-spacing: 0.1em`.
- **Constraint**: DO NOT use retro pixel fonts, retro bevel layouts, or large border-radiuses. Keep it sharp (max `4px` border-radius) and modern.

## Work Checklist:
- Running build inside Termux Android environments is unsupported. DO NOT run `npm run dev` or `npm run build` locally in this workspace. Rely on source-level checks and push to GitHub for Vercel remote building.
- Always run `npm run format && npm run lint` before committing/pushing.

