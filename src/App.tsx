import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { GameConfig, SolverResult, SolverStep, DIFFICULTY_PRESETS } from './solver/types';
import { runSolver } from './solver/solver';
import { getGridBombs, getUnclickedCells } from './solver/gridUtils';
import GridView from './components/Grid';
import Controls from './components/Controls';

const STEP_TYPE_LABELS: Record<string, string> = {
  initial:          'Start',
  random_click:     'Random',
  bomb_found:       'Mine Found',
  free_cell_found:  'Safe Cell',
  null_expansion:   'Flood Fill',
  two_cell_logic:   '2-Cell Logic',
  complete_mines:   'Count: All Mines',
  complete_safe:    'Count: All Safe',
  game_over:        '💥 Game Over',
  solved:           '🏆 Solved',
};

const DEFAULT_CONFIG: GameConfig = DIFFICULTY_PRESETS.easy;
const DEFAULT_SPEED_MS = 500;

export default function App() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIntervalMs, setPlayIntervalMs] = useState(DEFAULT_SPEED_MS);
  const [showTruth, setShowTruth] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Run solver ────────────────────────────────────────────────────────────

  const runGame = useCallback((cfg: GameConfig) => {
    setIsPlaying(false);
    setIsComputing(true);
    setResult(null);
    setCurrentStep(0);

    // Use setTimeout to let React render the "Computing…" state before blocking
    setTimeout(() => {
      try {
        const r = runSolver(cfg);
        setResult(r);
        setCurrentStep(0);
      } catch (e) {
        console.error('Solver error:', e);
      } finally {
        setIsComputing(false);
      }
    }, 20);
  }, []);

  // Run a game on mount
  useEffect(() => { runGame(DEFAULT_CONFIG); }, [runGame]);

  // ── Auto-play interval ───────────────────────────────────────────────────

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || !result) return;

    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= result.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playIntervalMs);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, playIntervalMs, result]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleNewGame(cfg: GameConfig) {
    setConfig(cfg);
    runGame(cfg);
  }

  function handlePrev() {
    setIsPlaying(false);
    setCurrentStep(s => Math.max(0, s - 1));
  }

  function handleNext() {
    setIsPlaying(false);
    setCurrentStep(s => result ? Math.min(result.steps.length - 1, s + 1) : s);
  }

  function handlePlayPause() {
    if (result && currentStep >= result.steps.length - 1) {
      // At the end — restart from the beginning
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const step: SolverStep | null = result?.steps[currentStep] ?? null;
  const grid = step?.grid ?? null;

  const minesFound = grid ? getGridBombs(grid).length : 0;
  const hiddenCells = grid ? getUnclickedCells(grid).length : 0;
  const revealedCells = grid
    ? grid.length * grid[0].length - hiddenCells - minesFound
    : 0;
  const totalCells = config.width * config.height;

  // Recent steps for the log (last 12, oldest first)
  const logSteps = result
    ? result.steps.slice(Math.max(0, currentStep - 11), currentStep + 1)
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">

      {/* Header */}
      <div className="header">
        <div style={{ textAlign: 'center' }}>
          <h1>💣 Mine-A-Joy-A Solver 💣</h1>
          <p className="subtitle">TypeScript · React · Minesweeper solving algorithm visualiser</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <Controls
          config={config}
          onNewGame={handleNewGame}
          onPrev={handlePrev}
          onNext={handleNext}
          onPlayPause={handlePlayPause}
          onSpeedChange={setPlayIntervalMs}
          onToggleTruth={() => setShowTruth(t => !t)}
          isPlaying={isPlaying}
          playIntervalMs={playIntervalMs}
          showTruth={showTruth}
          hasResult={!!result && !isComputing}
          currentStep={currentStep}
          totalSteps={result?.steps.length ?? 0}
        />
      </div>

      {/* Status bar */}
      <div className="card step-bar">
        {step ? (
          <>
            <span className={`step-badge ${step.type}`}>
              {STEP_TYPE_LABELS[step.type] ?? step.type}
            </span>
            <span className="step-description">{step.description}</span>
          </>
        ) : isComputing ? (
          <span style={{ color: '#ffd700' }}>⏳ Computing solution…</span>
        ) : (
          <span style={{ color: '#7070a0' }}>Press "New Game" to start.</span>
        )}
      </div>

      {/* Stats */}
      <div className="stats">
        <span>Grid: <strong>{config.width}×{config.height}</strong></span>
        <span>Total mines: <strong>{config.nMines}</strong></span>
        <span>Mines flagged: <strong style={{ color: '#f87171' }}>{minesFound}</strong></span>
        <span>Cells revealed: <strong style={{ color: '#4ade80' }}>{revealedCells}</strong></span>
        <span>Hidden: <strong style={{ color: '#fb923c' }}>{hiddenCells}</strong></span>
        <span>Coverage: <strong>{totalCells > 0 ? Math.round((revealedCells + minesFound) / totalCells * 100) : 0}%</strong></span>
        {result && (
          <span>Outcome: <strong style={{ color: result.solved ? '#ffd700' : '#f87171' }}>
            {result.solved ? 'SOLVED' : 'GAME OVER'}
          </strong></span>
        )}
      </div>

      {/* Grid */}
      <div className="grid-area">
        {grid ? (
          <GridView
            grid={showTruth && result?.truthGrid ? result.truthGrid : grid}
            highlightCells={showTruth ? [] : (step?.highlightCells ?? [])}
            showingTruth={false}
          />
        ) : (
          <div style={{ color: '#4a4a7a', fontSize: 18, padding: 40 }}>
            {isComputing ? '⏳ Computing…' : 'No game loaded'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="legend">
        {[
          { color: '#3a3a5c', label: 'Hidden' },
          { color: '#2a2a4a', label: 'Empty (null)' },
          { color: '#1e1e3a', label: 'Number' },
          { color: '#e94560', label: 'Mine' },
          { color: '#ffd700', label: '★ Highlighted (current step)' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <div className="legend-swatch" style={{ background: color, border: label.includes('★') ? '2px solid #ffd700' : '1px solid #4a4a7a' }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Step log */}
      {result && (
        <div className="card" style={{ padding: '8px 14px' }}>
          <div style={{ color: '#7070a0', fontSize: 11, marginBottom: 4 }}>STEP LOG</div>
          <div className="step-log">
            {logSteps.map((s, i) => {
              const idx = Math.max(0, currentStep - (logSteps.length - 1)) + i;
              const isCurrent = idx === currentStep;
              return (
                <div key={idx} className={`step-log-entry ${isCurrent ? 'current' : ''}`}>
                  <span className="log-idx">{idx + 1}</span>
                  <span className={`step-badge ${s.type}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                    {STEP_TYPE_LABELS[s.type] ?? s.type}
                  </span>
                  <span>{s.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
