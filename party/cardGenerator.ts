import type { BingoCard, CellValue } from '../shared/types';
import { GRID_SIZE, CARD_POOL_SIZE } from '../shared/constants';

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
  const columnB = generateColumn(1, 15);
  const columnI = generateColumn(16, 30);
  const columnN = generateColumn(31, 45);
  const columnG = generateColumn(46, 60);
  const columnO = generateColumn(61, 75);

  const grid: CellValue[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [
      columnB[row],
      columnI[row],
      row === 2 ? 'FREE' : columnN[row],
      columnG[row],
      columnO[row],
    ];
  }

  return {
    id: generateId(),
    grid,
  };
}

// Generate a pool of unique cards
export function generateCardPool(count: number = CARD_POOL_SIZE): BingoCard[] {
  const cards: BingoCard[] = [];
  const usedSignatures = new Set<string>();

  while (cards.length < count) {
    const card = generateBingoCard();
    const signature = card.grid.flat().join(',');

    if (!usedSignatures.has(signature)) {
      usedSignatures.add(signature);
      cards.push(card);
    }
  }

  return cards;
}

// Generate all 75 numbers in random order
export function generateShuffledNumbers(): number[] {
  return shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
}

// Create an empty marked grid
export function createEmptyMarkedGrid(): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      grid[row][col] = row === 2 && col === 2; // FREE space
    }
  }
  return grid;
}
