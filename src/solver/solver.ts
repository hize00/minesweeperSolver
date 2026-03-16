import { Cell, Grid, SolverStep, StepType, SolverResult, GameConfig } from './types';
import {
  cloneCell, cloneGrid,
  getAdjacentCells, getFreeAdjacentCells,
  updateBombCounter, getUnclickedCells, getGridBombs, gridCompleted,
} from './gridUtils';
import { createGrid } from './gridCreator';

// ─── Helpers ────────────────────────────────────────────────────────────────

function addStep(
  steps: SolverStep[],
  grid: Grid,
  description: string,
  type: StepType,
  highlightCells: Array<[number, number]> = [],
): void {
  steps.push({ grid: cloneGrid(grid), description, type, highlightCells });
}

// ─── Flood-fill expansion from a null (empty) cell ──────────────────────────

/**
 * BFS flood-fill: reveals all null cells reachable from `cell` plus their
 * numbered border cells.  Updates `exploringGrid` in place.
 *
 * This is a cleaner rewrite of the Python `expand_cells_from_null` / `null_cell_procedure`.
 */
function expandCellsFromNull(
  cell: Cell,
  truthGrid: Grid,
  exploringGrid: Grid,
): Array<[number, number]> {
  const queue: Cell[] = [cell];
  const visited = new Set<string>([`${cell.x},${cell.y}`]);
  const borderKeys = new Set<string>(); // numbered cells on the border
  const revealed: Array<[number, number]> = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const adj of getAdjacentCells(current, truthGrid, true)) {
      const key = `${adj.x},${adj.y}`;
      // Reveal cell if not yet known
      if (!exploringGrid[adj.x][adj.y].isKnown) {
        exploringGrid[adj.x][adj.y] = cloneCell(adj);
        revealed.push([adj.x, adj.y]);
      }
      if (!visited.has(key)) {
        visited.add(key);
        if (adj.isNull) {
          queue.push(adj);        // keep expanding through empty cells
        } else if (!adj.isBomb) {
          borderKeys.add(key);   // numbered border — update counter later
        }
      }
    }
  }

  // Refresh bomb counters for numbered border cells
  for (const key of borderKeys) {
    const [x, y] = key.split(',').map(Number);
    exploringGrid[x][y].bombs = updateBombCounter(exploringGrid[x][y], exploringGrid);
  }

  return revealed;
}

// ─── Cell click ─────────────────────────────────────────────────────────────

function clickCell(
  x: number,
  y: number,
  truthGrid: Grid,
  exploringGrid: Grid,
  steps: SolverStep[],
  reason: string,
): { cell: Cell | null; revealed: Array<[number, number]> } {
  const truth = truthGrid[x][y];

  if (truth.isBomb) {
    // Hit a mine → game over
    exploringGrid[x][y] = { ...cloneCell(truth), value: 'B' };
    addStep(steps, exploringGrid, `GAME OVER — hit mine at (${x}, ${y})`, 'game_over', [[x, y]]);
    return { cell: null, revealed: [[x, y]] };
  }

  if (truth.isNull) {
    // Empty cell → flood fill reveals neighbouring region
    exploringGrid[x][y] = cloneCell(truth);
    const revealed = expandCellsFromNull(truth, truthGrid, exploringGrid);
    addStep(
      steps, exploringGrid,
      `${reason}: empty cell (${x}, ${y}) — flood-fill revealed ${revealed.length + 1} cells`,
      'null_expansion',
      [[x, y], ...revealed],
    );
    return { cell: exploringGrid[x][y], revealed };
  }

  // Numbered cell
  const nBombs = updateBombCounter(truth, exploringGrid);
  const updated: Cell = { ...cloneCell(truth), bombs: nBombs };
  exploringGrid[x][y] = updated;
  addStep(steps, exploringGrid, `${reason}: (${x}, ${y}) → ${truth.value}`, 'free_cell_found', [[x, y]]);
  return { cell: updated, revealed: [[x, y]] };
}

// ─── Strategy 1 — Deterministic single-cell logic ──────────────────────────

/**
 * bomb_finder: if a revealed number cell has exactly `residual` unknown
 * neighbours (where residual = value − flaggedBombs), they must all be mines.
 */
function bombFinder(exploringGrid: Grid): Cell[] {
  const h = exploringGrid.length;
  const w = exploringGrid[0].length;
  const bombs: Cell[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const cell = exploringGrid[i][j];
      if (!cell.isKnown || cell.isBomb || cell.isNull || typeof cell.value !== 'number') continue;
      const residual = cell.value - cell.bombs;
      if (residual <= 0) continue;
      const free = getFreeAdjacentCells(cell, exploringGrid, true);
      if (free.length === residual) {
        for (const f of free) {
          const key = `${f.x},${f.y}`;
          if (!seen.has(key)) { seen.add(key); bombs.push(f); }
        }
      }
    }
  }
  return bombs;
}

/**
 * free_cell_finder: if a revealed number cell has all its mines flagged,
 * all remaining unknown neighbours are safe.
 */
