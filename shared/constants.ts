// Game constants
export const GRID_SIZE = 5;
export const TOTAL_NUMBERS = 75;
export const MIN_CARDS = 1;
export const MAX_CARDS = 4;
export const CARD_POOL_SIZE = 8;

// Timer constants
export const MIN_CALL_INTERVAL = 2000; // 2 seconds
export const MAX_CALL_INTERVAL = 10000; // 10 seconds
export const DEFAULT_CALL_INTERVAL = 5000; // 5 seconds
export const DEFAULT_TIMEOUT_DURATION = 60; // 60 seconds

// Default game settings
export const DEFAULT_SETTINGS = {
  autoCall: false,
  callInterval: DEFAULT_CALL_INTERVAL,
  allowMultipleWinners: true,
  maxWinners: 3,
  requireAllPlayersReady: false,
  allowHighlightCalledNumbers: true, // Allow players to highlight called numbers by default
};

// Column colors (Tailwind class names)
export const COLUMN_COLORS = {
  B: 'bg-bingo-b',
  I: 'bg-bingo-i',
  N: 'bg-bingo-n',
  G: 'bg-bingo-g',
  O: 'bg-bingo-o',
} as const;

// Column text colors
export const COLUMN_TEXT_COLORS = {
  B: 'text-bingo-b',
  I: 'text-bingo-i',
  N: 'text-bingo-n',
  G: 'text-bingo-g',
  O: 'text-bingo-o',
} as const;
