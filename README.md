# BingoParty 🎰

A feature-rich, mobile-first multiplayer Bingo game built with Svelte 5, SvelteKit, and PartyKit for real-time WebSocket communication.

## Features

- **Real-time Multiplayer**: Play with friends and family using PartyKit WebSockets
- **Mobile-First Design**: Optimized for phones and tablets with responsive layouts
- **Card Selection**: Preview and select 1-4 cards from a pool of unique cards
- **Multiple Patterns**: 13 preset winning patterns including traditional lines, four corners, blackout, and more
- **Host Controls**: Create rooms, manage games, call numbers manually or automatically
- **Auto-Mark**: Optional automatic number marking for hands-free play
- **Internationalization**: Full English and Spanish support
- **Host Can Play**: Hosts can participate while managing the game

## Tech Stack

- **Frontend**: SvelteKit with Svelte 5 (runes)
- **Backend**: PartyKit for real-time WebSocket multiplayer
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS (mobile-first approach)
- **i18n**: svelte-i18n for internationalization

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bingo-party
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Start the development servers:
```bash
npm run dev:all
```

This will start both:
- SvelteKit dev server at http://localhost:5173
- PartyKit dev server at http://localhost:1999

### Development Commands

```bash
# Start SvelteKit dev server only
npm run dev

# Start PartyKit dev server only
npm run dev:party

# Start both dev servers
npm run dev:all

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check

# Deploy PartyKit server
npm run deploy:party
```

## How to Play

### Creating a Game

1. Click "Create Game" on the landing page
2. Enter your name
3. Share the room code with other players
4. Select your bingo cards (1-4 cards)
5. Wait for all players to select their cards
6. Click "Start Game" when ready

### Joining a Game

1. Click "Join Game" on the landing page
2. Enter your name and the room code
3. Select your bingo cards (1-4 cards)
4. Wait for the host to start the game

### Playing the Game

1. When a number is called, tap it on your card to mark it
2. Complete the required pattern to win
3. Click "BINGO!" when you have a winning pattern
4. The server validates your claim

### Host Controls

- **Call Next**: Manually call the next number
- **Auto Call**: Enable automatic number calling (2-10 second intervals)
- **Pause/Resume**: Control game flow
- **Reset**: Start a new game with fresh cards
- **Timeout**: Give players time to change their cards
- **Pattern Selection**: Choose the winning pattern

## Winning Patterns

- Horizontal Line (any row)
- Vertical Line (any column)
- Diagonal Line (either diagonal)
- Any Line (horizontal, vertical, or diagonal)
- Four Corners
- Blackout (full card)
- Letter X
- Letter T
- Letter L
- Plus Sign
- Picture Frame
- Postage Stamp (2x2 in any corner)
- Chevron

## Project Structure

```
bingoparty/
├── src/                           # Frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/            # Svelte components
│   │   ├── stores/                # Svelte stores (game state)
│   │   ├── utils/                 # Utility functions
│   │   └── i18n/                  # Translations
│   └── routes/                    # SvelteKit routes
├── party/                         # Backend (PartyKit)
│   ├── bingoServer.ts             # Main WebSocket server
│   ├── gameEngine.ts              # Game logic
│   ├── cardGenerator.ts           # Card generation
│   └── patternValidator.ts        # Win validation
├── shared/                        # Shared types and constants
└── static/                        # Static assets
```

## Deployment

### Deploy PartyKit Server

```bash
npx partykit login
npm run deploy:party
```

Note the URL: `bingoparty.YOUR-USERNAME.partykit.dev`

### Configure Production Environment

Update `.env` with your PartyKit production URL:
```bash
VITE_PARTYKIT_HOST=bingoparty.YOUR-USERNAME.partykit.dev
```

### Deploy Frontend

Deploy to Vercel, Netlify, or any static host:
```bash
npm run build
```

## License

MIT

## Credits

Built with Svelte, SvelteKit, PartyKit, and Tailwind CSS.
