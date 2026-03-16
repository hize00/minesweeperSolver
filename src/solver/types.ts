// Cell value: number (1-8), 'x' (null/empty), 'B' (flagged bomb in exploring), 'b' (bomb in truth grid)
export type CellValue = number | 'B' | 'x' | 'b';

export interface Cell {
  x: number;
  y: number;
  /** Adjacent mine count, or 'x' for empty, 'B'/'b' for mine */
  value: CellValue;
  /** Count of adjacent cells currently flagged as mines in exploring grid */
  bombs: number;
  isKnown: boolean;
  isBomb: boolean;
  /** True when cell has value 0 (no adjacent mines) — triggers flood fill on reveal */
  isNull: boolean;
  cellId: number;
}

export type Grid = Cell[][];

export type StepType =
  | 'initial'
  | 'random_click'
  | 'bomb_found'
  | 'free_cell_found'
  | 'two_cell_logic'
  | 'null_expansion'
  | 'complete_mines'
  | 'complete_safe'
  | 'game_over'
  | 'solved';

export interface SolverStep {
  grid: Grid;
  description: string;
  type: StepType;
  /** Coordinates of cells relevant to this step (for highlighting) */
  highlightCells: Array<[number, number]>;
}

export interface GameConfig {
  width: number;
  height: number;
  nMines: number;
}

export interface SolverResult {
  steps: SolverStep[];
  truthGrid: Grid;
  solved: boolean;
}

export const DIFFICULTY_PRESETS = {
  easy:   { label: 'Easy',   width: 9,  height: 9,  nMines: 10 },
  medium: { label: 'Medium', width: 16, height: 16, nMines: 40 },
  expert: { label: 'Expert', width: 30, height: 16, nMines: 99 },
} as const;
