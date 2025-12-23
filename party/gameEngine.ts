import type {
  BingoGameState,
  BingoPlayer,
  BingoCard,
  Pattern,
  GameSettings,
  NumberCall,
  Winner,
} from '../shared/types';
import { getColumnForNumber } from '../shared/types';
import { DEFAULT_SETTINGS, CARD_POOL_SIZE, MAX_CARDS } from '../shared/constants';
import { DEFAULT_PATTERN } from '../shared/patterns';
import { generateCardPool, generateShuffledNumbers, createEmptyMarkedGrid } from './cardGenerator';
import { checkPatternMatch, validateMarkedCells, getWinningCells } from './patternValidator';

// Create initial game state
export function createInitialState(roomId: string, hostId: string): BingoGameState {
  return {
    roomId,
    phase: 'lobby',
    hostId,
    players: {},
    calledNumbers: [],
    remainingNumbers: generateShuffledNumbers(),
    currentNumber: null,
    callHistory: [],
    settings: { ...DEFAULT_SETTINGS },
    currentPattern: DEFAULT_PATTERN,
    winners: [],
    lastCallTime: 0,
    timeoutEndTime: null,
  };
}

// Create a new player
export function createPlayer(
  id: string,
  name: string,
  isHost: boolean
): BingoPlayer {
  return {
    id,
    name,
    isHost,
    connected: true,
    cards: generateCardPool(CARD_POOL_SIZE),
    selectedCardIds: [],
    markedCells: {},
    autoMark: false,
    readyToPlay: false,
    highlightCalledNumbers: true, // Default to enabled
  };
}

// Add a player to the game
export function addPlayer(
  state: BingoGameState,
  player: BingoPlayer
): BingoGameState {
  return {
    ...state,
    players: {
      ...state.players,
      [player.id]: player,
    },
  };
}

// Remove a player from the game
export function removePlayer(
  state: BingoGameState,
  playerId: string
): BingoGameState {
  const { [playerId]: removed, ...remainingPlayers } = state.players;
  return {
    ...state,
    players: remainingPlayers,
  };
}

// Update player connection status
export function updatePlayerConnection(
  state: BingoGameState,
  playerId: string,
  connected: boolean
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        connected,
      },
    },
  };
}

// Select cards for a player
export function selectCards(
  state: BingoGameState,
  playerId: string,
  cardIds: string[]
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  // Validate card IDs belong to player
  const validCardIds = cardIds.filter(id =>
    player.cards.some(card => card.id === id)
  );

  // Enforce MAX_CARDS limit on server side
  if (validCardIds.length > MAX_CARDS) {
    validCardIds.length = MAX_CARDS;
  }

  // Initialize marked cells for selected cards
  const markedCells: Record<string, boolean[][]> = {};
  for (const cardId of validCardIds) {
    markedCells[cardId] = createEmptyMarkedGrid();
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        selectedCardIds: validCardIds,
        markedCells,
        // Don't set readyToPlay here - only set it when player confirms via playerReady
      },
    },
  };
}

// Regenerate cards for a player (optionally preserving selected cards)
export function regenerateCards(
  state: BingoGameState,
  playerId: string,
  preserveSelected: boolean = false
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  if (preserveSelected && player.selectedCardIds.length > 0) {
    // Keep selected cards and generate new cards for the remaining slots
    const selectedCards = player.cards.filter(c => player.selectedCardIds.includes(c.id));
    const remainingSlots = CARD_POOL_SIZE - selectedCards.length;
    const newCards = generateCardPool(remainingSlots);

    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          cards: [...selectedCards, ...newCards],
          // Keep selectedCardIds and markedCells as they are
        },
      },
    };
  }

  // Full regeneration - clear everything
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        cards: generateCardPool(CARD_POOL_SIZE),
        selectedCardIds: [],
        markedCells: {},
        readyToPlay: false,
      },
    },
  };
}

// Mark a cell on a player's card
export function markCell(
  state: BingoGameState,
  playerId: string,
  cardId: string,
  row: number,
  col: number
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  const markedGrid = player.markedCells[cardId];
  if (!markedGrid) return state;

  // Get the card
  const card = player.cards.find(c => c.id === cardId);
  if (!card) return state;

  // Check if cell is FREE or a called number
  const cellValue = card.grid[row][col];
  if (cellValue !== 'FREE' && !state.calledNumbers.includes(cellValue)) {
    return state; // Can only mark called numbers
  }

  // Toggle the cell
  const newMarkedGrid = markedGrid.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? !c : c))
  );

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        markedCells: {
          ...player.markedCells,
          [cardId]: newMarkedGrid,
        },
      },
    },
  };
}

// Auto-mark a number on all cards for all players with autoMark enabled
export function autoMarkNumber(
  state: BingoGameState,
  number: number
): BingoGameState {
  const updatedPlayers: Record<string, BingoPlayer> = {};

  for (const [playerId, player] of Object.entries(state.players)) {
    if (!player.autoMark) {
      updatedPlayers[playerId] = player;
      continue;
    }

    const newMarkedCells: Record<string, boolean[][]> = {};

    for (const cardId of player.selectedCardIds) {
      const card = player.cards.find(c => c.id === cardId);
      const markedGrid = player.markedCells[cardId];

      if (!card || !markedGrid) {
        if (markedGrid) newMarkedCells[cardId] = markedGrid;
        continue;
      }

      // Find and mark the number
      const newGrid = markedGrid.map((row, ri) =>
        row.map((cell, ci) => {
          if (card.grid[ri][ci] === number) {
            return true;
          }
          return cell;
        })
      );

      newMarkedCells[cardId] = newGrid;
    }

    updatedPlayers[playerId] = {
      ...player,
      markedCells: {
        ...player.markedCells,
        ...newMarkedCells,
      },
    };
  }

  return {
    ...state,
    players: updatedPlayers,
  };
}

