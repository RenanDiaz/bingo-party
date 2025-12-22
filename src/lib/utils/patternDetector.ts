import type { Pattern, CellValue } from '../../../shared/types';
import { GRID_SIZE } from '../../../shared/constants';

// Check if a specific pattern is matched
export function checkPatternMatch(
  markedGrid: boolean[][],
  pattern: Pattern
): boolean {
  // Handle special patterns that have multiple valid configurations
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
      // Standard pattern check
      return checkExactPattern(markedGrid, pattern.grid);
  }
}

// Check if marked grid matches exact pattern
function checkExactPattern(markedGrid: boolean[][], patternGrid: boolean[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      // If pattern requires this cell to be marked
      if (patternGrid[row][col] && !markedGrid[row][col]) {
        return false;
      }
    }
  }
  return true;
}

// Check any horizontal line (5 in a row)
function checkAnyHorizontalLine(markedGrid: boolean[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    if (markedGrid[row].every(cell => cell)) {
      return true;
    }
  }
  return false;
}

// Check any vertical line (5 in a column)
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

// Check any diagonal
function checkAnyDiagonal(markedGrid: boolean[][]): boolean {
  // Top-left to bottom-right
  let diagonal1 = true;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!markedGrid[i][i]) {
      diagonal1 = false;
      break;
    }
  }
  if (diagonal1) return true;

  // Top-right to bottom-left
  let diagonal2 = true;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!markedGrid[i][GRID_SIZE - 1 - i]) {
      diagonal2 = false;
      break;
    }
  }
  return diagonal2;
}

// Check any line (horizontal, vertical, or diagonal)
function checkAnyLine(markedGrid: boolean[][]): boolean {
  return (
    checkAnyHorizontalLine(markedGrid) ||
    checkAnyVerticalLine(markedGrid) ||
    checkAnyDiagonal(markedGrid)
  );
}

// Check postage stamp (2x2 in any corner)
function checkPostageStamp(markedGrid: boolean[][]): boolean {
  const corners = [
    [0, 0], // Top-left
    [0, 3], // Top-right
    [3, 0], // Bottom-left
    [3, 3], // Bottom-right
  ];

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

// Get the winning cells (cells that form the winning pattern)
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
      // Check horizontals first
      for (let row = 0; row < GRID_SIZE; row++) {
        if (markedGrid[row].every(cell => cell)) {
          for (let col = 0; col < GRID_SIZE; col++) {
            winningCells[row][col] = true;
          }
          return winningCells;
        }
      }
      // Check verticals
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
      // Check diagonal 1
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
      // Check diagonal 2
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
      // For standard patterns, winning cells are the pattern cells
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

// Validate that marked cells match called numbers (for server validation)
export function validateMarkedCells(
  cardGrid: CellValue[][],
  markedGrid: boolean[][],
  calledNumbers: number[]
): boolean {
  const calledSet = new Set(calledNumbers);

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cellValue = cardGrid[row][col];
      const isMarked = markedGrid[row][col];

      // FREE space is always allowed to be marked
      if (cellValue === 'FREE') {
        continue;
      }

      // If cell is marked, it must be a called number
      if (isMarked && !calledSet.has(cellValue)) {
        return false;
      }
    }
  }

  return true;
}
