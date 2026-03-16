import { Grid } from './types';
import { makeCell, getAdjacentCells } from './gridUtils';

/**
 * Creates a fully-known truth grid with `nBombs` randomly placed mines.
 * In the truth grid every cell is `isKnown = true` — it represents ground truth.
 *
 * Cell types after creation:
 *   - Bomb cells:    isBomb=true,  value='b'
 *   - Number cells:  value 1-8 (adjacent mine count)
 *   - Null cells:    isNull=true,  value='x'  (no adjacent mines — triggers flood fill)
 */
export function createGrid(w: number, h: number, nBombs: number): Grid {
  // Initialise with unknown, un-revealed cells
  const grid: Grid = Array.from({ length: h }, (_, x) =>
    Array.from({ length: w }, (_, y) => makeCell(x, y))
  );

  // ── Place bombs ──────────────────────────────────────────────────────────
  const placedKeys = new Set<string>();
  while (placedKeys.size < nBombs) {
    const x = Math.floor(Math.random() * h);
    const y = Math.floor(Math.random() * w);
    const key = `${x},${y}`;
    if (placedKeys.has(key)) continue;
    placedKeys.add(key);

    const cellId = (x + 1) * h - (w - (y + 1));
    grid[x][y] = { x, y, value: 'b', bombs: 0, isKnown: true, isBomb: true, isNull: false, cellId };
  }

  // ── Increment value of non-bomb neighbours ───────────────────────────────
  for (const key of placedKeys) {
    const [bx, by] = key.split(',').map(Number);
    for (const adj of getAdjacentCells(grid[bx][by], grid, true)) {
      if (adj.isBomb) continue;
      const { x, y } = adj;
      const cellId = (x + 1) * h - (w - (y + 1));
      const currentValue = typeof adj.value === 'number' ? adj.value : 0;
      grid[x][y] = { x, y, value: currentValue + 1, bombs: 0, isKnown: true, isBomb: false, isNull: false, cellId };
    }
  }

  // ── Mark zero-value non-bomb cells as null (flood-fill sources) ──────────
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const cell = grid[i][j];
      if (cell.value === 0 && !cell.isBomb) {
        const cellId = (i + 1) * h - (w - (j + 1));
        grid[i][j] = { x: i, y: j, value: 'x', bombs: 0, isKnown: true, isBomb: false, isNull: true, cellId };
      }
    }
  }

  return grid;
}