// Toggle auto-mark for a player
export function toggleAutoMark(
  state: BingoGameState,
  playerId: string,
  enabled: boolean
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        autoMark: enabled,
      },
    },
  };
}

// Toggle highlight called numbers for a player
export function toggleHighlightCalledNumbers(
  state: BingoGameState,
  playerId: string,
  enabled: boolean
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  // Only allow if the host setting permits it (default to true for backwards compatibility)
  const allowHighlight = state.settings.allowHighlightCalledNumbers ?? true;
  if (enabled && !allowHighlight) {
    return state;
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        highlightCalledNumbers: enabled,
      },
    },
  };
}

// Call the next number
export function callNextNumber(state: BingoGameState): BingoGameState {
  if (state.remainingNumbers.length === 0) {
    return state;
  }

  const [nextNumber, ...remaining] = state.remainingNumbers;
  const column = getColumnForNumber(nextNumber);

  const call: NumberCall = {
    number: nextNumber,
    column,
    timestamp: Date.now(),
  };

  const newState: BingoGameState = {
    ...state,
    currentNumber: nextNumber,
    calledNumbers: [...state.calledNumbers, nextNumber],
    remainingNumbers: remaining,
    callHistory: [...state.callHistory, call],
    lastCallTime: Date.now(),
  };

  // Auto-mark for all players with autoMark enabled
  return autoMarkNumber(newState, nextNumber);
}

// Validate a bingo claim
export function validateBingoClaim(
  state: BingoGameState,
  playerId: string,
  cardId: string,
  markedGrid: boolean[][]
): { valid: boolean; reason?: string } {
  const player = state.players[playerId];
  if (!player) {
    return { valid: false, reason: 'Player not found' };
  }

  const card = player.cards.find(c => c.id === cardId);
  if (!card) {
    return { valid: false, reason: 'Card not found' };
  }

  // Check if card is selected
  if (!player.selectedCardIds.includes(cardId)) {
    return { valid: false, reason: 'Card not selected for play' };
  }

  // Validate marked cells match called numbers
  if (!validateMarkedCells(card, markedGrid, state.calledNumbers)) {
    return { valid: false, reason: 'Invalid marked cells - numbers not called' };
  }

  // Check if pattern is completed
  if (!checkPatternMatch(markedGrid, state.currentPattern)) {
    return { valid: false, reason: 'Pattern not completed' };
  }

  // Check if player already won
  if (state.winners.some(w => w.playerId === playerId)) {
    return { valid: false, reason: 'Already won' };
  }

  // Check max winners
  if (state.winners.length >= state.settings.maxWinners) {
    return { valid: false, reason: 'Maximum winners reached' };
  }

  return { valid: true };
}

// Add a winner
export function addWinner(
  state: BingoGameState,
  playerId: string,
  cardId: string,
  markedGrid: boolean[][]
): BingoGameState {
  const player = state.players[playerId];
  if (!player) return state;

  const winningPattern = getWinningCells(markedGrid, state.currentPattern);

  const winner: Winner = {
    playerId,
    playerName: player.name,
    cardId,
    place: state.winners.length + 1,
    timestamp: Date.now(),
    winningPattern,
  };

  const newWinners = [...state.winners, winner];

  // Check if game should end
  const shouldEnd =
    !state.settings.allowMultipleWinners ||
    newWinners.length >= state.settings.maxWinners;

  return {
    ...state,
    winners: newWinners,
    phase: shouldEnd ? 'finished' : state.phase,
  };
}

// Start the game
export function startGame(state: BingoGameState): BingoGameState {
  return {
    ...state,
    phase: 'playing',
    lastCallTime: Date.now(),
  };
}

// Pause the game
export function pauseGame(state: BingoGameState): BingoGameState {
  return {
    ...state,
    phase: 'paused',
  };
}

// Resume the game
export function resumeGame(state: BingoGameState): BingoGameState {
  return {
    ...state,
    phase: 'playing',
    lastCallTime: Date.now(),
  };
}

// Reset the game
export function resetGame(state: BingoGameState): BingoGameState {
  // Regenerate cards for all players
  const updatedPlayers: Record<string, BingoPlayer> = {};
  for (const [playerId, player] of Object.entries(state.players)) {
    updatedPlayers[playerId] = {
      ...player,
      cards: generateCardPool(CARD_POOL_SIZE),
      selectedCardIds: [],
      markedCells: {},
      readyToPlay: false,
    };
  }

  return {
    ...state,
    phase: 'lobby',
    players: updatedPlayers,
    calledNumbers: [],
    remainingNumbers: generateShuffledNumbers(),
    currentNumber: null,
    callHistory: [],
    winners: [],
    lastCallTime: 0,
    timeoutEndTime: null,
  };
}

// Start a timeout
export function startTimeout(
  state: BingoGameState,
  durationSeconds: number
): BingoGameState {
  return {
    ...state,
    phase: 'timeout',
    timeoutEndTime: Date.now() + durationSeconds * 1000,
  };
}

// End a timeout
export function endTimeout(state: BingoGameState): BingoGameState {
  return {
    ...state,
    phase: 'playing',
    timeoutEndTime: null,
    lastCallTime: Date.now(),
  };
}

// Update game settings
export function updateSettings(
  state: BingoGameState,
  settings: Partial<GameSettings>
): BingoGameState {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  };
}

// Update current pattern
export function updatePattern(
  state: BingoGameState,
  pattern: Pattern
): BingoGameState {
  return {
    ...state,
    currentPattern: pattern,
  };
}
