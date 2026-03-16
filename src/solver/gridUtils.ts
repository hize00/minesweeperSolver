import { Cell, Grid } from './types';

export function makeCell(x: number, y: number, cellId = 0): Cell {
  return { x, y, value: 0, bombs: 0, isKnown: false, isBomb: false, isNull: false, cellId };
}

export function cloneCell(cell: Cell): Cell {
  return { ...cell };
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cloneCell));
}

/**
 * Returns cells adjacent to `cell` (N, S, W, E, and optionally diagonals).
 * Returns live references to grid cells — mutations will affect the grid.
 */
export function getAdjacentCells(cell: Cell, grid: Grid, diagonal: boolean): Cell[] {
  const result: Cell[] = [];
  const h = grid.length;
  const w = grid[0].length;
  const { x, y } = cell;

  if (x - 1 >= 0)       result.push(grid[x - 1][y]);
  if (x + 1 < h)        result.push(grid[x + 1][y]);
  if (y - 1 >= 0)       result.push(grid[x][y - 1]);
  if (y + 1 < w)        result.push(grid[x][y + 1]);

  if (diagonal) {
    if (x - 1 >= 0 && y - 1 >= 0) result.push(grid[x - 1][y - 1]);
    if (x - 1 >= 0 && y + 1 < w)  result.push(grid[x - 1][y + 1]);
    if (x + 1 < h && y + 1 < w)   result.push(grid[x + 1][y + 1]);
    if (x + 1 < h && y - 1 >= 0)  result.push(grid[x + 1][y - 1]);
  }

  return result;
}

/** Adjacent cells that have not yet been revealed in the exploring grid */
export function getFreeAdjacentCells(cell: Cell, grid: Grid, diagonal: boolean): Cell[] {
  return getAdjacentCells(cell, grid, diagonal).filter(c => !c.isKnown);
}

/** Count how many adjacent cells are flagged as mines */
export function updateBombCounter(cell: Cell, grid: Grid): number {
  return getAdjacentCells(cell, grid, true).filter(c => c.isBomb).length;
}

/** Returns coords of all unrevealed cells */
export function getUnclickedCells(grid: Grid): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++)
      if (!grid[i][j].isKnown) result.push([i, j]);
  return result;
}

/** Returns coords of all cells flagged as mines */
export function getGridBombs(grid: Grid): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++)
      if (grid[i][j].isBomb) result.push([i, j]);
  return result;
}

/** True when every cell in the grid is revealed (isKnown) */
export function gridCompleted(grid: Grid): boolean {
  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++)
      if (!grid[i][j].isKnown) return false;
  return true;
}
