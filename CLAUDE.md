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
│   │   │   ├── BingoCard.svelte         # Card display and cell marking
│   │   │   ├── BingoButton.svelte       # Floating Bingo claim button
│   │   │   ├── CalledHistory.svelte     # Recent called numbers display
│   │   │   ├── CalledNumberDisplay.svelte # Current number display
│   │   │   ├── CardPreview.svelte       # Miniature card preview
│   │   │   ├── CardSelector.svelte      # Card selection interface
│   │   │   ├── ConfirmModal.svelte      # Confirmation dialog component
│   │   │   ├── HostControls.svelte      # Host control panel
│   │   │   ├── LanguageSelector.svelte  # EN/ES language toggle
│   │   │   ├── NumberBoard.svelte       # 1-75 number grid
│   │   │   ├── NumberBoardModal.svelte  # Modal wrapper for NumberBoard
│   │   │   ├── PatternPreview.svelte    # Visual pattern display
│   │   │   ├── PatternSelector.svelte   # Pattern selection UI
│   │   │   ├── PlayerList.svelte        # Player list with status
│   │   │   ├── Toast.svelte             # Toast notification component
│   │   │   └── WinnerAnnouncement.svelte # Winner celebration modal
│   │   ├── stores/
│   │   │   └── gameState.svelte.ts      # Central state management
│   │   ├── utils/                 # Client-side utility functions
│   │   │   ├── audio.ts                 # Sound effects (number call, bingo)
│   │   │   ├── cardGenerator.ts         # Card grid utilities
│   │   │   ├── numberFormatter.ts       # Number formatting helpers
│   │   │   └── patternDetector.ts       # Pattern matching logic
│   │   └── i18n/                  # Translation files
│   │       ├── index.ts                 # i18n initialization
│   │       ├── en.json                  # English translations
│   │       └── es.json                  # Spanish translations
│   └── routes/                    # SvelteKit routes
│       ├── +page.svelte           # Landing page (create/join game)
│       ├── +layout.svelte         # Root layout with header
│       └── game/[roomId]/
│           └── +page.svelte       # Main game interface
├── party/                         # Backend (PartyKit server)
│   ├── bingoServer.ts             # Main WebSocket server
│   ├── gameEngine.ts              # Game state management
│   ├── cardGenerator.ts           # Bingo card generation
│   └── patternValidator.ts        # Win pattern validation
├── shared/                        # Shared code between frontend and backend
│   ├── types.ts                   # TypeScript interfaces and types
│   ├── patterns.ts                # 13 preset winning patterns
│   └── constants.ts               # Game constants
├── static/                        # Static assets (favicon, logos)
├── scripts/                       # Build scripts
│   └── convert-favicon.js         # Favicon generation
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

1. **Lobby Phase**: Players join room, receive pool of 8 cards to choose from
2. **Card Selection**: Players select 1-4 cards, confirm when ready
3. **Playing Phase**: Host calls numbers (manual or auto), players mark cards
4. **Timeout Phase**: Optional pause allowing players to change cards
5. **Bingo Claim**: Floating button appears when pattern matched; server validates
6. **Finished Phase**: Winners announced with celebration modal

### Key Features

- **Persistent Player ID**: Reconnection support using localStorage-based identity
- **Toast Notifications**: Player join events shown via toast system
- **Floating Bingo Button**: Appears at bottom of screen when player can claim
- **Highlight Called Numbers**: Host-controlled option, player-toggleable preference
- **Navigation Prevention**: Warns before leaving during active game
- **Sound Effects**: Audio feedback for number calls and Bingo wins
- **Auto-mark**: Optional automatic cell marking when numbers are called
- **Host Controls**: Pattern selection, auto/manual call, speed, timeout, kick players

### Key Type Definitions (shared/types.ts)

