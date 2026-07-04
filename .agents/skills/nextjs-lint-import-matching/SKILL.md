---
name: nextjs-lint-import-matching
description: Avoid build/lint errors in Next.js layouts by keeping import statements aligned with component additions and removals.
---

# Next.js Layout Component & Import Synchronization

When modifying structural layouts in React/Next.js pages (e.g., `src/app/page.tsx`), it is common to add new interactive components or remove unused cards/widgets.

## Problem Encountered

- **Import mismatch**: Added UI elements (e.g. `<Sun />`, `<Moon />`) but the replacement chunk target did not cover the import block, causing runtime reference errors.
- **Unused imports**: Removed layout panels (e.g. reference cards using `<FolderOpen />`, `<FileJson />`, `<Puzzle />`) but left the icons in the import header, triggering strict ESLint compiler errors.

## Solution and Prevention

1. **Full Scope Replacements**: When adding components, always ensure that their required imports are included in the edited line ranges or modified concurrently.
2. **Lint Cleanup**: Immediately prune any imports of components/icons that were removed to prevent ESLint build failures.
3. **Pre-commit Checks**: Always execute formatter and linter (`npm run format && npm run lint`) to catch mismatches before completing the implementation.
