// app.jsx — Dados v2.0
// Features: hold-to-charge throw, sound, no text select, camera inversion,
// preferences persistence, dice presets, accelerometer physics,
// i18n (ES/EN), Farkle game mode, AI opponent

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── i18n ─────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    appName: 'Dados',
    appSub: 'lanzador de mesa',
    roll: 'Lanzar',
    rolling: '¡Suerte!',
    hold: 'Mantén para cargar',
    rollNotation: 'Tirada',
    result: 'Resultado',
    percentage: 'Porcentaje',
    dice: 'Dados',
    diceColor: 'Color de los dados',
    material: 'Material',
    numberTypo: 'Tipografía de números',
    numberColor: 'Color de los números',
    tableColor: 'Color de la mesa',
    tableSize: 'Tamaño',
    presets: 'Presets de dados',
    addPreset: 'Guardar preset actual',
    presetName: 'Nombre del preset',
    deletePreset: 'Eliminar',
    camera: 'Cámara',
    invertH: 'Invertir horizontal',
    invertV: 'Invertir vertical',
    sensitivity: 'Sensibilidad',
    sound: 'Sonido',
    soundOn: 'Activar sonidos',
    soundVol: 'Volumen',
    language: 'Idioma',
    rules: 'Reglas',
    linkPercentile: 'Emparejar d100+d10 como porcentaje',
    accel: 'Acelerómetro',
    accelBtn: 'Activar movimiento',
    accelActive: '↕ Movimiento activo',
    howToRoll: 'Cómo lanzar',
    helpItems: [
      'Elige dados con + / −. Mezcla cualquier combinación.',
      'Lanza con el botón, la barra espaciadora, o moviendo el teléfono.',
      'Mantén pulsado el botón para cargar más fuerza.',
      'Cámara: arrastra para rotar, rueda o pellizco para zoom, doble clic para reiniciar.',
      'Personaliza colores, materiales y números desde el menú ☰.',
      'Las caras opuestas suman correctamente: d6→7, d8→9, d10→9, d12→13, d20→21.',
      'El d100 es decenas (00–90). Combínalo con d10 para porcentajes.',
    ],
    understood: 'Entendido',
    farkle: 'Farkle',
    farkleVsAI: 'vs IA',
    farkleTwoPlayer: '2 Jugadores',
    farkleBack: '← Volver',
    farkleRoll: 'Lanzar',
    farkleBank: 'Guardar puntos',
    farkleHot: '¡Dados al rojo! Lanza de nuevo.',
    farkleFarkle: '¡FARKLE! Sin puntos.',
    farkleWin: '¡Has ganado!',
    farkleAIWin: '¡La IA gana!',
    farkleP1Win: '¡Jugador 1 gana!',
    farkleP2Win: '¡Jugador 2 gana!',
    farkleScore: 'Puntos',
    farkleRound: 'Turno',
    farkleCurrent: 'En juego',
    farkleTotal: 'Total',
    farkleSelectDice: 'Selecciona dados para guardar',
    farkleYou: 'Tú',
    farkleAI: 'IA',
    farkleP1: 'Jugador 1',
    farkleP2: 'Jugador 2',
    farkleThinking: 'La IA está pensando...',
    farkleNewGame: 'Nueva partida',
    farkleWinScore: 'Puntos para ganar',
    farkleRules: 'Reglas de Farkle',
    farkleRulesText: [
      '1 = 100 puntos | 5 = 50 puntos',
      'Trío de 1s = 1000 puntos',
      'Trío de 2s = 200, 3s = 300... 6s = 600',
      'Cuatro iguales = trío × 2',
      'Cinco iguales = trío × 4',
      'Seis iguales = trío × 8',
      'Escalera (1-2-3-4-5-6) = 1500 puntos',
      'Tres pares = 1500 puntos',
      'Farkle = 0 puntos ese turno',
      'Necesitas 500 pts en un turno para entrar en juego',
      'Meta: 10.000 puntos',
    ],
    matte: 'Mate',
    glossy: 'Brillante',
    metallic: 'Metálico',
    obsidian: 'Obsidiana',
    bone: 'Hueso',
    emerald: 'Esmeralda',
    royal: 'Real',
    crimson: 'Carmesí',
    goldColor: 'Oro',
    amethyst: 'Amatista',
    custom: 'Personalizado',
    forest: 'Bosque',
    ink: 'Tinta',
    wine: 'Vino',
    sand: 'Arena',
    auto: 'Auto',
    ivory: 'Marfil',
    gold: 'Oro',
    crimsonNum: 'Carmesí',
    inkNum: 'Tinta',
    mono: 'Mono',
    serif: 'Serif',
    roman: 'Romano',
    sans: 'Sans',
  },
  en: {
    appName: 'Dice',
    appSub: 'tabletop roller',
    roll: 'Roll',
    rolling: 'Good luck!',
    hold: 'Hold to charge',
    rollNotation: 'Roll',
    result: 'Result',
    percentage: 'Percentage',
    dice: 'Dice',
    diceColor: 'Dice color',
    material: 'Material',
    numberTypo: 'Number font',
    numberColor: 'Number color',
    tableColor: 'Table color',
    tableSize: 'Size',
    presets: 'Dice presets',
    addPreset: 'Save current preset',
    presetName: 'Preset name',
    deletePreset: 'Delete',
    camera: 'Camera',
    invertH: 'Invert horizontal',
    invertV: 'Invert vertical',
    sensitivity: 'Sensitivity',
    sound: 'Sound',
    soundOn: 'Enable sounds',
    soundVol: 'Volume',
    language: 'Language',
    rules: 'Rules',
    linkPercentile: 'Pair d100+d10 as percentile',
    accel: 'Motion control',
    accelBtn: 'Enable motion',
    accelActive: '↕ Motion active',
    howToRoll: 'How to roll',
    helpItems: [
      'Choose dice with + / −. Mix any combination.',
      'Roll with the button, spacebar, or shake your phone.',
      'Hold the button to charge more throwing power.',
      'Camera: drag to rotate, scroll or pinch to zoom, double-click to reset.',
      'Customize colors, materials and numbers from the ☰ menu.',
      'Opposite faces sum correctly: d6→7, d8→9, d10→9, d12→13, d20→21.',
      'The d100 is tens (00–90). Combine with d10 for percentiles.',
    ],
    understood: 'Got it',
    farkle: 'Farkle',
    farkleVsAI: 'vs AI',
    farkleTwoPlayer: '2 Players',
    farkleBack: '← Back',
    farkleRoll: 'Roll',
    farkleBank: 'Bank points',
    farkleHot: 'Hot dice! Roll again.',
    farkleFarkle: 'FARKLE! No points.',
    farkleWin: 'You win!',
    farkleAIWin: 'AI wins!',
    farkleP1Win: 'Player 1 wins!',
    farkleP2Win: 'Player 2 wins!',
    farkleScore: 'Score',
    farkleRound: 'Turn',
    farkleCurrent: 'In play',
    farkleTotal: 'Total',
    farkleSelectDice: 'Select dice to keep',
    farkleYou: 'You',
    farkleAI: 'AI',
    farkleP1: 'Player 1',
    farkleP2: 'Player 2',
    farkleThinking: 'AI is thinking...',
    farkleNewGame: 'New game',
    farkleWinScore: 'Score to win',
    farkleRules: 'Farkle Rules',
    farkleRulesText: [
      '1 = 100 pts | 5 = 50 pts',
      'Three 1s = 1000 pts',
      'Three 2s = 200, 3s = 300... 6s = 600',
      'Four of a kind = three of a kind × 2',
      'Five of a kind = three of a kind × 4',
      'Six of a kind = three of a kind × 8',
      'Straight (1-2-3-4-5-6) = 1500 pts',
      'Three pairs = 1500 pts',
      'Farkle = 0 pts for that turn',
      'Need 500+ pts in one turn to get on the board',
      'Goal: 10,000 points',
    ],
    matte: 'Matte',
    glossy: 'Glossy',
    metallic: 'Metallic',
    obsidian: 'Obsidian',
    bone: 'Bone',
    emerald: 'Emerald',
    royal: 'Royal',
    crimson: 'Crimson',
    goldColor: 'Gold',
    amethyst: 'Amethyst',
    custom: 'Custom',
    forest: 'Forest',
    ink: 'Ink',
    wine: 'Wine',
    sand: 'Sand',
    auto: 'Auto',
    ivory: 'Ivory',
    gold: 'Gold',
    crimsonNum: 'Crimson',
    inkNum: 'Ink',
    mono: 'Mono',
    serif: 'Serif',
    roman: 'Roman',
    sans: 'Sans',
  }
};

