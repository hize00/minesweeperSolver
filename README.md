# MINE-A-JOY-A: Minesweeper Solver

A minesweeper solving algorithm with a web-based step-by-step visualiser.

---

## How to run

```bash
# Install Node.js if not already present (requires Homebrew on macOS)
brew install node

# From the project folder
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Visualiser features

- **Step-by-step replay** — every decision the algorithm makes is recorded as a snapshot. Use Prev / Next to walk through them one at a time, or hit Play to watch it run automatically.
- **Playback speed** — six speed settings from 0.25× to 8×.
- **Show full solution** — toggle to reveal the truth grid (complete mine layout) at any point, independently of how far the solver has progressed.
- **Step log** — scrollable history of the last decisions, colour-coded by type (random click, mine found, safe cell, flood fill, 2-cell logic, etc.).
- **Stats bar** — live counts of mines flagged, cells revealed, hidden cells and coverage %.
- **Difficulty presets** — Easy (9×9 / 10 mines), Medium (16×16 / 40), Expert (30×16 / 99), or custom dimensions.
- **Cell colour coding** — numbers 1–8 use distinct colours; mines are shown in red; empty (null) cells in dark grey; the cell(s) involved in the current step are highlighted in gold.

---

## Solving algorithm

The solver runs three strategies in order of preference, falling back to the next when the current one yields no new information:

1. **Deterministic — single cell**
   - *Mine finder*: if a revealed number cell has exactly N unknown neighbours remaining and N unflagged mines to account for, all those neighbours are mines.
   - *Safe cell finder*: if all mines adjacent to a revealed cell are already flagged, every remaining unknown neighbour is safe to click.
   - These two rules are applied in a loop until exhausted.

2. **Deterministic — two-cell intersection**
   Compares pairs of horizontally/vertically adjacent revealed cells. If their sets of unknown neighbours differ by exactly one cell, that unique cell can be identified as a mine or safe depending on the remaining mine counts.

3. **Random click**
   When no deterministic strategy applies, a random hidden cell is clicked. This is the only source of potential failure — clicking a mine by chance is considered bad luck, not a bug.

**Flood fill**: clicking an empty cell (zero adjacent mines) automatically reveals the entire connected empty region and its numbered border, just like real Minesweeper.

**Completeness shortcuts**: if the number of remaining hidden cells equals the number of unflagged mines, all hidden cells are flagged immediately. If all mines are already flagged, all remaining hidden cells are clicked at once.

---

## Project structure

```
mine_solver.py          # Original Python implementation (Tkinter GUI)
src/
  solver/
    types.ts            # Cell, Grid, SolverStep types + difficulty presets
    gridUtils.ts        # Pure grid helpers (adjacency, counters, flood fill)
    gridCreator.ts      # Random board generation
    solver.ts           # Full solving loop — returns array of step snapshots
  components/
    Grid.tsx            # CSS grid renderer with adaptive cell sizing
    Controls.tsx        # Difficulty, playback and speed controls
  App.tsx               # Main app state (step navigation, autoplay)
  App.css               # Dark minesweeper theme
```

---

## Example Run

https://github.com/user-attachments/assets/096091cd-856a-430a-b9e2-721265de8b23





## Notes

The algorithm is not guaranteed to solve every board. When forced into a random click it may hit a mine: that outcome is expected and not a bug. Deterministic losses (losing without making a random click) would indicate a calculation error; please report those if found.
