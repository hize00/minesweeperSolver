import { Cell, Grid } from '../solver/types';

// Colour palette matching the original Python Tkinter UI
const NUMBER_COLORS: Record<string, string> = {
  '1': '#4a9eff',   // blue
  '2': '#4dff91',   // green
  '3': '#c084fc',   // violet
  '4': '#fb923c',   // chocolate/orange
  '5': '#a16207',   // brown
  '6': '#fbbf24',   // yellow
  '7': '#22d3ee',   // cyan
  '8': '#c026d3',   // dark magenta
};

interface CellStyleResult {
  bg: string;
  fg: string;
  text: string;
  opacity: number;
}

function getCellStyle(cell: Cell, showingTruth: boolean): CellStyleResult {
  const reveal = cell.isKnown || showingTruth;

  if (!reveal) {
    return { bg: '#3a3a5c', fg: '#7070a0', text: '', opacity: 1 };
  }

  if (cell.isBomb) {
    // In truth grid bombs appear as 'b', in exploring as 'B'
    return { bg: '#e94560', fg: '#ffffff', text: '💣', opacity: 1 };
  }

  if (cell.isNull) {
    return { bg: '#2a2a4a', fg: '#6a6a8a', text: '', opacity: 1 };
  }

  if (typeof cell.value === 'number' && cell.value > 0) {
    const color = NUMBER_COLORS[String(cell.value)] ?? '#ffffff';
    return { bg: '#1e1e3a', fg: color, text: String(cell.value), opacity: 1 };
  }

  // Revealed zero that somehow isn't null (shouldn't happen normally)
  return { bg: '#2a2a4a', fg: '#6a6a8a', text: '', opacity: 1 };
}

interface GridCellProps {
  cell: Cell;
  isHighlighted: boolean;
  showingTruth: boolean;
  cellSize: number;
}

function GridCell({ cell, isHighlighted, showingTruth, cellSize }: GridCellProps) {
  const { bg, fg, text } = getCellStyle(cell, showingTruth);

  const border = isHighlighted ? '2px solid #ffd700' : '1px solid #2a2a4a';
  const boxShadow = isHighlighted ? '0 0 6px #ffd700' : 'none';
  const fontSize = cellSize > 24 ? Math.floor(cellSize * 0.55) : Math.floor(cellSize * 0.6);

  return (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        background: bg,
        color: fg,
        border,
        boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 'bold',
        fontFamily: "'Courier New', monospace",
        cursor: 'default',
        userSelect: 'none',
        transition: 'background 0.15s, box-shadow 0.15s',
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}

interface GridProps {
  grid: Grid;
  highlightCells: Array<[number, number]>;
  showingTruth: boolean;
}

function computeCellSize(cols: number, rows: number): number {
  // Fit within roughly 70vw × 60vh; cap at 40px, floor at 12px
  const maxByWidth = Math.floor((window.innerWidth * 0.70) / cols);
  const maxByHeight = Math.floor((window.innerHeight * 0.58) / rows);
  return Math.min(40, Math.max(12, Math.min(maxByWidth, maxByHeight)));
}

export default function GridView({ grid, highlightCells, showingTruth }: GridProps) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const cellSize = computeCellSize(cols, rows);

  const highlightSet = new Set(highlightCells.map(([r, c]) => `${r},${c}`));

  return (
    <div
      style={{
        display: 'inline-block',
        border: '2px solid #4a4a7a',
        borderRadius: 4,
        overflow: 'auto',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <GridCell
              key={`${r},${c}`}
              cell={cell}
              isHighlighted={highlightSet.has(`${r},${c}`)}
              showingTruth={showingTruth}
              cellSize={cellSize}
            />
          ))
        )}
      </div>
    </div>
  );
}
