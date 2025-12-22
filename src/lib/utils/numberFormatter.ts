import { getColumnForNumber, formatNumber, type BingoColumn } from '../../../shared/types';

export { getColumnForNumber, formatNumber };

// Get column color class
export function getColumnColorClass(column: BingoColumn): string {
  const colors: Record<BingoColumn, string> = {
    B: 'bg-bingo-b',
    I: 'bg-bingo-i',
    N: 'bg-bingo-n',
    G: 'bg-bingo-g',
    O: 'bg-bingo-o',
  };
  return colors[column];
}

// Get column text color class
export function getColumnTextColorClass(column: BingoColumn): string {
  const colors: Record<BingoColumn, string> = {
    B: 'text-bingo-b',
    I: 'text-bingo-i',
    N: 'text-bingo-n',
    G: 'text-bingo-g',
    O: 'text-bingo-o',
  };
  return colors[column];
}

// Get column index (0-4)
export function getColumnIndex(column: BingoColumn): number {
  const indices: Record<BingoColumn, number> = {
    B: 0,
    I: 1,
    N: 2,
    G: 3,
    O: 4,
  };
  return indices[column];
}

// Get column from index
export function getColumnFromIndex(index: number): BingoColumn {
  const columns: BingoColumn[] = ['B', 'I', 'N', 'G', 'O'];
  return columns[index];
}

// Format time in seconds to mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format milliseconds to seconds for display
export function msToSeconds(ms: number): number {
  return Math.round(ms / 1000);
}

// Format ordinal number (1st, 2nd, 3rd, etc.)
export function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// Format ordinal in Spanish (1°, 2°, 3°, etc.)
export function formatOrdinalEs(n: number): string {
  return `${n}°`;
}