function detectLang() {
  const nav = navigator.language || navigator.userLanguage || 'en';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

// ─── Farkle logic ─────────────────────────────────────────────────────────
function calcFarkleScore(dice) {
  // dice: array of values 1-6
  if (!dice || dice.length === 0) return 0;
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);

  // Check special combos first
  const sorted = [...dice].sort((a, b) => a - b);
  const uniq = new Set(dice);

  // Straight 1-6
  if (dice.length === 6 && uniq.size === 6) return 1500;

  // Three pairs
  if (dice.length === 6) {
    const vals = Object.values(counts.slice(1)).filter(v => v > 0);
    if (vals.every(v => v === 2)) return 1500;
  }

  let score = 0;
  // Six of a kind
  for (let v = 1; v <= 6; v++) {
    if (counts[v] >= 6) {
      const base = v === 1 ? 1000 : v * 100;
      score += base * 8;
      counts[v] -= 6;
    }
  }
  // Five of a kind
  for (let v = 1; v <= 6; v++) {
    if (counts[v] >= 5) {
      const base = v === 1 ? 1000 : v * 100;
      score += base * 4;
      counts[v] -= 5;
    }
  }
  // Four of a kind
  for (let v = 1; v <= 6; v++) {
    if (counts[v] >= 4) {
      const base = v === 1 ? 1000 : v * 100;
      score += base * 2;
      counts[v] -= 4;
    }
  }
  // Three of a kind
  for (let v = 1; v <= 6; v++) {
    if (counts[v] >= 3) {
      score += v === 1 ? 1000 : v * 100;
      counts[v] -= 3;
    }
  }
  // Singles
  score += counts[1] * 100;
  score += counts[5] * 50;
  return score;
}

function isFarkle(dice) {
  return calcFarkleScore(dice) === 0;
}

function getBestFarkleKeep(dice) {
  // Returns the best subset of dice to keep
  const n = dice.length;
  let bestScore = 0;
  let bestSubset = [];

  for (let mask = 1; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(dice[i]);
    }
    const s = calcFarkleScore(subset);
    if (s > bestScore) {
      bestScore = s;
      bestSubset = subset;
    }
  }
  return { subset: bestSubset, score: bestScore };
}

function getValidKeepSubsets(dice) {
  // Returns all subsets with score > 0
  const n = dice.length;
  const valid = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset = [];
    const indices = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) { subset.push(dice[i]); indices.push(i); }
    }
    const s = calcFarkleScore(subset);
    if (s > 0) valid.push({ subset, indices, score: s });
  }
  return valid;
}

// AI decision: should we bank or keep rolling?
function aiDecide(currentTurnScore, keptDiceCount, remainingDice, totalScore, TARGET) {
  // Conservative AI:
  // - If score to win, always bank
  // - If remaining dice is 0 (hot dice), always roll
  // - Risk model: probability of farkle on N dice
  const farkleProb = [0, 0.667, 0.444, 0.278, 0.167, 0.093, 0.046];
  const remaining = remainingDice === 0 ? 6 : remainingDice;
  const p = farkleProb[Math.min(remaining, 6)];

  if (totalScore + currentTurnScore >= TARGET) return 'bank';
  if (currentTurnScore === 0) return 'roll'; // forced
  if (remaining <= 2 && currentTurnScore >= 300) return 'bank';
  if (currentTurnScore >= 1200) return 'bank';
  if (p > 0.45 && currentTurnScore >= 500) return 'bank';
  return 'roll';
}

// ─── Dice types ────────────────────────────────────────────────────────────
const DICE_TYPES = [
  { key: 'd4',   sides: 4  },
  { key: 'd6',   sides: 6  },
  { key: 'd8',   sides: 8  },
  { key: 'd10',  sides: 10 },
  { key: 'd12',  sides: 12 },
  { key: 'd20',  sides: 20 },
  { key: 'd100', sides: 10 },
];

const COLOR_OPTIONS = [
  { key: 'obsidian', swatch: '#16161a', accent: '#e8b14a' },
  { key: 'bone',     swatch: '#ece3cf', accent: '#3a2a1c' },
  { key: 'emerald',  swatch: '#0f4435', accent: '#e6d8a5' },
  { key: 'royal',    swatch: '#1a2b5a', accent: '#d9c98a' },
  { key: 'crimson',  swatch: '#5c1216', accent: '#e8d3a4' },
  { key: 'gold',     swatch: '#a9853a', accent: '#1a1208' },
  { key: 'amethyst', swatch: '#3a1f5a', accent: '#e3d3f0' },
];

