import type { Pattern } from './types';

// Helper to create a 5x5 grid with all false
function emptyGrid(): boolean[][] {
  return Array(5).fill(null).map(() => Array(5).fill(false));
}

// Helper to set specific cells
function setPattern(cells: [number, number][]): boolean[][] {
  const grid = emptyGrid();
  for (const [row, col] of cells) {
    grid[row][col] = true;
  }
  return grid;
}

// Traditional horizontal line patterns
function horizontalLine(row: number): boolean[][] {
  return setPattern([[row, 0], [row, 1], [row, 2], [row, 3], [row, 4]]);
}

// Traditional vertical line patterns
function verticalLine(col: number): boolean[][] {
  return setPattern([[0, col], [1, col], [2, col], [3, col], [4, col]]);
}

// Diagonal patterns
const diagonalTopLeft: boolean[][] = setPattern([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
const diagonalTopRight: boolean[][] = setPattern([[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]]);

// Preset patterns
export const PRESET_PATTERNS: Pattern[] = [
  {
    id: 'horizontal-line',
    name: 'Horizontal Line',
    nameEs: 'Línea Horizontal',
    type: 'preset',
    grid: horizontalLine(0), // Example, actual checking handles any row
    description: 'Complete any horizontal row',
    descriptionEs: 'Completa cualquier fila horizontal',
  },
  {
    id: 'vertical-line',
    name: 'Vertical Line',
    nameEs: 'Línea Vertical',
    type: 'preset',
    grid: verticalLine(0), // Example, actual checking handles any column
    description: 'Complete any vertical column',
    descriptionEs: 'Completa cualquier columna vertical',
  },
  {
    id: 'diagonal',
    name: 'Diagonal Line',
    nameEs: 'Línea Diagonal',
    type: 'preset',
    grid: diagonalTopLeft,
    description: 'Complete either diagonal',
    descriptionEs: 'Completa cualquier diagonal',
  },
  {
    id: 'any-line',
    name: 'Any Line',
    nameEs: 'Cualquier Línea',
    type: 'preset',
    grid: horizontalLine(0), // Visual example only
    description: 'Complete any horizontal, vertical, or diagonal line',
    descriptionEs: 'Completa cualquier línea horizontal, vertical o diagonal',
  },
  {
    id: 'four-corners',
    name: 'Four Corners',
    nameEs: 'Cuatro Esquinas',
    type: 'preset',
    grid: setPattern([[0, 0], [0, 4], [4, 0], [4, 4]]),
    description: 'Mark all four corners',
    descriptionEs: 'Marca las cuatro esquinas',
  },
  {
    id: 'blackout',
    name: 'Blackout',
    nameEs: 'Cartón Lleno',
    type: 'preset',
    grid: Array(5).fill(null).map(() => Array(5).fill(true)),
    description: 'Mark every cell on the card',
    descriptionEs: 'Marca todas las casillas del cartón',
  },
  {
    id: 'letter-x',
    name: 'Letter X',
    nameEs: 'Letra X',
    type: 'preset',
    grid: setPattern([
      [0, 0], [0, 4],
      [1, 1], [1, 3],
      [2, 2],
      [3, 1], [3, 3],
      [4, 0], [4, 4]
    ]),
    description: 'Form an X shape with both diagonals',
    descriptionEs: 'Forma una X con ambas diagonales',
  },
  {
    id: 'letter-t',
    name: 'Letter T',
    nameEs: 'Letra T',
    type: 'preset',
    grid: setPattern([
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2]
    ]),
    description: 'Form a T shape with top row and middle column',
    descriptionEs: 'Forma una T con la fila superior y la columna central',
  },
  {
    id: 'letter-l',
    name: 'Letter L',
    nameEs: 'Letra L',
    type: 'preset',
    grid: setPattern([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]
    ]),
    description: 'Form an L shape with left column and bottom row',
    descriptionEs: 'Forma una L con la columna izquierda y la fila inferior',
  },
  {
    id: 'plus',
    name: 'Plus Sign',
    nameEs: 'Signo Más',
    type: 'preset',
    grid: setPattern([
      [0, 2],
      [1, 2],
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      [3, 2],
      [4, 2]
    ]),
    description: 'Form a plus sign with middle row and column',
    descriptionEs: 'Forma un signo más con la fila y columna central',
  },
  {
    id: 'picture-frame',
    name: 'Picture Frame',
    nameEs: 'Marco',
    type: 'preset',
    grid: setPattern([
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 0], [1, 4],
      [2, 0], [2, 4],
      [3, 0], [3, 4],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]
    ]),
    description: 'Mark all cells on the outer edge',
    descriptionEs: 'Marca todas las casillas del borde exterior',
  },
  {
    id: 'postage-stamp',
    name: 'Postage Stamp',
    nameEs: 'Estampilla',
    type: 'preset',
    grid: setPattern([[0, 0], [0, 1], [1, 0], [1, 1]]),
    description: 'Complete a 2x2 square in any corner',
    descriptionEs: 'Completa un cuadrado 2x2 en cualquier esquina',
  },
  {
    id: 'chevron-up',
    name: 'Chevron',
    nameEs: 'Flecha',
    type: 'preset',
    grid: setPattern([
      [2, 2],
      [3, 1], [3, 3],
      [4, 0], [4, 4]
    ]),
    description: 'Form a V or arrow shape',
    descriptionEs: 'Forma una V o flecha',
  },
];

// Get a pattern by ID
export function getPatternById(id: string): Pattern | undefined {
  return PRESET_PATTERNS.find(p => p.id === id);
}

// Default pattern (any line)
export const DEFAULT_PATTERN = PRESET_PATTERNS.find(p => p.id === 'any-line')!;
