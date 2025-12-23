// Bingo column letters
export type BingoColumn = 'B' | 'I' | 'N' | 'G' | 'O';

// Cell value can be a number or FREE
export type CellValue = number | 'FREE';

// Game phases
export type GamePhase = 'lobby' | 'cardSelection' | 'playing' | 'paused' | 'timeout' | 'finished';

// Bingo card interface
export interface BingoCard {
  id: string;
  grid: CellValue[][];
}

// Number call record
export interface NumberCall {
  number: number;
  column: BingoColumn;
  timestamp: number;
}

// Winner record
export interface Winner {
  playerId: string;
  playerName: string;
  cardId: string;
  place: number;
  timestamp: number;
  winningPattern: boolean[][];
}

// Pattern types
export type PatternType = 'preset' | 'custom';

// Pattern definition
export interface Pattern {
  id: string;
  name: string;
  nameEs?: string;
  type: PatternType;
  grid: boolean[][];
  description?: string;
  descriptionEs?: string;
}

// Game settings
export interface GameSettings {
  autoCall: boolean;
  callInterval: number; // milliseconds (2000-10000)
  allowMultipleWinners: boolean;
  maxWinners: number;
  requireAllPlayersReady: boolean;
  allowHighlightCalledNumbers: boolean; // Host-controlled: allow players to see called numbers highlighted on their cards
}

// Player state
export interface BingoPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  cards: BingoCard[];
  selectedCardIds: string[];
  markedCells: Record<string, boolean[][]>; // cardId -> marked grid
  autoMark: boolean;
  readyToPlay: boolean;
  highlightCalledNumbers: boolean; // Player preference: show called numbers highlighted on cards
}

// Full game state
export interface BingoGameState {
  roomId: string;
  phase: GamePhase;
  hostId: string;
  players: Record<string, BingoPlayer>;

  // Game state
  calledNumbers: number[];
  remainingNumbers: number[];
  currentNumber: number | null;
  callHistory: NumberCall[];

  // Settings
  settings: GameSettings;
  currentPattern: Pattern;

  // Winners
  winners: Winner[];

  // Timer state
  lastCallTime: number;
  timeoutEndTime: number | null;
}

// Client-side messages
export type ClientMessage =
  | { type: 'joinRoom'; playerName: string }
  | { type: 'selectCards'; cardIds: string[] }
  | { type: 'regenerateCards'; preserveSelected?: boolean }
  | { type: 'markCell'; cardId: string; row: number; col: number }
  | { type: 'claimBingo'; cardId: string; markedGrid: boolean[][] }
  | { type: 'toggleAutoMark'; enabled: boolean }
  | { type: 'toggleHighlightCalledNumbers'; enabled: boolean }
  | { type: 'playerReady' }
  | { type: 'hostStartGame' }
  | { type: 'hostCallNext' }
  | { type: 'hostPause' }
  | { type: 'hostResume' }
  | { type: 'hostReset' }
  | { type: 'hostSetPattern'; pattern: Pattern }
  | { type: 'hostSetSpeed'; intervalMs: number }
  | { type: 'hostToggleAutoCall'; enabled: boolean }
  | { type: 'hostToggleAllowHighlight'; enabled: boolean }
  | { type: 'hostCreateTimeout'; durationSeconds: number }
  | { type: 'hostEndTimeout' }
  | { type: 'hostKickPlayer'; playerId: string };

// Server-side messages
export type ServerMessage =
  | { type: 'init'; playerId: string; isHost: boolean; state: BingoGameState }
  | { type: 'cardPool'; cards: BingoCard[] }
  | { type: 'gameState'; state: BingoGameState }
  | { type: 'numberCalled'; call: NumberCall; state: BingoGameState }
  | { type: 'playerJoined'; player: BingoPlayer }
  | { type: 'playerLeft'; playerId: string }
  | { type: 'playerUpdated'; player: BingoPlayer }
  | { type: 'bingoValidated'; winner: Winner }
  | { type: 'bingoInvalid'; playerId: string; reason: string }
  | { type: 'gameStarted'; state: BingoGameState }
  | { type: 'gamePaused' }
  | { type: 'gameResumed'; state: BingoGameState }
  | { type: 'gameReset'; state: BingoGameState }
  | { type: 'timeoutStarted'; endTime: number }
  | { type: 'timeoutEnded' }
  | { type: 'kicked' }
  | { type: 'error'; message: string };

// Column ranges
export const COLUMN_RANGES: Record<BingoColumn, { min: number; max: number }> = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
};

// Column order
export const COLUMNS: BingoColumn[] = ['B', 'I', 'N', 'G', 'O'];

// Get column for a number
export function getColumnForNumber(num: number): BingoColumn {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  return 'O';
}

// Format number with column prefix
export function formatNumber(num: number): string {
  return `${getColumnForNumber(num)}-${num}`;
}