const MATERIAL_OPTIONS = ['matte', 'glossy', 'metallic'];

const NUMBER_FONTS = [
  { key: 'mono',  family: '"JetBrains Mono","Menlo",monospace', weight: 700 },
  { key: 'serif', family: '"DM Serif Display",Georgia,serif',    weight: 400 },
  { key: 'roman', family: '"Cinzel","Trajan Pro",serif',          weight: 700 },
  { key: 'sans',  family: '"Manrope",system-ui,sans-serif',       weight: 700 },
];

const NUMBER_COLOR_OPTIONS = [
  { key: 'auto',    hex: 'auto'    },
  { key: 'ivory',   hex: '#f0ebde' },
  { key: 'gold',    hex: '#e8b14a' },
  { key: 'crimsonNum', hex: '#e34232' },
  { key: 'inkNum',  hex: '#0e0c08' },
];

const TABLE_OPTIONS = [
  { key: 'forest', color: '#0d1614', accent: '#ffc97a' },
  { key: 'ink',    color: '#0a0d14', accent: '#9bb3e6' },
  { key: 'wine',   color: '#1a0c0e', accent: '#ffb37a' },
  { key: 'sand',   color: '#2a241c', accent: '#ffd9a0' },
];

const THROW_STRENGTH_BASE = 1.15;
const GRAVITY = 40;
const NUMBER_SIZE = 0.5;

// ─── Local storage helpers ────────────────────────────────────────────────
const PREFS_KEY = 'dados_prefs_v2';
const PRESETS_KEY = 'dados_presets_v1';

function loadPrefs() {
  try {
    const s = localStorage.getItem(PREFS_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}
function loadPresets() {
  try {
    const s = localStorage.getItem(PRESETS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}
function savePresets(presets) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

// ─── DieIcon ──────────────────────────────────────────────────────────────
function DieIcon({ type, size = 22, stroke = 'currentColor' }) {
  const s = size, c = s / 2;
  const r = s * 0.38;
  const common = { fill: 'none', stroke, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
  if (type === 'd4') {
    const pts = [[c, c - r],[c + r * 0.866, c + r * 0.5],[c - r * 0.866, c + r * 0.5]];
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={pts.map(p => p.join(',')).join(' ')} {...common} />
      {pts.map((p,i) => <line key={i} x1={p[0]} y1={p[1]} x2={c} y2={c + r * 0.12} {...common} />)}
    </svg>;
  }
  if (type === 'd6') {
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <path d={`M${c-r*.9} ${c-r*.5} L${c} ${c-r} L${c+r*.9} ${c-r*.5} L${c+r*.9} ${c+r*.5} L${c} ${c+r} L${c-r*.9} ${c+r*.5} Z`} {...common} />
      <line x1={c} y1={c-r} x2={c} y2={c+r} {...common} />
      <line x1={c-r*.9} y1={c-r*.5} x2={c} y2={c} {...common} />
      <line x1={c+r*.9} y1={c-r*.5} x2={c} y2={c} {...common} />
      <line x1={c-r*.9} y1={c+r*.5} x2={c} y2={c} {...common} />
      <line x1={c+r*.9} y1={c+r*.5} x2={c} y2={c} {...common} />
    </svg>;
  }
  if (type === 'd8') {
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={`${c},${c-r} ${c+r*.9},${c} ${c},${c+r} ${c-r*.9},${c}`} {...common} />
      <line x1={c} y1={c-r} x2={c} y2={c+r} {...common} />
      <line x1={c-r*.9} y1={c} x2={c+r*.9} y2={c} {...common} />
    </svg>;
  }
  if (type === 'd10' || type === 'd100') {
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={`${c},${c-r} ${c+r*.85},${c-r*.1} ${c+r*.55},${c+r*.55} ${c-r*.55},${c+r*.55} ${c-r*.85},${c-r*.1}`} {...common} />
      <line x1={c} y1={c-r} x2={c} y2={c+r*.55} {...common} />
      <line x1={c+r*.85} y1={c-r*.1} x2={c-r*.55} y2={c+r*.55} {...common} />
      <line x1={c-r*.85} y1={c-r*.1} x2={c+r*.55} y2={c+r*.55} {...common} />
    </svg>;
  }
  if (type === 'd12') {
    const pts = Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*(Math.PI*2/5);return [c+r*Math.cos(a),c+r*Math.sin(a)];});
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={pts.map(p=>p.join(',')).join(' ')} {...common} />
      {pts.map((p,i)=><line key={i} x1={p[0]} y1={p[1]} x2={c} y2={c} {...common} />)}
    </svg>;
  }
  const pts = Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*(Math.PI*2/6);return [c+r*Math.cos(a),c+r*Math.sin(a)];});
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
    <polygon points={pts.map(p=>p.join(',')).join(' ')} {...common} />
    <polygon points={`${pts[0][0]},${pts[0][1]} ${pts[2][0]},${pts[2][1]} ${pts[4][0]},${pts[4][1]}`} {...common} />
    <polygon points={`${pts[1][0]},${pts[1][1]} ${pts[3][0]},${pts[3][1]} ${pts[5][0]},${pts[5][1]}`} {...common} />
  </svg>;
}

function notation(set) {
  const parts = DICE_TYPES.filter(t => set[t.key] > 0).map(t => `${set[t.key]}${t.key}`);
  return parts.join(' + ') || '—';
}

// ─── Hold-to-charge button ────────────────────────────────────────────────
function ChargeButton({ onRoll, disabled, rolling, t }) {
  const [charge, setCharge] = useState(0); // 0..1
  const [pressed, setPressed] = useState(false);
  const intervalRef = useRef(null);
  const chargeRef = useRef(0);

  const startCharge = useCallback((e) => {
    if (disabled || rolling) return;
    e.preventDefault();
    setPressed(true);
    chargeRef.current = 0;
    setCharge(0);
    intervalRef.current = setInterval(() => {
      chargeRef.current = Math.min(1, chargeRef.current + 0.025);
      setCharge(chargeRef.current);
    }, 30);
  }, [disabled, rolling]);

  const releaseCharge = useCallback((e) => {
    if (!pressed) return;
    e.preventDefault();
    clearInterval(intervalRef.current);
    setPressed(false);
    const c = chargeRef.current;
    setCharge(0);
    chargeRef.current = 0;
    if (!disabled && !rolling) {
      const strength = THROW_STRENGTH_BASE * (0.6 + c * 0.8);
      onRoll(strength);
    }
  }, [pressed, disabled, rolling, onRoll]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - charge);

  return (
    <button
      className={`roll-btn ${rolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''} ${pressed ? 'charging' : ''}`}
      onMouseDown={startCharge}
      onMouseUp={releaseCharge}
      onMouseLeave={releaseCharge}
      onTouchStart={startCharge}
      onTouchEnd={releaseCharge}
      disabled={disabled && !rolling}
    >
      {charge > 0.02 && (
        <svg className="charge-ring" width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(232,177,74,0.2)" strokeWidth="3"/>
          <circle
            cx="27" cy="27" r="22" fill="none"
            stroke="var(--accent)" strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 27 27)"
            style={{transition: 'stroke-dashoffset 0.03s linear'}}
          />
        </svg>
      )}
      <span className="roll-label">
        {rolling ? t.rolling : pressed && charge > 0.1 ? '⚡' : t.roll}
      </span>
      {!rolling && !pressed && <span className="roll-hint"></span>}
    </button>
  );
}

