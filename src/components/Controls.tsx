import { GameConfig, DIFFICULTY_PRESETS } from '../solver/types';

interface ControlsProps {
  config: GameConfig;
  onNewGame: (config: GameConfig) => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onSpeedChange: (ms: number) => void;
  onToggleTruth: () => void;
  isPlaying: boolean;
  playIntervalMs: number;
  showTruth: boolean;
  hasResult: boolean;
  currentStep: number;
  totalSteps: number;
}

const SPEED_OPTIONS = [
  { label: '0.25×', ms: 2000 },
  { label: '0.5×',  ms: 1000 },
  { label: '1×',    ms: 500  },
  { label: '2×',    ms: 250  },
  { label: '4×',    ms: 125  },
  { label: '8×',    ms: 60   },
];

export default function Controls({
  config,
  onNewGame,
  onPrev,
  onNext,
  onPlayPause,
  onSpeedChange,
  onToggleTruth,
  isPlaying,
  playIntervalMs,
  showTruth,
  hasResult,
  currentStep,
  totalSteps,
}: ControlsProps) {

  function handlePreset(key: keyof typeof DIFFICULTY_PRESETS) {
    const { width, height, nMines } = DIFFICULTY_PRESETS[key];
    onNewGame({ width, height, nMines });
  }

  function handleCustom() {
    const w = parseInt(prompt('Width (cols):', String(config.width)) ?? '', 10);
    const h = parseInt(prompt('Height (rows):', String(config.height)) ?? '', 10);
    const m = parseInt(prompt('Mines:', String(config.nMines)) ?? '', 10);
    if (isNaN(w) || isNaN(h) || isNaN(m)) return;
    const maxMines = w * h - 1;
    onNewGame({ width: Math.max(4, w), height: Math.max(4, h), nMines: Math.min(Math.max(1, m), maxMines) });
  }

  const btn: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid #4a4a7a',
    borderRadius: 4,
    background: '#16213e',
    color: '#d0d0ff',
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.1s',
  };

  const btnActive: React.CSSProperties = { ...btn, background: '#2a2a6a', color: '#ffffff' };
  const btnAccent: React.CSSProperties = { ...btn, background: '#0f3460', borderColor: '#6a6aaa', color: '#ffd700' };

  const progress = totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Difficulty presets ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#7070a0', fontSize: 12, marginRight: 2 }}>DIFFICULTY:</span>
        {(Object.entries(DIFFICULTY_PRESETS) as Array<[keyof typeof DIFFICULTY_PRESETS, typeof DIFFICULTY_PRESETS[keyof typeof DIFFICULTY_PRESETS]]>).map(([key, preset]) => (
          <button key={key} style={btn} onClick={() => handlePreset(key)}>
            {preset.label} <span style={{ color: '#7070a0', fontSize: 11 }}>
              {preset.width}×{preset.height}/{preset.nMines}
            </span>
          </button>
        ))}
        <button style={btn} onClick={handleCustom}>Custom…</button>
        <button style={{ ...btnAccent, marginLeft: 8 }} onClick={() => onNewGame(config)}>
          ↺ New Game
        </button>
      </div>

      {/* ── Playback controls ── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btn} onClick={onPrev} disabled={!hasResult || currentStep <= 0}>⏮ Prev</button>

        <button style={isPlaying ? btnActive : btn} onClick={onPlayPause} disabled={!hasResult}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button style={btn} onClick={onNext} disabled={!hasResult || currentStep >= totalSteps - 1}>⏭ Next</button>

        <span style={{ color: '#7070a0', fontSize: 12, marginLeft: 8 }}>SPEED:</span>
        {SPEED_OPTIONS.map(opt => (
          <button
            key={opt.ms}
            style={playIntervalMs === opt.ms ? btnActive : btn}
            onClick={() => onSpeedChange(opt.ms)}
          >
            {opt.label}
          </button>
        ))}

        <button
          style={{ ...btn, marginLeft: 8, color: showTruth ? '#ffd700' : '#d0d0ff' }}
          onClick={onToggleTruth}
        >
          {showTruth ? '🔍 Truth ON' : '🔍 Truth OFF'}
        </button>
      </div>

      {/* ── Progress bar ── */}
      {hasResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#7070a0', fontSize: 12, minWidth: 100 }}>
            Step {currentStep + 1} / {totalSteps}
          </span>
          <div style={{ flex: 1, height: 6, background: '#2a2a4a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#ffd700', transition: 'width 0.1s', borderRadius: 3 }} />
          </div>
        </div>
      )}
    </div>
  );
}
