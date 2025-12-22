import type { BingoCard, CellValue } from '../../../shared/types';
import { GRID_SIZE, CARD_POOL_SIZE } from '../../../shared/constants';

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Shuffle an array using Fisher-Yates algorithm
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate numbers for a column
function generateColumn(min: number, max: number, count: number = GRID_SIZE): number[] {
  const available = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return shuffle(available).slice(0, count);
}

// Generate a single bingo card
export function generateBingoCard(): BingoCard {
  // Generate 5 random numbers for each column
  const columnB = generateColumn(1, 15);
  const columnI = generateColumn(16, 30);
  const columnN = generateColumn(31, 45); // Will use only 4 for display (center is FREE)
  const columnG = generateColumn(46, 60);
  const columnO = generateColumn(61, 75);

  // Build 5x5 grid (rows)
  const grid: CellValue[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [
      columnB[row],
      columnI[row],
      row === 2 ? 'FREE' : columnN[row], // FREE space in center
      columnG[row],
      columnO[row],
    ];
  }

  return {
    id: generateId(),
    grid,
  };
}

// Generate a pool of unique cards for a player
export function generateCardPool(count: number = CARD_POOL_SIZE): BingoCard[] {
  const cards: BingoCard[] = [];
  const usedSignatures = new Set<string>();

  while (cards.length < count) {
    const card = generateBingoCard();
    // Create a signature to check for duplicates
    const signature = card.grid.flat().join(',');

    if (!usedSignatures.has(signature)) {
      usedSignatures.add(signature);
      cards.push(card);
    }
  }

  return cards;
}

// Create an empty marked grid
export function createEmptyMarkedGrid(): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      // Center cell (FREE) is always marked
      grid[row][col] = row === 2 && col === 2;
    }
  }
  return grid;
}

// Auto-mark all occurrences of a number in a marked grid
export function autoMarkNumber(
  cardGrid: CellValue[][],
  markedGrid: boolean[][],
  number: number
): boolean[][] {
  const newMarked = markedGrid.map(row => [...row]);

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (cardGrid[row][col] === number) {
        newMarked[row][col] = true;
      }
    }
  }

  return newMarked;
}

// Check if a number exists in a card
export function cardContainsNumber(card: BingoCard, number: number): boolean {
  for (const row of card.grid) {
    if (row.includes(number)) {
      return true;
    }
  }
  return false;
}

// Get the position of a number in a card
export function getNumberPosition(
  card: BingoCard,
  number: number
): { row: number; col: number } | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (card.grid[row][col] === number) {
        return { row, col };
      }
    }
  }
  return null;
}