function freeCellFinder(exploringGrid: Grid): Cell[] {
  const h = exploringGrid.length;
  const w = exploringGrid[0].length;
  const free: Cell[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const cell = exploringGrid[i][j];
      if (!cell.isKnown || cell.isBomb || cell.isNull || typeof cell.value !== 'number') continue;
      if (cell.bombs !== cell.value) continue;
      for (const f of getFreeAdjacentCells(cell, exploringGrid, true)) {
        const key = `${f.x},${f.y}`;
        if (!seen.has(key)) { seen.add(key); free.push(f); }
      }
    }
  }
  return free;
}

/**
 * Repeatedly apply bomb_finder + free_cell_finder until no new info is found.
 * Returns the number of productive iterations.
 */
function deterministicStrategy(
  truthGrid: Grid,
  exploringGrid: Grid,
  steps: SolverStep[],
): number {
  let iterations = 0;
  let progress = true;

  while (progress) {
    // ── Flag mines ──────────────────────────────────────────────────────────
    const newBombs = bombFinder(exploringGrid);
    for (const b of newBombs) {
      exploringGrid[b.x][b.y] = { ...b, isBomb: true, isKnown: true, value: 'B' };
      // Refresh bomb counters of revealed neighbours
      for (const adj of getAdjacentCells(exploringGrid[b.x][b.y], exploringGrid, true)) {
        if (adj.isKnown && !adj.isBomb && !adj.isNull) {
          exploringGrid[adj.x][adj.y].bombs += 1;
        }
      }
      addStep(steps, exploringGrid, `Deterministic: mine at (${b.x}, ${b.y})`, 'bomb_found', [[b.x, b.y]]);
    }

    // ── Click safe cells ────────────────────────────────────────────────────
    const safeCells = freeCellFinder(exploringGrid);
    for (const f of safeCells) {
      const { cell } = clickCell(f.x, f.y, truthGrid, exploringGrid, steps, 'Deterministic: safe');
      if (cell === null) return iterations; // game over — caller will handle
    }

    progress = newBombs.length > 0 || safeCells.length > 0;
    if (progress) iterations++;
  }

  return iterations;
}

// ─── Strategy 2 — Two-cell intersection logic ───────────────────────────────

/**
 * Returns all pairs of horizontally/vertically adjacent revealed number cells.
 * Each pair appears only once (no duplicates).
 */
function getAdjacentPairs(exploringGrid: Grid): Array<[Cell, Cell]> {
  const h = exploringGrid.length;
  const w = exploringGrid[0].length;
  const pairs: Array<[Cell, Cell]> = [];
  const seen = new Set<string>();

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const c1 = exploringGrid[i][j];
      if (!c1.isKnown || c1.isNull || c1.isBomb) continue;
      for (const c2 of getAdjacentCells(c1, exploringGrid, false)) { // cardinal only
        if (!c2.isKnown || c2.isNull || c2.isBomb) continue;
        const key1 = `${c1.x},${c1.y}|${c2.x},${c2.y}`;
        const key2 = `${c2.x},${c2.y}|${c1.x},${c1.y}`;
        if (!seen.has(key1) && !seen.has(key2)) {
          seen.add(key1);
          pairs.push([c1, c2]);
        }
      }
    }
  }
  return pairs;
}

/**
 * Two-cell logic: compare the free-neighbour sets of two adjacent revealed cells.
 *
 * If their sets differ by exactly 1 cell and the conditions below are met:
 *   - both residuals = 1  → the unique cell is SAFE
 *   - one residual > 1    → the unique cell is a MINE
 *
 * Faithfully translated from the Python original (including the asymmetric
 * condition that uses residualC1 in both branches — a quirk of the original).
 */
function twoCellsLogic(c1: Cell, c2: Cell, exploringGrid: Grid): Cell | null {
  if (typeof c1.value !== 'number' || typeof c2.value !== 'number') return null;

  const freeC1 = getFreeAdjacentCells(c1, exploringGrid, true);
  const freeC2 = getFreeAdjacentCells(c2, exploringGrid, true);
  const nC1 = freeC1.length;
  const nC2 = freeC2.length;
  const resC1 = c1.value - c1.bombs;
  const resC2 = c2.value - c2.bombs;

  // Gate condition (mirrors Python exactly — second branch intentionally uses resC1)
  const condition = (nC1 === resC1 + 1 && resC1 === 1) || (nC2 === resC2 + 1 && resC1 === 1);
  if (!condition) return null;
  if (Math.abs(nC1 - nC2) !== 1) return null;

  const keys1 = new Set(freeC1.map(c => `${c.x},${c.y}`));
  const keys2 = new Set(freeC2.map(c => `${c.x},${c.y}`));

  const diff = nC1 > nC2
    ? freeC1.filter(c => !keys2.has(`${c.x},${c.y}`))
    : freeC2.filter(c => !keys1.has(`${c.x},${c.y}`));

  if (diff.length !== 1) return null;
  const cell = diff[0];

  if (resC1 === 1 && resC2 === 1) {
    // Differing cell is safe
    return { ...cell, isKnown: true, isBomb: false, isNull: false };
  } else if (resC1 > 1 || resC2 > 1) {
    // Differing cell is a mine
    return { ...cell, value: 'B', bombs: 0, isKnown: true, isBomb: true, isNull: false };
  }
  return null;
}