// ─── Farkle Game Component ────────────────────────────────────────────────
function FarkleGame({ t, onBack }) {
  const [mode, setMode] = useState(null); // null | 'ai' | '2p'
  const [gameState, setGameState] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(false);
  const TARGET = 10000;

  function initGame(m) {
    setMode(m);
    setGameState({
      scores: [0, 0],
      turnScore: 0,
      dice: [],
      kept: [],
      currentPlayer: 0,
      phase: 'roll', // 'roll' | 'select' | 'end'
      winner: null,
      onBoard: [false, false], // need 500 to get on board
      rolling: false,
    });
    setMessage('');
    setSelectedIndices([]);
  }

  function rollDice(count) {
    const dice = [];
    for (let i = 0; i < count; i++) dice.push(Math.floor(Math.random() * 6) + 1);
    return dice;
  }

  function handleRoll(gs) {
    const diceCount = gs.kept.length === gs.dice.length || gs.dice.length === 0
      ? 6  // hot dice or start
      : 6 - gs.kept.length;
    const newDice = rollDice(diceCount);

    if (isFarkle(newDice)) {
      setMessage(t.farkleFarkle);
      setGameState(prev => ({
        ...prev,
        dice: newDice,
        kept: [],
        turnScore: 0,
        phase: 'roll',
        rolling: false,
      }));
      // End turn after short delay
      setTimeout(() => {
        setGameState(prev => {
          const nextPlayer = (prev.currentPlayer + 1) % 2;
          return {
            ...prev,
            currentPlayer: nextPlayer,
            dice: [],
            kept: [],
            turnScore: 0,
            phase: 'roll',
          };
        });
        setMessage('');
        setSelectedIndices([]);
      }, 1800);
    } else {
      setGameState(prev => ({ ...prev, dice: newDice, kept: [], phase: 'select', rolling: false }));
      setSelectedIndices([]);
      setMessage('');
    }
  }

  function handlePlayerRoll() {
    if (!gameState || gameState.phase !== 'roll' || aiThinking) return;
    setGameState(prev => ({ ...prev, rolling: true }));
    setTimeout(() => handleRoll(gameState), 600);
  }

  function toggleDie(idx) {
    if (gameState.phase !== 'select') return;
    setSelectedIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      // Check if adding this die makes a valid combo
      const newSel = [...prev, idx];
      const selVals = newSel.map(i => gameState.dice[i]);
      if (calcFarkleScore(selVals) > 0) return newSel;
      return prev; // reject
    });
  }

  function handleKeepAndRoll() {
    if (selectedIndices.length === 0) return;
    const selVals = selectedIndices.map(i => gameState.dice[i]);
    const pts = calcFarkleScore(selVals);
    if (pts === 0) return;
    const newTurnScore = gameState.turnScore + pts;
    const newKept = [...gameState.kept, ...selVals];
    const hotDice = newKept.length === 6;
    if (hotDice) setMessage(t.farkleHot);

    setGameState(prev => ({
      ...prev,
      turnScore: newTurnScore,
      kept: hotDice ? [] : newKept,
      dice: hotDice ? [] : prev.dice,
      phase: 'roll',
    }));
    setSelectedIndices([]);
  }

  function handleBank() {
    if (selectedIndices.length > 0) {
      const selVals = selectedIndices.map(i => gameState.dice[i]);
      const pts = calcFarkleScore(selVals);
      if (pts > 0) {
        const newTurnScore = gameState.turnScore + pts;
        finishTurn(newTurnScore);
        return;
      }
    }
    finishTurn(gameState.turnScore);
  }

  function finishTurn(finalTurnScore) {
    const cp = gameState.currentPlayer;
    const onBoard = [...gameState.onBoard];
    let newScores = [...gameState.scores];

    // Must get 500 to get on board
    if (!onBoard[cp] && finalTurnScore >= 500) {
      onBoard[cp] = true;
    }
    if (onBoard[cp]) {
      newScores[cp] += finalTurnScore;
    }

    const winner = newScores[cp] >= TARGET ? cp : null;
    const nextPlayer = winner !== null ? cp : (cp + 1) % 2;

    setGameState(prev => ({
      ...prev,
      scores: newScores,
      onBoard,
      currentPlayer: nextPlayer,
      turnScore: 0,
      dice: [],
      kept: [],
      phase: winner !== null ? 'end' : 'roll',
      winner,
    }));
    setSelectedIndices([]);
    setMessage('');

    if (winner !== null) {
      if (mode === 'ai') {
        setMessage(winner === 0 ? t.farkleWin : t.farkleAIWin);
      } else {
        setMessage(winner === 0 ? t.farkleP1Win : t.farkleP2Win);
      }
    }
  }

  // AI turn
  useEffect(() => {
    if (!gameState || gameState.phase === 'end') return;
    if (mode === 'ai' && gameState.currentPlayer === 1 && !aiThinking) {
      setAiThinking(true);
      setTimeout(() => aiTurn(gameState), 900);
    }
  }, [gameState?.currentPlayer, gameState?.phase]);

  function aiTurn(gs) {
    const diceCount = gs.kept.length === gs.dice.length || gs.dice.length === 0 ? 6 : 6 - gs.kept.length;
    const newDice = rollDice(diceCount);

    if (isFarkle(newDice)) {
      setMessage(t.farkleFarkle);
      setAiThinking(false);
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          dice: newDice, kept: [], turnScore: 0, phase: 'roll',
          currentPlayer: 0, rolling: false,
        }));
        setMessage('');
      }, 1800);
      return;
    }

    // AI picks best subset
    const { subset, score } = getBestFarkleKeep(newDice);
    const newTurnScore = gs.turnScore + score;
    const newKept = [...gs.kept, ...subset];
    const hotDice = newKept.length === 6;

    const remainingDice = hotDice ? 6 : diceCount - subset.length;
    const decision = aiDecide(newTurnScore, newKept.length, remainingDice, gs.scores[1], TARGET);

    setTimeout(() => {
      if (decision === 'bank') {
        // Bank
        const onBoard = [...gs.onBoard];
        let newScores = [...gs.scores];
        if (!onBoard[1] && newTurnScore >= 500) onBoard[1] = true;
        if (onBoard[1]) newScores[1] += newTurnScore;
        const winner = newScores[1] >= TARGET ? 1 : null;
        setAiThinking(false);
        setGameState(prev => ({
          ...prev,
          scores: newScores, onBoard,
          currentPlayer: winner ? 1 : 0,
          turnScore: 0, dice: [], kept: [],
          phase: winner ? 'end' : 'roll',
          winner, rolling: false,
        }));
        if (winner) setMessage(t.farkleAIWin);
      } else {
        // Keep rolling
        const nextGs = {
          ...gs,
          dice: newDice,
          kept: hotDice ? [] : newKept,
          turnScore: newTurnScore,
          phase: 'roll',
          rolling: false,
        };
        setGameState(nextGs);
        setAiThinking(false);
        setTimeout(() => {
          setAiThinking(true);
          setTimeout(() => aiTurn(nextGs), 800);
        }, 400);
      }
    }, 700);
  }

  // ─ UI ─
  if (!mode) {
    return (
      <div className="farkle-overlay">
        <div className="farkle-card">
          <div className="farkle-title">{t.farkle}</div>
          <div className="farkle-subtitle" style={{color:'var(--ink-dim)',marginBottom:20,fontSize:13}}>Kingdom Come Deliverance rules</div>
          <button className="farkle-btn-main" onClick={() => initGame('ai')}>{t.farkleVsAI}</button>
          <button className="farkle-btn-main" style={{marginTop:8}} onClick={() => initGame('2p')}>{t.farkleTwoPlayer}</button>
          <button className="farkle-btn-sec" onClick={() => setShowRules(s => !s)}>{t.farkleRules}</button>
          {showRules && (
            <div className="farkle-rules">
              {t.farkleRulesText.map((r,i) => <div key={i} className="farkle-rule-item">{r}</div>)}
            </div>
          )}
          <button className="farkle-btn-back" onClick={onBack}>{t.farkleBack}</button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;
  const { scores, turnScore, dice, kept, currentPlayer, phase, winner } = gameState;
  const p0Name = mode === 'ai' ? t.farkleYou : t.farkleP1;
  const p1Name = mode === 'ai' ? t.farkleAI : t.farkleP2;

  const canRoll = phase === 'roll' && !winner && !(mode === 'ai' && currentPlayer === 1);
  const canSelect = phase === 'select' && !winner && !(mode === 'ai' && currentPlayer === 1);
  const validSubsets = canSelect ? getValidKeepSubsets(dice) : [];
  const validIndices = new Set(validSubsets.flatMap(s => s.indices));

  const selectedVals = selectedIndices.map(i => dice[i]);
  const selectedPts = calcFarkleScore(selectedVals);
  const canBank = turnScore > 0 || selectedPts > 0;

  return (
    <div className="farkle-overlay">
      <div className="farkle-card farkle-card-game">
        {/* Scores */}
        <div className="farkle-scores">
          <div className={`farkle-player-score ${currentPlayer === 0 ? 'active' : ''}`}>
            <div className="farkle-player-name">{p0Name}</div>
            <div className="farkle-score-val">{scores[0]}</div>
          </div>
          <div className="farkle-vs">vs</div>
          <div className={`farkle-player-score ${currentPlayer === 1 ? 'active' : ''}`}>
            <div className="farkle-player-name">{p1Name}</div>
            <div className="farkle-score-val">{scores[1]}</div>
          </div>
        </div>

        {/* Turn score */}
        <div className="farkle-turn-score">
          <span style={{color:'var(--ink-faint)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase'}}>{t.farkleCurrent}</span>
          <span style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--accent)'}}>{turnScore + selectedPts}</span>
        </div>

        {/* Dice */}
        <div className="farkle-dice-area">
          {dice.map((val, i) => {
            const isKept = phase === 'select' && !validIndices.has(i);
            const isSel = selectedIndices.includes(i);
            return (
              <button
                key={i}
                className={`farkle-die ${isSel ? 'selected' : ''} ${isKept && !isSel ? 'locked' : ''}`}
                onClick={() => canSelect && !isKept ? toggleDie(i) : null}
                disabled={isKept || !canSelect}
              >
                {val}
              </button>
            );
          })}
          {gameState.rolling && <div className="farkle-rolling-indicator">…</div>}
        </div>

        {/* Message */}
        {message && <div className="farkle-message">{message}</div>}
        {aiThinking && !message && <div className="farkle-message">{t.farkleThinking}</div>}

        {/* Instructions */}
        {canSelect && !aiThinking && (
          <div style={{fontSize:11,color:'var(--ink-faint)',textAlign:'center',marginBottom:6}}>{t.farkleSelectDice}</div>
        )}

        {/* Actions */}
        <div className="farkle-actions">
          {canRoll && phase === 'roll' && (
            <button className="farkle-btn-main" onClick={handlePlayerRoll}>{t.farkleRoll}</button>
          )}
          {canSelect && selectedIndices.length > 0 && (
            <>
              <button className="farkle-btn-main" onClick={handleKeepAndRoll}>{t.farkleRoll} (+{selectedPts})</button>
              <button className="farkle-btn-sec" onClick={handleBank}>{t.farkleBank}</button>
            </>
          )}
          {canSelect && selectedIndices.length === 0 && canBank && (
            <button className="farkle-btn-sec" onClick={handleBank}>{t.farkleBank} ({turnScore})</button>
          )}
          {winner !== null && (
            <button className="farkle-btn-main" onClick={() => initGame(mode)}>{t.farkleNewGame}</button>
          )}
        </div>

        <button className="farkle-btn-back" onClick={onBack}>{t.farkleBack}</button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
function App() {
  const engineRef = useRef(null);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  // i18n
  const [lang, setLang] = useState(() => {
    const saved = loadPrefs();
    return saved?.lang || detectLang();
  });
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Load saved preferences
  const savedPrefs = loadPrefs() || {};

  const [color, setColor] = useState(savedPrefs.color || 'obsidian');
  const [customColor, setCustomColor] = useState(savedPrefs.customColor || '#5a87c2');
  const [material, setMaterial] = useState(savedPrefs.material || 'glossy');
  const [numFont, setNumFont] = useState(savedPrefs.numFont || 'mono');
  const [numColor, setNumColor] = useState(savedPrefs.numColor || 'auto');
  const [tableKey, setTableKey] = useState(savedPrefs.tableKey || 'forest');
  const [tableSize, setTableSize] = useState(savedPrefs.tableSize || 8.5);
  const [soundEnabled, setSoundEnabled] = useState(savedPrefs.soundEnabled !== false);
  const [soundVol, setSoundVol] = useState(savedPrefs.soundVol ?? 0.7);
  const [invertCamX, setInvertCamX] = useState(savedPrefs.invertCamX || false);
  const [invertCamY, setInvertCamY] = useState(savedPrefs.invertCamY !== false); // default true
  const [camSens, setCamSens] = useState(savedPrefs.camSens ?? 0.7);
  const [linkPercentile, setLinkPercentile] = useState(savedPrefs.linkPercentile !== false);
  const [shakeToRoll, setShakeToRoll] = useState(savedPrefs.shakeToRoll !== false);

  const [diceSet, setDiceSet] = useState({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 1, d100: 0 });
  const [results, setResults] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shakeArmed, setShakeArmed] = useState(false);
  const [showFarkle, setShowFarkle] = useState(false);
  const [dicePresets, setDicePresets] = useState(() => loadPresets());
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  const isTouch = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);

  // Persist preferences whenever they change
  useEffect(() => {
    savePrefs({ color, customColor, material, numFont, numColor, tableKey, tableSize,
      soundEnabled, soundVol, invertCamX, invertCamY, camSens, linkPercentile, shakeToRoll, lang });
  }, [color, customColor, material, numFont, numColor, tableKey, tableSize,
      soundEnabled, soundVol, invertCamX, invertCamY, camSens, linkPercentile, shakeToRoll, lang]);

  // Init engine
  useEffect(() => {
    const tab = TABLE_OPTIONS.find(t => t.key === tableKey) || TABLE_OPTIONS[0];
    const canvas = document.getElementById('scene-canvas');
    const eng = new window.DiceEngine(canvas, {
      tableColor: tab.color,
      accentLight: tab.accent,
      colorPreset: color,
      materialKind: material,
      gravity: GRAVITY,
      numberSize: NUMBER_SIZE,
      soundEnabled,
      soundVolume: soundVol,
      invertCameraX: invertCamX,
      invertCameraY: invertCamY,
      cameraSensitivity: camSens,
    });
    eng.onSettled = (res) => {
      setRolling(false);
      setResults(res);
    };
    engineRef.current = eng;
  }, []);

  // Build dice
  useEffect(() => {
    if (!engineRef.current) return;
    const list = DICE_TYPES.filter(t => diceSet[t.key] > 0).map(t => ({ type: t.key, count: diceSet[t.key] }));
    engineRef.current.setDiceSet(list);
    setResults(null);
  }, [diceSet]);

  // Push appearance options
  useEffect(() => {
    if (!engineRef.current) return;
    const font = NUMBER_FONTS.find(f => f.key === numFont) || NUMBER_FONTS[0];
    const c = NUMBER_COLOR_OPTIONS.find(x => x.key === numColor) || NUMBER_COLOR_OPTIONS[0];
    engineRef.current.setOptions({
      colorPreset: color, customColor, materialKind: material,
      numberFont: font.family, numberWeight: font.weight,
      numberColor: c.hex, numberSize: NUMBER_SIZE,
    });
  }, [color, customColor, material, numFont, numColor]);

  // Table
  useEffect(() => {
    if (!engineRef.current) return;
    const tab = TABLE_OPTIONS.find(t => t.key === tableKey) || TABLE_OPTIONS[0];
    engineRef.current.setOptions({ tableColor: tab.color, accentLight: tab.accent });
  }, [tableKey]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setTableSize(tableSize);
  }, [tableSize]);

  // Sound options
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setOptions({ soundEnabled, soundVolume: soundVol });
  }, [soundEnabled, soundVol]);

  // Camera options
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setOptions({ invertCameraX: invertCamX, invertCameraY: invertCamY, cameraSensitivity: camSens });
  }, [invertCamX, invertCamY, camSens]);

  const roll = useCallback((strength = THROW_STRENGTH_BASE) => {
    if (!engineRef.current) return;
    const total = Object.values(diceSet).reduce((s, n) => s + n, 0);
    if (total === 0) return;
    setRolling(true);
    setResults(null);
    engineRef.current.roll(strength);
  }, [diceSet]);

  // Accelerometer — improved physics
  const accelRef = useRef({ ax: 0, ay: 0, az: 0, prevTotal: 9.81, wasFlat: true });
  useEffect(() => {
    if (!shakeArmed) return;
    let settleTimeout = null;
    let throwCooldown = false;

    function onMotion(e) {
      const a = e.accelerationIncludingGravity;
      if (!a || !engineRef.current) return;
      const ax = a.x || 0;
      const ay = a.y || 0;
      const az = a.z || 0;
      const total = Math.hypot(ax, ay, az);

      // Detect shake (large acceleration burst) → throw dice
      const prevTotal = accelRef.current.prevTotal;
      const delta = Math.abs(total - prevTotal);
      accelRef.current.prevTotal = total;

      if (delta > 8 && !throwCooldown && !rolling) {
        throwCooldown = true;
        const strength = Math.min(2.5, THROW_STRENGTH_BASE + delta / 8);
        roll(strength);
        setTimeout(() => { throwCooldown = false; }, 1500);
        return;
      }

      // Tilt: apply as gravity tilt for gentle motion
      engineRef.current.setGravityTilt(ax, ay, az, total);

      if (settleTimeout) clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        if (engineRef.current) engineRef.current.resetGravity();
      }, 800);
    }

    window.addEventListener('devicemotion', onMotion);
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      if (settleTimeout) clearTimeout(settleTimeout);
      if (engineRef.current) engineRef.current.resetGravity();
    };
  }, [shakeArmed, roll, rolling]);

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && !e.target.closest('input, textarea, select, button')) {
        e.preventDefault();
        if (!rolling) roll();
      } else if (e.code === 'Escape') {
        setMenuOpen(false); setShowHelp(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roll, rolling]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (menuRef.current?.contains(e.target)) return;
      if (hamburgerRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); };
  }, [menuOpen]);

  const enableShake = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const p = await DeviceMotionEvent.requestPermission();
        if (p === 'granted') setShakeArmed(true);
      } catch {}
    } else {
      setShakeArmed(true);
    }
  };

  function adjust(type, delta) {
    setDiceSet(prev => {
      const cur = prev[type] || 0;
      const next = Math.max(0, Math.min(20, cur + delta));
      return { ...prev, [type]: next };
    });
  }

  function savePreset() {
    if (!presetNameInput.trim()) return;
    const preset = { name: presetNameInput.trim(), set: { ...diceSet }, id: Date.now() };
    const updated = [...dicePresets, preset];
    setDicePresets(updated);
    savePresets(updated);
    setPresetNameInput('');
    setShowPresetInput(false);
  }

  function deletePreset(id) {
    const updated = dicePresets.filter(p => p.id !== id);
    setDicePresets(updated);
    savePresets(updated);
  }

  function loadPreset(preset) {
    setDiceSet({ ...preset.set });
  }

  // Results grouping
  function buildResultGroups(res) {
    if (!res) return null;
    const out = { pairs: [], dice: [] };
    if (!linkPercentile) { out.dice = res.slice(); return out; }
    const d100s = res.filter(r => r.type === 'd100');
    const d10s  = res.filter(r => r.type === 'd10');
    const others = res.filter(r => r.type !== 'd100' && r.type !== 'd10');
    const pairN = Math.min(d100s.length, d10s.length);
    for (let i = 0; i < pairN; i++) {
      const tens = d100s[i].value, units = d10s[i].value;
      const pct = (tens === 0 && units === 0) ? 100 : (tens + units);
      out.pairs.push({ tens, units, value: pct });
    }
    out.dice = others.concat(d100s.slice(pairN)).concat(d10s.slice(pairN));
    return out;
  }

  const grouped = buildResultGroups(results);
  const totalFromGroups = grouped
    ? grouped.pairs.reduce((s, p) => s + p.value, 0) + grouped.dice.reduce((s, d) => s + (d.value ?? 0), 0)
    : null;

  const totalDice = Object.values(diceSet).reduce((s, n) => s + n, 0);
  const rollNotation = notation(diceSet);

  if (showFarkle) {
    return <FarkleGame t={t} onBack={() => setShowFarkle(false)} />;
  }

  return (
    <React.Fragment>
      {/* Top bar */}
      <div className="top-bar">
        <button ref={hamburgerRef} className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span/><span/><span/>
        </button>
        <div className="brand">
          <div className="brand-mark"><DieIcon type="d20" size={28} stroke="#e8b14a" /></div>
          <div className="brand-text">
            <div className="brand-title">{t.appName}</div>
            <div className="brand-sub">{t.appSub}</div>
          </div>
        </div>
        <button className="preset-pill" onClick={() => setShowFarkle(true)} title="Farkle">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="5" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="11" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="5" cy="11" r="1.2" fill="currentColor"/>
          </svg>
          {t.farkle}
        </button>
        <button className="icon-btn" aria-label="Help" onClick={() => setShowHelp(s => !s)}>?</button>
      </div>

      {/* Menu */}
      {menuOpen && (
        <div className="menu-dropdown entering" ref={menuRef}>
          {/* Dice selector */}
          <div className="menu-section">
            <div className="menu-title">{t.dice}</div>
            <div className="dice-grid-menu">
              {DICE_TYPES.map(dt => {
                const count = diceSet[dt.key];
                return (
                  <div key={dt.key} className={`die-row-menu ${count > 0 ? 'active' : ''}`}>
                    <div className="die-info-menu">
                      <DieIcon type={dt.key} size={20} stroke={count > 0 ? '#e8b14a' : '#7e7669'} />
                      <span className="die-label-menu">{dt.key}</span>
                    </div>
                    <div className="die-counter">
                      <button className="cbtn" onClick={() => adjust(dt.key, -1)} disabled={count === 0}>−</button>
                      <div className="count">{count}</div>
                      <button className="cbtn" onClick={() => adjust(dt.key, +1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="menu-divider" />

          {/* Presets */}
          <div className="menu-section">
            <div className="menu-title">{t.presets}</div>
            <div className="presets-list">
              {dicePresets.map(p => (
                <div key={p.id} className="preset-row">
                  <button className="preset-load-btn" onClick={() => { loadPreset(p); setMenuOpen(false); }}>
                    {p.name}
                  </button>
                  <button className="preset-del-btn" onClick={() => deletePreset(p.id)} title={t.deletePreset}>×</button>
                </div>
              ))}
            </div>
            {showPresetInput ? (
              <div className="preset-input-row">
                <input
                  className="preset-input"
                  value={presetNameInput}
                  onChange={e => setPresetNameInput(e.target.value)}
                  placeholder={t.presetName}
                  onKeyDown={e => { if (e.key === 'Enter') savePreset(); if (e.key === 'Escape') setShowPresetInput(false); }}
                  autoFocus
                />
                <button className="cbtn" onClick={savePreset} disabled={!presetNameInput.trim()}>✓</button>
                <button className="cbtn" onClick={() => setShowPresetInput(false)}>×</button>
              </div>
            ) : (
              <button className="preset-add-btn" onClick={() => setShowPresetInput(true)}>+ {t.addPreset}</button>
            )}
          </div>

          <div className="menu-divider" />

          {/* Color */}
          <div className="menu-section">
            <div className="menu-title">{t.diceColor}</div>
            <div className="swatch-grid">
              {COLOR_OPTIONS.map(c => (
                <button key={c.key} className={`swatch ${color === c.key ? 'sel' : ''}`} onClick={() => setColor(c.key)} title={t[c.key] || c.key}>
                  <span className="swatch-disc" style={{ background: c.swatch, borderColor: c.accent }}>
                    <span className="swatch-dot" style={{ background: c.accent }} />
                  </span>
                  <span className="swatch-label">{t[c.key] || c.key}</span>
                </button>
              ))}
              <label className={`swatch custom ${color === 'custom' ? 'sel' : ''}`}>
                <span className="swatch-disc rainbow"
                  style={color === 'custom' ? { background: customColor, borderColor: customColor } : undefined}>
                  {color !== 'custom' && <span className="swatch-plus">+</span>}
                  {color === 'custom' && <span className="swatch-dot" style={{ background: '#ffffff', mixBlendMode: 'difference' }} />}
                </span>
                <span className="swatch-label">{t.custom}</span>
                <input type="color" className="color-input" value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setColor('custom'); }}
                  onClick={() => setColor('custom')} />
              </label>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">{t.material}</div>
            <div className="mat-row">
              {MATERIAL_OPTIONS.map(m => (
                <button key={m} className={`mat-pill ${material === m ? 'sel' : ''}`} onClick={() => setMaterial(m)}>
                  {t[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">{t.numberTypo}</div>
            <div className="num-row-grid">
              {NUMBER_FONTS.map(f => (
                <button key={f.key} className={`num-font ${numFont === f.key ? 'sel' : ''}`}
                  onClick={() => setNumFont(f.key)} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                  20
                </button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">{t.numberColor}</div>
            <div className="num-row swatches">
              {NUMBER_COLOR_OPTIONS.map(c => (
                <button key={c.key} className={`num-swatch ${numColor === c.key ? 'sel' : ''}`}
                  onClick={() => setNumColor(c.key)}>
                  {c.hex === 'auto'
                    ? <span className="auto-disc">A</span>
                    : <span className="solid-disc" style={{ background: c.hex }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">{t.tableColor}</div>
            <div className="table-row">
              {TABLE_OPTIONS.map(tb => (
                <button key={tb.key} className={`table-pill ${tableKey === tb.key ? 'sel' : ''}`}
                  onClick={() => setTableKey(tb.key)}>
                  <span className="table-disc" style={{ background: tb.color, boxShadow: `inset 0 0 14px ${tb.accent}66` }} />
                  <span>{t[tb.key]}</span>
                </button>
              ))}
            </div>
            <div className="num-row size" style={{ marginTop: 12 }}>
              <span className="num-label">{t.tableSize}</span>
              <input type="range" min="5" max="14" step="0.5" value={tableSize}
                onChange={e => setTableSize(Number(e.target.value))} style={{ flex: 1 }} />
              <span className="num-value">{tableSize.toFixed(1)}</span>
            </div>
          </div>

          <div className="menu-divider" />

          {/* Sound */}
          <div className="menu-section">
            <div className="menu-title">{t.sound}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.soundOn}</span>
              <button className={`toggle-btn ${soundEnabled ? 'on' : ''}`}
                onClick={() => setSoundEnabled(v => !v)}>
                <span className="toggle-knob" />
              </button>
            </div>
            {soundEnabled && (
              <div className="num-row size" style={{ marginTop: 6 }}>
                <span className="num-label">{t.soundVol}</span>
                <input type="range" min="0" max="1" step="0.05" value={soundVol}
                  onChange={e => setSoundVol(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="num-value">{Math.round(soundVol * 100)}%</span>
              </div>
            )}
          </div>

          {/* Camera */}
          <div className="menu-section">
            <div className="menu-title">{t.camera}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.invertH}</span>
              <button className={`toggle-btn ${invertCamX ? 'on' : ''}`} onClick={() => setInvertCamX(v => !v)}>
                <span className="toggle-knob" />
              </button>
            </div>
            <div className="tweak-toggle-row" style={{ marginTop: 6 }}>
              <span className="tweak-label">{t.invertV}</span>
              <button className={`toggle-btn ${invertCamY ? 'on' : ''}`} onClick={() => setInvertCamY(v => !v)}>
                <span className="toggle-knob" />
              </button>
            </div>
            <div className="num-row size" style={{ marginTop: 8 }}>
              <span className="num-label">{t.sensitivity}</span>
              <input type="range" min="0.2" max="2" step="0.1" value={camSens}
                onChange={e => setCamSens(Number(e.target.value))} style={{ flex: 1 }} />
              <span className="num-value">{camSens.toFixed(1)}×</span>
            </div>
          </div>

          {/* Rules */}
          <div className="menu-section">
            <div className="menu-title">{t.rules}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.linkPercentile}</span>
              <button className={`toggle-btn ${linkPercentile ? 'on' : ''}`} onClick={() => setLinkPercentile(v => !v)}>
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="menu-section">
            <div className="menu-title">{t.language}</div>
            <div className="mat-row">
              {['es', 'en'].map(l => (
                <button key={l} className={`mat-pill ${lang === l ? 'sel' : ''}`} onClick={() => setLang(l)}>
                  {l === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bottom-bar">
        <div className="notation-bubble">
          <span className="notation-label">{t.rollNotation}</span>
          <span className="notation">{rollNotation}</span>
        </div>
        <ChargeButton onRoll={roll} disabled={totalDice === 0} rolling={rolling} t={t} />
        {shakeToRoll && isTouch && !shakeArmed && (
          <button className="shake-arm" onClick={enableShake}>{t.accelBtn}</button>
        )}
        {shakeToRoll && isTouch && shakeArmed && (
          <div className="shake-active">{t.accelActive}</div>
        )}
      </div>

      {/* Results panel */}
      {results && grouped && (
        <div className="results-panel">
          <div className="results-head">
            <span className="results-label">{grouped.pairs.length > 0 && grouped.dice.length === 0 ? t.percentage : t.result}</span>
            <span className="results-total">{totalFromGroups}</span>
          </div>
          {grouped.pairs.length > 0 && (
            <div className="results-list">
              {grouped.pairs.map((p, i) => (
                <div key={'p'+i} className="result-chip pair">
                  <span className="pair-badge">%</span>
                  <span className="result-type">d100+d10</span>
                  <span className="pair-detail">{String(p.tens).padStart(2,'0')}+{p.units}</span>
                  <span className="result-value">{p.value}</span>
                </div>
              ))}
            </div>
          )}
          {grouped.dice.length > 0 && (
            <div className="results-list">
              {grouped.dice.map((r, i) => (
                <div key={'d'+i} className="result-chip">
                  <DieIcon type={r.type} size={18} stroke="#e8b14a" />
                  <span className="result-type">{r.type}</span>
                  <span className="result-value">{r.value}</span>
                </div>
              ))}
            </div>
          )}
          {(grouped.pairs.length + grouped.dice.length) > 1 && (
            <div className="results-breakdown">
              {[...grouped.pairs.map(p=>p.value),...grouped.dice.map(d=>d.value)].join(' + ')} = <span>{totalFromGroups}</span>
            </div>
          )}
        </div>
      )}

      {/* Help overlay */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-card" onClick={e => e.stopPropagation()}>
            <div className="help-title">{t.howToRoll}</div>
            <ul>{t.helpItems.map((item, i) => <li key={i} dangerouslySetInnerHTML={{__html: item}} />)}</ul>
            <button className="close" onClick={() => setShowHelp(false)}>{t.understood}</button>
          </div>
        </div>
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Ajustes">
        <TweakSection label={t.rules}>
          <TweakToggle label={t.linkPercentile} value={linkPercentile} onChange={setLinkPercentile} />
          <TweakToggle label={t.accel} value={shakeToRoll} onChange={setShakeToRoll} />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('ui-root'));
root.render(<App />);