```typescript
// Game phases
type GamePhase = 'lobby' | 'cardSelection' | 'playing' | 'paused' | 'timeout' | 'finished';

// Core interfaces
interface BingoCard { id: string; grid: CellValue[][]; }
interface BingoPlayer {
  id: string;
  persistentId?: string;         // For reconnection
  name: string;
  isHost: boolean;
  connected: boolean;
  cards: BingoCard[];
  selectedCardIds: string[];
  markedCells: Record<string, boolean[][]>;
  autoMark: boolean;
  readyToPlay: boolean;
  highlightCalledNumbers: boolean;
}
interface BingoGameState {
  roomId: string;
  phase: GamePhase;
  hostId: string;
  players: Record<string, BingoPlayer>;
  calledNumbers: number[];
  remainingNumbers: number[];
  currentNumber: number | null;
  callHistory: NumberCall[];
  settings: GameSettings;
  currentPattern: Pattern;
  winners: Winner[];
  lastCallTime: number;
  timeoutEndTime: number | null;
}
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
- **`party/cardGenerator.ts`**: Server-side card generation

### Frontend (SvelteKit)

- **`src/lib/stores/gameState.svelte.ts`**: Central state management, WebSocket client, toast system, reconnection logic
- **`src/routes/game/[roomId]/+page.svelte`**: Main game interface, navigation prevention, player join flow
- **`src/routes/+page.svelte`**: Landing page with create/join game forms

#### Key Components

- **`BingoCard.svelte`**: Card display, cell marking, highlight called numbers
- **`BingoButton.svelte`**: Floating "Claim BINGO!" button (appears when pattern matched)
- **`HostControls.svelte`**: Pattern selection, auto-call toggle, speed control, timeout, game lifecycle
- **`CardSelector.svelte`**: Card selection interface with regenerate options
- **`Toast.svelte`**: Toast notification display (player joins, etc.)
- **`PatternSelector.svelte`**: Modal for selecting from 13 preset patterns
- **`WinnerAnnouncement.svelte`**: Winner celebration modal with placement
- **`ConfirmModal.svelte`**: Reusable confirmation dialog

#### Utility Files

- **`src/lib/utils/patternDetector.ts`**: Client-side pattern matching and winning cell detection
- **`src/lib/utils/audio.ts`**: Sound effects for number calls and Bingo wins

### Shared

- **`shared/types.ts`**: All TypeScript interfaces, message types, and utility functions
- **`shared/patterns.ts`**: 13 preset winning patterns with Spanish translations
- **`shared/constants.ts`**: Game configuration (grid size, card limits, timing, default settings)

## Testing Changes

1. Run `npm run check` for TypeScript errors
2. Test in browser with `npm run dev:all`
3. Test both English and Spanish UI
4. Test mobile view (responsive design)
5. Test multiplayer by opening multiple browser tabs

## Common Tasks

### Adding a New Winning Pattern

1. Add pattern definition to `shared/patterns.ts` using `setPattern()` helper
2. Include both `name` and `nameEs` for translations
3. Add special handling in `party/patternValidator.ts` if pattern has multiple valid positions (like "any line")
4. Update client-side `src/lib/utils/patternDetector.ts` if pattern requires special matching logic

### Adding Translation Strings

1. Add key to `src/lib/i18n/en.json`
2. Add corresponding key to `src/lib/i18n/es.json`
3. Use in component: `{$_('your.key.path')}`
4. For interpolation: `{$_('key', { values: { name: value } })}`

### Adding a New Message Type

1. Add to `ClientMessage` or `ServerMessage` union in `shared/types.ts`
2. Handle in `party/bingoServer.ts` (server-side)
3. Handle in `gameState.svelte.ts` `handleServerMessage` (client-side)
4. Add corresponding action method in `createGameStore()` if needed

### Modifying Game State

1. Create pure function in `party/gameEngine.ts`
2. Call from message handler in `party/bingoServer.ts`
3. Broadcast state update to clients via `this.party.broadcast()`

### Adding Toast Notifications

1. Use `store.addToast(message, type, duration)` from game store
2. Types: `'info'`, `'success'`, `'warning'`, `'error'`
3. Default duration is 3000ms

### Adding Sound Effects

1. Add audio handling in `src/lib/utils/audio.ts`
2. Call from appropriate place in `gameState.svelte.ts` message handlers

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

### Code Quality

- Always maintain TypeScript strict mode compliance
- Prefer immutable state updates (spread operators, map/filter)
- Keep server-side game logic in pure functions for testability
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive state
- Props use callback pattern: `onSelect`, `onConfirm`, `onClose`

### Game Logic

- The FREE space (center cell, position [2][2]) is automatically marked
- Card selection validates on both client and server
- Auto-call stops when a winner is detected
- Maximum 3 winners per game (configurable via `maxWinners`)
- Players can be kicked by host; kicked players have their `persistentId` cleared

### WebSocket & Connection

- WebSocket reconnection uses exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum 5 reconnection attempts before showing error
- `persistentId` in localStorage enables state restoration on reconnect
- Use `beforeNavigate` and `beforeunload` for navigation prevention

### Available Patterns (13 presets)

1. Horizontal Line, Vertical Line, Diagonal Line, Any Line
2. Four Corners, Blackout (full card)
3. Letter X, Letter T, Letter L
4. Plus Sign, Picture Frame
5. Postage Stamp (2x2 corner), Chevron

### Dependencies to Know

- `partysocket`: WebSocket client with reconnection
- `svelte-i18n`: Internationalization (`$_()` function)
- `partykit`: Real-time backend framework
- Node.js 20+ required (see `.nvmrc`)

## Completed Features

### ✅ Mejora de Visibilidad del Número Actual
El número llamado es visible desde cualquier parte de la pantalla:
- **Implementación**: Componente `FloatingNumber.svelte` muestra el número actual flotante en móvil
- **Ubicación**: Fijo en la parte superior central de la pantalla (solo móvil)
- **Componente**: `src/lib/components/FloatingNumber.svelte`

### ✅ Notificación de Cambio de Patrón
Cuando el host cambia el patrón de juego:
- Modal de notificación mostrado a todos los jugadores
- Incluye preview visual del nuevo patrón
- Muestra quién cambió el patrón
- **Componente**: `src/lib/components/PatternChangeNotification.svelte`

### ✅ Chat y Reacciones
Sistema de comunicación entre jugadores:
- **En lobby**: Chat completo con mensajes de texto
- **Durante el juego**: Mensajes preestablecidos y reacciones rápidas
- **UX**: Mensajes visibles sin abrir el chat (notificaciones flotantes)
- **Componentes**: `src/lib/components/Chat.svelte`, `src/lib/components/ChatBubble.svelte`, `src/lib/components/ReactionPicker.svelte`

## Planned Features

### 1. Estadísticas de Sesión
Panel de estadísticas del juego actual:
- Números llamados vs restantes
- Tiempo transcurrido de la sesión
- Historial de ganadores
- Patrones jugados
- Estadísticas por jugador (bingos ganados, cartones jugados)
