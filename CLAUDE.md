# CLAUDE.md - AI Assistant Guide for BingoParty

This document provides guidance for AI assistants working on the BingoParty codebase.

## Project Overview

BingoParty is a real-time multiplayer Bingo game built with:
- **Frontend**: SvelteKit with Svelte 5 (using runes for reactivity)
- **Backend**: PartyKit for WebSocket-based real-time communication
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS (mobile-first approach)
- **i18n**: svelte-i18n for English and Spanish support

## Codebase Structure

```
bingo-party/
├── src/                           # Frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/            # Svelte 5 components
│   │   ├── stores/                # Reactive stores (Svelte 5 runes)
│   │   ├── utils/                 # Client-side utility functions
│   │   └── i18n/                  # Translation files (en.json, es.json)
│   └── routes/                    # SvelteKit routes
│       ├── +page.svelte           # Landing page
│       ├── +layout.svelte         # Root layout with header
│       └── game/[roomId]/         # Game room route
├── party/                         # Backend (PartyKit server)
│   ├── bingoServer.ts             # Main WebSocket server
│   ├── gameEngine.ts              # Game state management
│   ├── cardGenerator.ts           # Bingo card generation
│   └── patternValidator.ts        # Win pattern validation
├── shared/                        # Shared code between frontend and backend
│   ├── types.ts                   # TypeScript interfaces and types
│   ├── patterns.ts                # Winning pattern definitions
│   └── constants.ts               # Game constants
├── static/                        # Static assets (favicon, logos)
├── partykit.json                  # PartyKit configuration
├── svelte.config.js               # SvelteKit configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.ts                 # Vite configuration
```

## Development Workflow

### Prerequisites
- Node.js 20+ (see `.nvmrc`)
- npm

### Commands

```bash
# Install dependencies
npm install

# Start both servers concurrently (recommended for development)
npm run dev:all

# Start SvelteKit dev server only (http://localhost:5173)
npm run dev

# Start PartyKit dev server only (http://localhost:1999)
npm run dev:party

# Type check
npm run check

# Build for production
npm run build

# Deploy PartyKit server
npm run deploy:party
```

### Environment Configuration

Copy `.env.example` to `.env`:
- `VITE_PARTYKIT_HOST`: PartyKit server URL (default: `localhost:1999` for development)

## Architecture

### Frontend-Backend Communication

1. **WebSocket Connection**: Frontend connects via `partysocket` to PartyKit
2. **Message Types**: Defined in `shared/types.ts`
   - `ClientMessage`: Messages sent from client to server
   - `ServerMessage`: Messages sent from server to client
3. **State Management**: `gameState.svelte.ts` uses Svelte 5 runes (`$state`, `$derived`)

### Game Flow

1. **Lobby Phase**: Players join, select cards (1-4 from pool of 8)
2. **Playing Phase**: Host calls numbers, players mark cards
3. **Bingo Claim**: Server validates winning patterns
4. **Finished Phase**: Winners announced

### Key Type Definitions (shared/types.ts)

```typescript
// Game phases
type GamePhase = 'lobby' | 'cardSelection' | 'playing' | 'paused' | 'timeout' | 'finished';

// Core interfaces
interface BingoCard { id: string; grid: CellValue[][]; }
interface BingoPlayer { id, name, isHost, cards, selectedCardIds, markedCells, ... }
interface BingoGameState { roomId, phase, hostId, players, calledNumbers, ... }
```

## Code Conventions

### Svelte 5 Runes

This project uses Svelte 5's new reactivity system:

```typescript
// State declaration
let value = $state(initialValue);

// Derived state
const computed = $derived(expression);
const complexDerived = $derived.by(() => { /* logic */ });

// Effects
$effect(() => { /* reactive side effects */ });

// Props in components
let { propName } = $props();
```

### Component Patterns

- Components use `<script lang="ts">` for TypeScript
- Event handlers use direct function calls: `onclick={() => handler()}`
- Props use callback pattern: `onSelect`, `onConfirm`, `onClose`
- Conditional rendering with `{#if}`, `{:else}`, `{/if}`

### Styling Conventions

- Mobile-first responsive design using Tailwind breakpoints (`md:`, `lg:`)
- Custom color palette in `tailwind.config.js`:
  - Bingo column colors: `bingo-b` (blue), `bingo-i` (red), `bingo-n` (yellow), `bingo-g` (green), `bingo-o` (orange)
  - Primary: purple gradient (`primary-500` through `primary-900`)
  - Accent: gold (`accent-gold`, `accent-goldDark`)
- Common utility classes defined in `src/app.css`:
  - `.btn`, `.btn-primary`, `.btn-secondary`
  - `.card` for card-style containers
  - `.input` for form inputs

### Internationalization

- Use `$_('key.path')` for translations
- Translation keys in `src/lib/i18n/en.json` and `es.json`
- Add both English and Spanish when adding new strings
- Pattern names support `nameEs` and `descriptionEs` properties

## Important Files to Understand

### Backend (PartyKit)

- **`party/bingoServer.ts`**: WebSocket message routing, connection handling
- **`party/gameEngine.ts`**: Pure functions for state transformations
- **`party/patternValidator.ts`**: Win condition checking logic

### Frontend (SvelteKit)

- **`src/lib/stores/gameState.svelte.ts`**: Central state management, WebSocket client
- **`src/routes/game/[roomId]/+page.svelte`**: Main game interface
- **`src/lib/components/BingoCard.svelte`**: Card display and interaction

### Shared

- **`shared/types.ts`**: All TypeScript interfaces and message types
- **`shared/patterns.ts`**: 13 preset winning patterns
- **`shared/constants.ts`**: Game configuration (grid size, card limits, timing)

## Testing Changes

1. Run `npm run check` for TypeScript errors
2. Test in browser with `npm run dev:all`
3. Test both English and Spanish UI
4. Test mobile view (responsive design)
5. Test multiplayer by opening multiple browser tabs

## Common Tasks

### Adding a New Winning Pattern

1. Add pattern definition to `shared/patterns.ts`
2. Add special handling in `party/patternValidator.ts` if needed
3. Update client-side `src/lib/utils/patternDetector.ts` if pattern requires special logic

### Adding Translation Strings

1. Add key to `src/lib/i18n/en.json`
2. Add corresponding key to `src/lib/i18n/es.json`
3. Use in component: `{$_('your.key.path')}`

### Adding a New Message Type

1. Add to `ClientMessage` or `ServerMessage` union in `shared/types.ts`
2. Handle in `party/bingoServer.ts` (server-side)
3. Handle in `gameState.svelte.ts` `handleServerMessage` (client-side)

### Modifying Game State

1. Create pure function in `party/gameEngine.ts`
2. Call from message handler in `party/bingoServer.ts`
3. Broadcast state update to clients

## Deployment

### PartyKit Server
```bash
npx partykit login
npm run deploy:party
# Note the URL: bingoparty.YOUR-USERNAME.partykit.dev
```

### Frontend (Vercel/Netlify)
1. Set `VITE_PARTYKIT_HOST` to production PartyKit URL
2. Deploy with `npm run build`

## Notes for AI Assistants

- Always maintain TypeScript strict mode compliance
- Prefer immutable state updates (spread operators, map/filter)
- Keep server-side game logic in pure functions for testability
- The FREE space (center cell) is automatically marked
- Card selection validates on both client and server
- Auto-call stops when a winner is detected
- WebSocket reconnection with exponential backoff is built-in
