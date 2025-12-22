import type { Pattern, CellValue, BingoCard } from '../shared/types';
import { GRID_SIZE } from '../shared/constants';

// Check if a specific pattern is matched
export function checkPatternMatch(
  markedGrid: boolean[][],
  pattern: Pattern
): boolean {
  switch (pattern.id) {
    case 'horizontal-line':
      return checkAnyHorizontalLine(markedGrid);
    case 'vertical-line':
      return checkAnyVerticalLine(markedGrid);
    case 'diagonal':
      return checkAnyDiagonal(markedGrid);
    case 'any-line':
      return checkAnyLine(markedGrid);
    case 'postage-stamp':
      return checkPostageStamp(markedGrid);
    default:
      return checkExactPattern(markedGrid, pattern.grid);
  }
}

function checkExactPattern(markedGrid: boolean[][], patternGrid: boolean[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (patternGrid[row][col] && !markedGrid[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function checkAnyHorizontalLine(markedGrid: boolean[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    if (markedGrid[row].every(cell => cell)) {
      return true;
    }
  }
  return false;
}

function checkAnyVerticalLine(markedGrid: boolean[][]): boolean {
  for (let col = 0; col < GRID_SIZE; col++) {
    let complete = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (!markedGrid[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete) return true;
  }
  return false;
}

function checkAnyDiagonal(markedGrid: boolean[][]): boolean {
  let diagonal1 = true;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!markedGrid[i][i]) {
      diagonal1 = false;
      break;
    }
  }
  if (diagonal1) return true;

  let diagonal2 = true;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!markedGrid[i][GRID_SIZE - 1 - i]) {
      diagonal2 = false;
      break;
    }
  }
  return diagonal2;
}

function checkAnyLine(markedGrid: boolean[][]): boolean {
  return (
    checkAnyHorizontalLine(markedGrid) ||
    checkAnyVerticalLine(markedGrid) ||
    checkAnyDiagonal(markedGrid)
  );
}

function checkPostageStamp(markedGrid: boolean[][]): boolean {
  const corners = [[0, 0], [0, 3], [3, 0], [3, 3]];
  for (const [startRow, startCol] of corners) {
    let complete = true;
    for (let row = startRow; row < startRow + 2; row++) {
      for (let col = startCol; col < startCol + 2; col++) {
        if (!markedGrid[row][col]) {
          complete = false;
          break;
        }
      }
      if (!complete) break;
    }
    if (complete) return true;
  }
  return false;
}

// Validate that marked cells match called numbers
export function validateMarkedCells(
  card: BingoCard,
  markedGrid: boolean[][],
  calledNumbers: number[]
): boolean {
  const calledSet = new Set(calledNumbers);

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cellValue = card.grid[row][col];
      const isMarked = markedGrid[row][col];

      if (cellValue === 'FREE') {
        continue;
      }

      if (isMarked && !calledSet.has(cellValue)) {
        return false;
      }
    }
  }

  return true;
}

// Get the winning cells for a pattern
export function getWinningCells(
  markedGrid: boolean[][],
  pattern: Pattern
): boolean[][] {
  const winningCells: boolean[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false));

  switch (pattern.id) {
    case 'horizontal-line':
      for (let row = 0; row < GRID_SIZE; row++) {
        if (markedGrid[row].every(cell => cell)) {
          for (let col = 0; col < GRID_SIZE; col++) {
            winningCells[row][col] = true;
          }
          break;
        }
      }
      break;

    case 'vertical-line':
      for (let col = 0; col < GRID_SIZE; col++) {
        let complete = true;
        for (let row = 0; row < GRID_SIZE; row++) {
          if (!markedGrid[row][col]) {
            complete = false;
            break;
          }
        }
        if (complete) {
          for (let row = 0; row < GRID_SIZE; row++) {
            winningCells[row][col] = true;
          }
          break;
        }
      }
      break;

    case 'diagonal':
    case 'any-line':
      for (let row = 0; row < GRID_SIZE; row++) {
        if (markedGrid[row].every(cell => cell)) {
          for (let col = 0; col < GRID_SIZE; col++) {
            winningCells[row][col] = true;
          }
          return winningCells;
        }
      }
      for (let col = 0; col < GRID_SIZE; col++) {
        let complete = true;
        for (let row = 0; row < GRID_SIZE; row++) {
          if (!markedGrid[row][col]) {
            complete = false;
            break;
          }
        }
        if (complete) {
          for (let row = 0; row < GRID_SIZE; row++) {
            winningCells[row][col] = true;
          }
          return winningCells;
        }
      }
      let d1 = true;
      for (let i = 0; i < GRID_SIZE; i++) {
        if (!markedGrid[i][i]) d1 = false;
      }
      if (d1) {
        for (let i = 0; i < GRID_SIZE; i++) {
          winningCells[i][i] = true;
        }
        return winningCells;
      }
      for (let i = 0; i < GRID_SIZE; i++) {
        winningCells[i][GRID_SIZE - 1 - i] = true;
      }
      break;

    case 'postage-stamp':
      const corners = [[0, 0], [0, 3], [3, 0], [3, 3]];
      for (const [startRow, startCol] of corners) {
        let complete = true;
        for (let row = startRow; row < startRow + 2; row++) {
          for (let col = startCol; col < startCol + 2; col++) {
            if (!markedGrid[row][col]) {
              complete = false;
              break;
            }
          }
          if (!complete) break;
        }
        if (complete) {
          for (let row = startRow; row < startRow + 2; row++) {
            for (let col = startCol; col < startCol + 2; col++) {
              winningCells[row][col] = true;
            }
          }
          return winningCells;
        }
      }
      break;

    default:
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (pattern.grid[row][col]) {
            winningCells[row][col] = true;
          }
        }
      }
  }

  return winningCells;
}
