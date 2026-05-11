<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Architecture & Guidelines

## Data Layer (lib/data)
- **No Direct Prisma in UI/Actions**: Avoid calling `prisma` directly in Server Components or Server Actions.
- **Reusable Functions**: Extract all database lookups and mutations into reusable functions within `lib/data/`.
- **Typed Responses**: Ensure data functions use the custom types defined in `lib/data/types.ts`.

## Component Architecture
- **Focus Pages**: Keep page components (`page.tsx`) focused on data fetching and high-level composition.
- **Component Extraction**: Extract UI sections into standalone components within a sub-directory in `components/` (e.g., `components/dashboard/`, `components/category/`).
- **One File Per Component**: Maintain a clean structure by keeping each component in its own file.

## Server Actions (lib/actions)
- **Validation**: Always use Zod to validate input data at the start of a Server Action.
- **State Updates**: Ensure content versioning (`incrementContentVersion`) is handled for any data mutations.
