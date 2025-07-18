# Property Manager App - Agent Guide

## Commands
- **Dev server**: `npm run dev` (Vite React app)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (ESLint with TypeScript)
- **Preview**: `npm run preview`
- **Type check**: `npx tsc --noEmit`

## Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Auth**: Supabase Auth with email/password
- **UI**: Tailwind CSS + Lucide React icons
- **State**: React hooks (useState, useEffect) - no external state management
- **Routing**: Single-page app with view-based navigation

## Code Style
- **Components**: Functional components with TypeScript, PascalCase filenames
- **Imports**: React first, then external libs, then internal (utils, components, types)
- **Types**: Centralized in `src/types/index.ts`, interface names match domain objects
- **Props**: Use proper TypeScript interfaces, avoid `any` except for Supabase user objects
- **Error handling**: Try-catch with console.error, return boolean success indicators
- **File structure**: Components flat in `src/components/`, utilities in `src/utils/`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