// ─── Main solver loop ────────────────────────────────────────────────────────

export function runSolver(config: GameConfig): SolverResult {
  const { width, height, nMines } = config;
  const truthGrid = createGrid(width, height, nMines);
  const steps: SolverStep[] = [];

  // Exploring grid starts fully hidden
  const exploringGrid: Grid = Array.from({ length: height }, (_, x) =>
    Array.from({ length: width }, (_, y) => ({
      x, y, value: 0 as const, bombs: 0,
      isKnown: false, isBomb: false, isNull: false,
      cellId: x * width + y + 1,
    })),
  );

  addStep(steps, exploringGrid, 'New game — all cells hidden', 'initial');

  let randomClick = true; // first action is always a random click
  let gameDone = false;
  let gameOver = false;
  const MAX_ITERATIONS = width * height * 3; // safety cap
  let guard = 0;

  while (!gameDone && !gameOver && guard++ < MAX_ITERATIONS) {

    // ── Early completion checks ─────────────────────────────────────────────
    const knownMines = getGridBombs(exploringGrid).length;
    const hidden = getUnclickedCells(exploringGrid);

    if (hidden.length === 0) { gameDone = true; break; }

    if (nMines - knownMines === hidden.length) {
      // Every remaining hidden cell must be a mine
      for (const [x, y] of hidden) {
        exploringGrid[x][y] = { ...exploringGrid[x][y], isBomb: true, isKnown: true, value: 'B' };
        for (const adj of getAdjacentCells(exploringGrid[x][y], exploringGrid, true)) {
          if (adj.isKnown && !adj.isBomb && !adj.isNull) adj.bombs += 1;
        }
      }
      addStep(steps, exploringGrid, `Count: remaining ${hidden.length} hidden cells are all mines`, 'complete_mines', hidden);
      gameDone = true;
      break;
    }

    if (nMines - knownMines === 0 && hidden.length > 0) {
      // All mines are flagged — click every remaining hidden cell
      for (const [x, y] of hidden) {
        const { cell } = clickCell(x, y, truthGrid, exploringGrid, steps, 'Count: no mines left');
        if (cell === null) { gameOver = true; break; }
      }
      if (!gameOver) gameDone = true;
      break;
    }

    // ── Main strategy switch ────────────────────────────────────────────────
    let deterIter = 0;
    let twoCellPairs = 0;

    if (randomClick) {
      // Pick a random hidden cell
      const idx = Math.floor(Math.random() * hidden.length);
      const [rx, ry] = hidden[idx];
      // Overwrite the step type to 'random_click' after clickCell emits 'free_cell_found'
      const prevLen = steps.length;
      const { cell } = clickCell(rx, ry, truthGrid, exploringGrid, steps, 'Random click');
      if (steps.length > prevLen) steps[steps.length - 1].type = 'random_click';
      if (cell === null) { gameOver = true; break; }

    } else {
      // 1. Deterministic: flag mines + click safe cells
      deterIter = deterministicStrategy(truthGrid, exploringGrid, steps);

      // Check for game over triggered inside deterministic
      if (steps.length > 0 && steps[steps.length - 1].type === 'game_over') {
        gameOver = true; break;
      }

      // 2. Two-cell intersection logic
      const pairs = getAdjacentPairs(exploringGrid);
      for (const [c1, c2] of pairs) {
        const disc = twoCellsLogic(c1, c2, exploringGrid);
        if (disc === null) continue;
        twoCellPairs++;

        if (disc.isBomb) {
          exploringGrid[disc.x][disc.y] = disc;
          for (const adj of getAdjacentCells(disc, exploringGrid, true)) {
            if (adj.isKnown && !adj.isBomb && !adj.isNull) adj.bombs += 1;
          }
          addStep(steps, exploringGrid, `2-cell logic: mine at (${disc.x}, ${disc.y})`, 'two_cell_logic', [[disc.x, disc.y]]);
        } else {
          const { cell } = clickCell(disc.x, disc.y, truthGrid, exploringGrid, steps, '2-cell logic: safe');
          if (cell === null) { gameOver = true; break; }
          if (steps.length > 0) steps[steps.length - 1].type = 'two_cell_logic';
        }
        if (gameOver) break;
      }
      if (gameOver) break;
    }

    // ── Decide next mode ────────────────────────────────────────────────────
    if (deterIter === 0 && twoCellPairs === 0) {
      randomClick = !randomClick; // toggle: if nothing worked, try the other mode
    } else {
      randomClick = false;
      gameDone = gridCompleted(exploringGrid);
    }
  }

  if (gameDone && !gameOver) {
    addStep(steps, exploringGrid, 'BOARD SOLVED! All mines correctly identified.', 'solved');
  }

  return { steps, truthGrid, solved: gameDone && !gameOver };
}
