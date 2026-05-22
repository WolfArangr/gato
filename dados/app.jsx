// app.jsx — Dados v2.1
// Farkle: real 3D dice engine, correct keep-and-reroll logic,
//         configurable target, 2P screen rotation

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── i18n ──────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    appName: 'Dados', appSub: 'lanzador de mesa',
    roll: 'Lanzar', rolling: '¡Suerte!', hold: 'Mantén para cargar',
    rollNotation: 'Tirada', result: 'Resultado', percentage: 'Porcentaje',
    dice: 'Dados', diceColor: 'Color de los dados', material: 'Material',
    numberTypo: 'Tipografía de números', numberColor: 'Color de los números',
    tableColor: 'Color de la mesa', tableSize: 'Tamaño',
    presets: 'Presets de dados', addPreset: 'Guardar preset actual',
    presetName: 'Nombre del preset', deletePreset: 'Eliminar',
    camera: 'Cámara', invertH: 'Invertir horizontal', invertV: 'Invertir vertical',
    sensitivity: 'Sensibilidad', sound: 'Sonido', soundOn: 'Activar sonidos',
    soundVol: 'Volumen', language: 'Idioma', rules: 'Reglas',
    linkPercentile: 'Emparejar d100+d10 como porcentaje',
    accel: 'Acelerómetro', accelBtn: 'Activar movimiento', accelActive: '↕ Movimiento activo',
    howToRoll: 'Cómo lanzar',
    helpItems: [
      'Elige dados con + / −. Mezcla cualquier combinación.',
      'Mantén el botón para cargar más fuerza al lanzar.',
      'Cámara: arrastra para rotar, rueda o pellizco para zoom, doble clic para reiniciar.',
      'Personaliza colores, materiales y números desde el menú ☰.',
      'Las caras opuestas suman correctamente: d6→7, d8→9, d12→13, d20→21.',
    ],
    understood: 'Entendido',
    farkle: 'Farkle', farkleVsAI: 'vs IA', farkleTwoPlayer: '2 Jugadores',
    farkleBack: '← Volver', farkleRoll: 'Lanzar', farkleBank: 'Guardar puntos',
    farkleHot: '¡Dados al rojo vivo! Lanza los 6 de nuevo.',
    farkleFarkle: '¡FARKLE! Sin puntos — turno perdido.',
    farkleWin: '¡Has ganado!', farkleAIWin: '¡La IA gana!',
    farkleP1Win: '¡Jugador 1 gana!', farkleP2Win: '¡Jugador 2 gana!',
    farkleCurrent: 'En juego', farkleSelectDice: 'Toca los dados que quieres guardar',
    farkleYou: 'Tú', farkleAI: 'IA', farkleP1: 'J1', farkleP2: 'J2',
    farkleThinking: 'La IA está pensando…', farkleNewGame: 'Nueva partida',
    farkleWinScore: 'Puntos para ganar', farkleRules: 'Reglas',
    farkleTarget: 'Meta',
    farkleTargetOpts: ['2.500', '5.000', '10.000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRulesText: [
      '1 = 100 pts | 5 = 50 pts',
      'Trío de 1s = 1000 pts',
      'Trío de Xs = X×100 pts (2s=200, 3s=300…)',
      'Cuatro iguales = trío × 2',
      'Cinco iguales = trío × 4',
      'Seis iguales = trío × 8',
      'Escalera 1-2-3-4-5-6 = 1500 pts',
      'Tres pares = 1500 pts',
      'Farkle = 0 pts ese turno',
      'Necesitas ≥500 pts en un turno para entrar',
    ],
    farkleNotOnBoard: 'Necesitas ≥500 pts para entrar',
    farkleP2Turn: 'Turno del J2 — gira el dispositivo',
    farklePass: 'Pasar al J2 →',
    matte: 'Mate', glossy: 'Brillante', metallic: 'Metálico',
    obsidian: 'Obsidiana', bone: 'Hueso', emerald: 'Esmeralda',
    royal: 'Real', crimson: 'Carmesí', goldColor: 'Oro', amethyst: 'Amatista',
    custom: 'Personalizado', forest: 'Bosque', ink: 'Tinta', wine: 'Vino', sand: 'Arena',
    auto: 'Auto', ivory: 'Marfil', gold: 'Oro', crimsonNum: 'Carmesí', inkNum: 'Tinta',
    mono: 'Mono', serif: 'Serif', roman: 'Romano', sans: 'Sans',
  },
  en: {
    appName: 'Dice', appSub: 'tabletop roller',
    roll: 'Roll', rolling: 'Good luck!', hold: 'Hold to charge',
    rollNotation: 'Roll', result: 'Result', percentage: 'Percentage',
    dice: 'Dice', diceColor: 'Dice color', material: 'Material',
    numberTypo: 'Number font', numberColor: 'Number color',
    tableColor: 'Table color', tableSize: 'Size',
    presets: 'Dice presets', addPreset: 'Save current preset',
    presetName: 'Preset name', deletePreset: 'Delete',
    camera: 'Camera', invertH: 'Invert horizontal', invertV: 'Invert vertical',
    sensitivity: 'Sensitivity', sound: 'Sound', soundOn: 'Enable sounds',
    soundVol: 'Volume', language: 'Language', rules: 'Rules',
    linkPercentile: 'Pair d100+d10 as percentile',
    accel: 'Motion control', accelBtn: 'Enable motion', accelActive: '↕ Motion active',
    howToRoll: 'How to roll',
    helpItems: [
      'Choose dice with + / −. Mix any combination.',
      'Hold the button to charge more throwing power.',
      'Camera: drag to rotate, scroll or pinch to zoom, double-click to reset.',
      'Customize colors, materials and numbers from the ☰ menu.',
      'Opposite faces sum correctly: d6→7, d8→9, d12→13, d20→21.',
    ],
    understood: 'Got it',
    farkle: 'Farkle', farkleVsAI: 'vs AI', farkleTwoPlayer: '2 Players',
    farkleBack: '← Back', farkleRoll: 'Roll', farkleBank: 'Bank points',
    farkleHot: 'Hot dice! Roll all 6 again.',
    farkleFarkle: 'FARKLE! No points — turn lost.',
    farkleWin: 'You win!', farkleAIWin: 'AI wins!',
    farkleP1Win: 'Player 1 wins!', farkleP2Win: 'Player 2 wins!',
    farkleCurrent: 'In play', farkleSelectDice: 'Tap dice to keep',
    farkleYou: 'You', farkleAI: 'AI', farkleP1: 'P1', farkleP2: 'P2',
    farkleThinking: 'AI is thinking…', farkleNewGame: 'New game',
    farkleWinScore: 'Score to win', farkleRules: 'Rules',
    farkleTarget: 'Target',
    farkleTargetOpts: ['2,500', '5,000', '10,000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRulesText: [
      '1 = 100 pts | 5 = 50 pts',
      'Three 1s = 1000 pts',
      'Three Xs = X×100 pts (2s=200, 3s=300…)',
      'Four of a kind = three of a kind × 2',
      'Five of a kind = three of a kind × 4',
      'Six of a kind = three of a kind × 8',
      'Straight 1-2-3-4-5-6 = 1500 pts',
      'Three pairs = 1500 pts',
      'Farkle = 0 pts that turn',
      'Need ≥500 pts in one turn to get on board',
    ],
    farkleNotOnBoard: 'Need ≥500 pts to get on board',
    farkleP2Turn: "P2's turn — rotate device",
    farklePass: 'Pass to P2 →',
    matte: 'Matte', glossy: 'Glossy', metallic: 'Metallic',
    obsidian: 'Obsidian', bone: 'Bone', emerald: 'Emerald',
    royal: 'Royal', crimson: 'Crimson', goldColor: 'Gold', amethyst: 'Amethyst',
    custom: 'Custom', forest: 'Forest', ink: 'Ink', wine: 'Wine', sand: 'Sand',
    auto: 'Auto', ivory: 'Ivory', gold: 'Gold', crimsonNum: 'Crimson', inkNum: 'Ink',
    mono: 'Mono', serif: 'Serif', roman: 'Roman', sans: 'Sans',
  }
};

function detectLang() {
  const nav = navigator.language || navigator.userLanguage || 'en';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

// ─── Farkle scoring ────────────────────────────────────────────────────────
// Returns score of a given array of face values (1–6).
// Only scores complete combos — singles only count 1s and 5s.
function calcFarkleScore(vals) {
  if (!vals || vals.length === 0) return 0;
  // Clone counts
  const cnt = [0,0,0,0,0,0,0];
  vals.forEach(v => cnt[v]++);

  // Full-set specials (all 6 dice)
  if (vals.length === 6) {
    // Straight
    if (cnt.slice(1).every(c => c === 1)) return 1500;
    // Three pairs
    const nonZero = cnt.slice(1).filter(c => c > 0);
    if (nonZero.length === 3 && nonZero.every(c => c === 2)) return 1500;
  }

  let score = 0;
  for (let v = 1; v <= 6; v++) {
    const c = cnt[v];
    if (c === 0) continue;
    const base = v === 1 ? 1000 : v * 100;
    if (c >= 6) { score += base * 8; cnt[v] -= 6; }
    else if (c >= 5) { score += base * 4; cnt[v] -= 5; }
    else if (c >= 4) { score += base * 2; cnt[v] -= 4; }
    else if (c >= 3) { score += base;     cnt[v] -= 3; }
  }
  // Remaining singles
  score += cnt[1] * 100;
  score += cnt[5] * 50;
  return score;
}

function isFarkle(vals) { return calcFarkleScore(vals) === 0; }

// Returns the best (highest-scoring) subset of indices to keep.
// Used by AI to decide which dice to set aside.
function bestKeepIndices(vals) {
  const n = vals.length;
  let best = 0, bestMask = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    const sub = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sub.push(vals[i]);
    const s = calcFarkleScore(sub);
    if (s > best) { best = s; bestMask = mask; }
  }
  const indices = [];
  for (let i = 0; i < n; i++) if (bestMask & (1 << i)) indices.push(i);
  return { indices, score: best };
}

// Which individual indices are part of ANY valid scoring subset?
// Used to show which dice the player CAN tap.
function scoringIndices(vals) {
  const n = vals.length;
  const result = new Set();
  for (let mask = 1; mask < (1 << n); mask++) {
    const sub = [];
    const idx = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { sub.push(vals[i]); idx.push(i); }
    if (calcFarkleScore(sub) > 0) idx.forEach(i => result.add(i));
  }
  return result;
}

// AI: bank or keep rolling?
function aiShouldBank(turnScore, remainingDice, totalScore, target) {
  const pFarkle = [0, 0.667, 0.444, 0.278, 0.167, 0.093, 0.046];
  const rem = remainingDice <= 0 ? 6 : Math.min(remainingDice, 6);
  const p = pFarkle[rem];
  if (totalScore + turnScore >= target) return true;
  if (turnScore >= 1500) return true;
  if (rem <= 2 && turnScore >= 400) return true;
  if (p > 0.45 && turnScore >= 500) return true;
  return false;
}

// ─── Dice definitions ──────────────────────────────────────────────────────
const DICE_TYPES = [
  { key: 'd4',   sides: 4  }, { key: 'd6',   sides: 6  }, { key: 'd8',   sides: 8  },
  { key: 'd10',  sides: 10 }, { key: 'd12',  sides: 12 }, { key: 'd20',  sides: 20 },
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
  { key: 'auto',       hex: 'auto'    },
  { key: 'ivory',      hex: '#f0ebde' },
  { key: 'gold',       hex: '#e8b14a' },
  { key: 'crimsonNum', hex: '#e34232' },
  { key: 'inkNum',     hex: '#0e0c08' },
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

// ─── Storage helpers ───────────────────────────────────────────────────────
const PREFS_KEY   = 'dados_prefs_v2';
const PRESETS_KEY = 'dados_presets_v1';
const load  = (k, fb) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const save  = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const loadPrefs    = () => load(PREFS_KEY, null);
const savePrefs    = v  => save(PREFS_KEY, v);
const loadPresets  = () => load(PRESETS_KEY, []);
const savePresets  = v  => save(PRESETS_KEY, v);

// ─── DieIcon ───────────────────────────────────────────────────────────────
function DieIcon({ type, size = 22, stroke = 'currentColor' }) {
  const s = size, c = s / 2, r = s * 0.38;
  const cm = { fill: 'none', stroke, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
  if (type === 'd4') {
    const pts = [[c,c-r],[c+r*.866,c+r*.5],[c-r*.866,c+r*.5]];
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')} {...cm}/>{pts.map((p,i)=><line key={i} x1={p[0]} y1={p[1]} x2={c} y2={c+r*.12} {...cm}/>)}</svg>;
  }
  if (type === 'd6') return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><path d={`M${c-r*.9} ${c-r*.5} L${c} ${c-r} L${c+r*.9} ${c-r*.5} L${c+r*.9} ${c+r*.5} L${c} ${c+r} L${c-r*.9} ${c+r*.5} Z`} {...cm}/><line x1={c} y1={c-r} x2={c} y2={c+r} {...cm}/><line x1={c-r*.9} y1={c-r*.5} x2={c} y2={c} {...cm}/><line x1={c+r*.9} y1={c-r*.5} x2={c} y2={c} {...cm}/><line x1={c-r*.9} y1={c+r*.5} x2={c} y2={c} {...cm}/><line x1={c+r*.9} y1={c+r*.5} x2={c} y2={c} {...cm}/></svg>;
  if (type === 'd8') return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`${c},${c-r} ${c+r*.9},${c} ${c},${c+r} ${c-r*.9},${c}`} {...cm}/><line x1={c} y1={c-r} x2={c} y2={c+r} {...cm}/><line x1={c-r*.9} y1={c} x2={c+r*.9} y2={c} {...cm}/></svg>;
  if (type === 'd10' || type === 'd100') return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`${c},${c-r} ${c+r*.85},${c-r*.1} ${c+r*.55},${c+r*.55} ${c-r*.55},${c+r*.55} ${c-r*.85},${c-r*.1}`} {...cm}/><line x1={c} y1={c-r} x2={c} y2={c+r*.55} {...cm}/></svg>;
  if (type === 'd12') { const pts=Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return[c+r*Math.cos(a),c+r*Math.sin(a)];}); return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')} {...cm}/>{pts.map((p,i)=><line key={i} x1={p[0]} y1={p[1]} x2={c} y2={c} {...cm}/>)}</svg>; }
  const pts=Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return[c+r*Math.cos(a),c+r*Math.sin(a)];});
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')} {...cm}/><polygon points={`${pts[0][0]},${pts[0][1]} ${pts[2][0]},${pts[2][1]} ${pts[4][0]},${pts[4][1]}`} {...cm}/><polygon points={`${pts[1][0]},${pts[1][1]} ${pts[3][0]},${pts[3][1]} ${pts[5][0]},${pts[5][1]}`} {...cm}/></svg>;
}

function notation(set) {
  const parts = DICE_TYPES.filter(t => set[t.key] > 0).map(t => `${set[t.key]}${t.key}`);
  return parts.join(' + ') || '—';
}

// ─── Hold-to-charge button ─────────────────────────────────────────────────
function ChargeButton({ onRoll, disabled, rolling, t }) {
  const [charge, setCharge] = useState(0);
  const [pressed, setPressed] = useState(false);
  const ivRef = useRef(null);
  const cRef  = useRef(0);

  const start = useCallback((e) => {
    if (disabled || rolling) return;
    e.preventDefault();
    setPressed(true); cRef.current = 0; setCharge(0);
    ivRef.current = setInterval(() => {
      cRef.current = Math.min(1, cRef.current + 0.025);
      setCharge(cRef.current);
    }, 30);
  }, [disabled, rolling]);

  const release = useCallback((e) => {
    if (!pressed) return;
    e.preventDefault();
    clearInterval(ivRef.current);
    setPressed(false);
    const c = cRef.current; setCharge(0); cRef.current = 0;
    if (!disabled && !rolling) onRoll(THROW_STRENGTH_BASE * (0.6 + c * 0.8));
  }, [pressed, disabled, rolling, onRoll]);

  useEffect(() => () => clearInterval(ivRef.current), []);

  const circ = 2 * Math.PI * 22;
  return (
    <button
      className={`roll-btn ${rolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''} ${pressed ? 'charging' : ''}`}
      onMouseDown={start} onMouseUp={release} onMouseLeave={release}
      onTouchStart={start} onTouchEnd={release}
      disabled={disabled && !rolling}
    >
      {charge > 0.02 && (
        <svg className="charge-ring" width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(232,177,74,0.2)" strokeWidth="3"/>
          <circle cx="27" cy="27" r="22" fill="none" stroke="var(--accent)" strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={circ*(1-charge)}
            strokeLinecap="round" transform="rotate(-90 27 27)"
            style={{transition:'stroke-dashoffset 0.03s linear'}}/>
        </svg>
      )}
      <span className="roll-label">{rolling ? t.rolling : pressed && charge > 0.1 ? '⚡' : t.roll}</span>
      {!rolling && !pressed && <span className="roll-hint"></span>}
    </button>
  );
}

// ─── Farkle die face SVG (dots) ────────────────────────────────────────────
const DOT_POSITIONS = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,22],[75,22],[25,50],[75,50],[25,78],[75,78]],
};

function DieFace({ value, size = 58, selected, locked, scorable, onClick }) {
  const dots = DOT_POSITIONS[value] || DOT_POSITIONS[1];
  const r = size * 0.08;
  const dotR = size * 0.09;
  const cls = [
    'farkle-die-3d',
    selected ? 'selected' : '',
    locked   ? 'locked'   : '',
    scorable && !locked && !selected ? 'scorable' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} style={{width:size,height:size}} onClick={onClick} disabled={locked}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="4" y="4" width="92" height="92" rx={r*100/size} ry={r*100/size}
          fill={selected ? '#2a2010' : locked ? '#141414' : '#1e1a14'}
          stroke={selected ? '#e8b14a' : locked ? '#2a2a2a' : '#3a3228'}
          strokeWidth={selected ? 3 : 1.5}/>
        {dots.map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={dotR*100/size}
            fill={selected ? '#e8b14a' : locked ? '#3a3530' : '#d4c9b0'}/>
        ))}
      </svg>
    </button>
  );
}

// ─── Farkle Game ────────────────────────────────────────────────────────────
//
// State model:
//   phase: 'setup' | 'rolling' | 'select' | 'farkle' | 'passing' | 'end'
//
//   activeDice:  array of { id, val, kept } — the dice currently on the table
//                kept=true means already banked this sub-turn (greyed out)
//   pendingVals: values of the freshly-rolled dice (not yet committed to kept)
//   turnScore:   accumulated score this turn (from previously committed sets)
//   selectedIds: set of die IDs the player has tapped to keep this throw
//
// Flow:
//   roll → engine settles → read values → show in select phase
//   player taps scoring dice → selectedIds grows
//   "Keep & roll again": commit selected to kept, add score to turnScore,
//                        roll remaining (or 6 if hot), go back to rolling
//   "Bank": commit selected (if any) + turnScore to total, end turn
//   Farkle: no scoring die in fresh roll → farkle phase → end turn
//
function FarkleGame({ t, engineRef, onBack }) {
  const [screen, setScreen] = useState('setup'); // 'setup'|'game'
  const [mode, setMode]     = useState(null);    // 'ai'|'2p'
  const [target, setTarget] = useState(10000);
  const [showRules, setShowRules] = useState(false);

  // ── game state ──
  const [scores,      setScores]      = useState([0, 0]);
  const [onBoard,     setOnBoard]     = useState([false, false]);
  const [currentP,    setCurrentP]    = useState(0);
  const [turnScore,   setTurnScore]   = useState(0);
  const [activeDice,  setActiveDice]  = useState([]);  // {id,val,kept}
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [phase,       setPhase]       = useState('rolling'); // rolling|select|farkle|passing|end
  const [winner,      setWinner]      = useState(null);
  const [message,     setMessage]     = useState('');
  const [aiThinking,  setAiThinking]  = useState(false);
  // 2P screen rotation
  const [rotated,     setRotated]     = useState(false);

  const idCounterRef = useRef(0);
  const mkId = () => ++idCounterRef.current;

  // ── engine integration ──
  // We keep the main engine loaded but reassign it with 6 d6 for Farkle
  useEffect(() => {
    if (screen !== 'game') return;
    if (!engineRef.current) return;
    engineRef.current.setDiceSet([{ type: 'd6', count: 6 }]);
  }, [screen]);

  function startGame(m) {
    setMode(m);
    setScores([0,0]); setOnBoard([false,false]);
    setCurrentP(0); setTurnScore(0);
    setActiveDice([]); setSelectedIds(new Set());
    setPhase('rolling'); setWinner(null); setMessage(''); setAiThinking(false);
    setRotated(false);
    setScreen('game');
    // Trigger first roll after engine sets dice
    setTimeout(() => doRoll(6), 300);
  }

  // Ask the engine to roll N dice and wait for settle
  const pendingRollCount = useRef(0);
  function doRoll(count) {
    if (!engineRef.current) return;
    pendingRollCount.current = count;
    setPhase('rolling');
    setMessage('');
    // Configure engine with exactly `count` d6
    engineRef.current.setDiceSet([{ type: 'd6', count }]);
    // Small delay to let setDiceSet propagate, then roll
    setTimeout(() => {
      if (engineRef.current) engineRef.current.roll(1.2);
    }, 100);
  }

  // Engine settled callback — set up in useEffect
  useEffect(() => {
    if (screen !== 'game') return;
    if (!engineRef.current) return;
    const orig = engineRef.current.onSettled;
    engineRef.current.onSettled = (results) => {
      // Only handle if we're in rolling phase
      const vals = results.filter(r => r.type === 'd6').map(r => r.value);
      if (vals.length === 0) return;
      handleSettled(vals);
    };
    return () => {
      if (engineRef.current) engineRef.current.onSettled = orig || null;
    };
  }, [screen, currentP, turnScore, onBoard, scores, mode, target]);

  function handleSettled(vals) {
    // Assign IDs to new dice
    const newDice = vals.map(v => ({ id: mkId(), val: v, kept: false }));

    if (isFarkle(vals)) {
      setActiveDice(newDice);
      setSelectedIds(new Set());
      setPhase('farkle');
      setMessage(t.farkleFarkle);
      // Auto-advance after 2s
      setTimeout(() => endTurn(0, currentP), 2200);
      return;
    }

    setActiveDice(newDice);
    setSelectedIds(new Set());
    setPhase('select');
  }

  // ── player interactions ──
  function toggleDie(id) {
    if (phase !== 'select') return;
    const die = activeDice.find(d => d.id === id);
    if (!die || die.kept) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      // Validate: adding this die must keep scoring valid
      next.add(id);
      const selVals = activeDice.filter(d => !d.kept && next.has(d.id)).map(d => d.val);
      if (calcFarkleScore(selVals) > 0) return next;
      next.delete(id);
      return prev;
    });
  }

  function keepAndRoll() {
    // Commit selected dice, roll remaining
    const freeDice   = activeDice.filter(d => !d.kept);
    const selVals    = freeDice.filter(d => selectedIds.has(d.id)).map(d => d.val);
    const pts        = calcFarkleScore(selVals);
    if (pts === 0) return;

    const newTurnScore = turnScore + pts;
    setTurnScore(newTurnScore);

    // How many remain to roll?
    const remaining = freeDice.filter(d => !selectedIds.has(d.id)).length;
    const hotDice   = remaining === 0; // used all 6 → hot dice

    // Mark selected as kept in activeDice (for display during next roll)
    const updated = activeDice.map(d =>
      selectedIds.has(d.id) ? { ...d, kept: true } : d
    );

    if (hotDice) {
      setMessage(t.farkleHot);
      setTimeout(() => {
        setActiveDice([]);
        setSelectedIds(new Set());
        doRoll(6);
      }, 800);
    } else {
      setActiveDice(updated);
      setSelectedIds(new Set());
      doRoll(remaining);
    }
  }

  function bank() {
    const freeDice = activeDice.filter(d => !d.kept);
    const selVals  = freeDice.filter(d => selectedIds.has(d.id)).map(d => d.val);
    const pts      = calcFarkleScore(selVals);
    const finalScore = turnScore + pts;
    if (finalScore === 0) return; // nothing to bank
    endTurn(finalScore, currentP);
  }

  function endTurn(finalScore, cp) {
    const newOnBoard = [...onBoard];
    const newScores  = [...scores];

    if (!newOnBoard[cp] && finalScore >= 500) newOnBoard[cp] = true;
    if (newOnBoard[cp]) newScores[cp] += finalScore;

    const won = newScores[cp] >= target ? cp : null;

    setScores(newScores);
    setOnBoard(newOnBoard);
    setWinner(won);

    if (won !== null) {
      setPhase('end');
      if (mode === 'ai') setMessage(won === 0 ? t.farkleWin : t.farkleAIWin);
      else setMessage(won === 0 ? t.farkleP1Win : t.farkleP2Win);
      return;
    }

    const next = (cp + 1) % 2;
    setCurrentP(next);
    setTurnScore(0);
    setActiveDice([]);
    setSelectedIds(new Set());

    if (mode === '2p') {
      // Show passing screen before rotating
      setPhase('passing');
      setRotated(next === 1);
    } else {
      // vs AI — trigger AI turn
      if (next === 1) {
        setPhase('rolling');
        setAiThinking(true);
        setTimeout(() => runAI(newScores, newOnBoard, 0, []), 900);
      } else {
        doRoll(6);
      }
    }
  }

  // 2P: player taps "pass" to confirm rotation and start rolling
  function confirmPass() {
    setPhase('rolling');
    setTimeout(() => doRoll(6), 200);
  }

  // ── AI ──────────────────────────────────────────────────────────────────
  // Recursive: rolls, keeps best dice, decides bank or reroll
  function runAI(curScores, curOnBoard, aiTurnScore, keptVals) {
    const rollCount = keptVals.length === 6 ? 6 :
                      keptVals.length === 0 ? 6 :
                      6 - keptVals.length;

    const rolled = Array.from({ length: rollCount }, () => Math.floor(Math.random() * 6) + 1);

    if (isFarkle(rolled)) {
      setActiveDice(rolled.map(v => ({ id: mkId(), val: v, kept: false })));
      setPhase('farkle');
      setMessage(t.farkleFarkle);
      setAiThinking(false);
      setTimeout(() => {
        setPhase('rolling');
        setAiThinking(false);
        endTurn(0, 1);
      }, 1800);
      return;
    }

    const { indices, score } = bestKeepIndices(rolled);
    const newTurnScore = aiTurnScore + score;
    const kept = [...keptVals, ...indices.map(i => rolled[i])];
    const hotDice = kept.length === 6;
    const remaining = hotDice ? 6 : rollCount - indices.length;

    // Show dice state
    const allDice = [
      ...keptVals.map(v => ({ id: mkId(), val: v, kept: true })),
      ...rolled.map((v, i) => ({ id: mkId(), val: v, kept: indices.includes(i) })),
    ];
    setActiveDice(allDice);

    const shouldBank = aiShouldBank(newTurnScore, remaining, curScores[1], target);

    setTimeout(() => {
      if (shouldBank) {
        setAiThinking(false);
        endTurn(newTurnScore, 1);
      } else {
        if (hotDice) {
          setTimeout(() => runAI(curScores, curOnBoard, newTurnScore, []), 600);
        } else {
          setTimeout(() => runAI(curScores, curOnBoard, newTurnScore, kept), 600);
        }
      }
    }, 900);
  }

  // ── derived UI values ──
  const freeDice    = activeDice.filter(d => !d.kept);
  const keptDice    = activeDice.filter(d => d.kept);
  const selVals     = freeDice.filter(d => selectedIds.has(d.id)).map(d => d.val);
  const selScore    = calcFarkleScore(selVals);
  const canBank     = (turnScore + selScore) > 0 && selectedIds.size > 0;
  const canReroll   = selScore > 0;
  const scorable    = phase === 'select' ? scoringIndices(freeDice.map(d => d.val)) : new Set();
  const freeScoreNow = phase === 'select' ? calcFarkleScore(freeDice.map(d => d.val)) : 0;

  const p0Name = mode === 'ai' ? t.farkleYou : t.farkleP1;
  const p1Name = mode === 'ai' ? t.farkleAI  : t.farkleP2;
  const isMyTurn = !(mode === 'ai' && currentP === 1);

  // ── setup screen ──
  if (screen === 'setup') {
    return (
      <div className="farkle-overlay">
        <div className="farkle-card">
          <div className="farkle-title">{t.farkle}</div>
          <div style={{color:'var(--ink-faint)',textAlign:'center',fontSize:12,marginBottom:8,fontFamily:'var(--font-mono)',letterSpacing:'0.1em'}}>KINGDOM COME DELIVERANCE</div>

          {/* Target selector */}
          <div style={{marginBottom:16}}>
            <div className="menu-title" style={{textAlign:'center',marginBottom:8}}>{t.farkleTarget}</div>
            <div className="mat-row">
              {t.farkleTargetVals.map((v,i) => (
                <button key={v} className={`mat-pill ${target===v?'sel':''}`} onClick={()=>setTarget(v)}>
                  {t.farkleTargetOpts[i]}
                </button>
              ))}
            </div>
          </div>

          <button className="farkle-btn-main" onClick={() => startGame('ai')}>{t.farkleVsAI}</button>
          <button className="farkle-btn-main" style={{marginTop:8}} onClick={() => startGame('2p')}>{t.farkleTwoPlayer}</button>
          <button className="farkle-btn-sec" style={{marginTop:4}} onClick={() => setShowRules(s=>!s)}>{t.farkleRules}</button>
          {showRules && (
            <div className="farkle-rules">
              {t.farkleRulesText.map((r,i)=><div key={i} className="farkle-rule-item">{r}</div>)}
              <div className="farkle-rule-item" style={{color:'var(--accent)'}}>{t.farkleTarget}: {target.toLocaleString()}</div>
            </div>
          )}
          <button className="farkle-btn-back" onClick={onBack}>{t.farkleBack}</button>
        </div>
      </div>
    );
  }

  // ── game screen ──
  const gameContent = (
    <div className="farkle-overlay" style={rotated ? {transform:'rotate(180deg)'} : {}}>
      <div className="farkle-card farkle-card-game">

        {/* Scores header */}
        <div className="farkle-scores">
          <div className={`farkle-player-score ${currentP===0?'active':''}`}>
            <div className="farkle-player-name">{p0Name}</div>
            <div className="farkle-score-val">{scores[0]}</div>
            {!onBoard[0] && <div style={{fontSize:9,color:'var(--ink-faint)',fontFamily:'var(--font-mono)',marginTop:2}}>–</div>}
          </div>
          <div style={{textAlign:'center'}}>
            <div className="farkle-vs">vs</div>
            <div style={{fontSize:9,color:'var(--ink-faint)',fontFamily:'var(--font-mono)'}}>{target.toLocaleString()}</div>
          </div>
          <div className={`farkle-player-score ${currentP===1?'active':''}`}>
            <div className="farkle-player-name">{p1Name}</div>
            <div className="farkle-score-val">{scores[1]}</div>
            {!onBoard[1] && <div style={{fontSize:9,color:'var(--ink-faint)',fontFamily:'var(--font-mono)',marginTop:2}}>–</div>}
          </div>
        </div>

        {/* Turn score */}
        <div className="farkle-turn-score">
          <span style={{color:'var(--ink-faint)',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>{t.farkleCurrent}</span>
          <span style={{fontFamily:'var(--font-display)',fontSize:32,color:'var(--accent)',lineHeight:1}}>{turnScore + selScore}</span>
        </div>

        {/* Kept dice strip */}
        {keptDice.length > 0 && (
          <div className="farkle-kept-strip">
            {keptDice.map(d => <DieFace key={d.id} value={d.val} size={40} locked />)}
            <div className="farkle-kept-label">+{turnScore}</div>
          </div>
        )}

        {/* Active (fresh) dice */}
        <div className="farkle-dice-area">
          {phase === 'rolling' && (
            <div className="farkle-rolling-anim">
              {[...Array(pendingRollCount.current||6)].map((_,i)=>(
                <div key={i} className="farkle-rolling-die" style={{animationDelay:`${i*80}ms`}}>
                  <svg width="46" height="46" viewBox="0 0 100 100">
                    <rect x="4" y="4" width="92" height="92" rx="14" fill="#1e1a14" stroke="#3a3228" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="10" fill="#d4c9b0" opacity="0.5"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
          {(phase === 'select' || phase === 'farkle') && freeDice.map((d, fi) => (
            <DieFace
              key={d.id}
              value={d.val}
              size={54}
              selected={selectedIds.has(d.id)}
              scorable={scorable.has(fi)}
              onClick={() => toggleDie(d.id)}
            />
          ))}
        </div>

        {/* Message / hint */}
        {message && <div className="farkle-message">{message}</div>}
        {aiThinking && !message && <div className="farkle-message" style={{fontSize:13,color:'var(--ink-dim)'}}>{t.farkleThinking}</div>}
        {phase === 'select' && !message && !aiThinking && isMyTurn && (
          <div style={{fontSize:11,color:'var(--ink-faint)',textAlign:'center',fontFamily:'var(--font-ui)'}}>{t.farkleSelectDice}</div>
        )}
        {phase === 'select' && !onBoard[currentP] && (turnScore + selScore) > 0 && (turnScore + selScore) < 500 && (
          <div style={{fontSize:10,color:'var(--danger)',textAlign:'center',fontFamily:'var(--font-mono)'}}>{t.farkleNotOnBoard}</div>
        )}

        {/* 2P passing screen */}
        {phase === 'passing' && (
          <div className="farkle-passing">
            <div>{t.farkleP2Turn}</div>
            <button className="farkle-btn-main" style={{marginTop:12}} onClick={confirmPass}>{t.farklePass}</button>
          </div>
        )}

        {/* Action buttons */}
        {phase === 'select' && isMyTurn && (
          <div className="farkle-actions">
            {canReroll && (
              <button className="farkle-btn-main" onClick={keepAndRoll}>
                {t.farkleRoll} {selScore > 0 ? `(+${selScore})` : ''}
              </button>
            )}
            {canBank && (
              <button className="farkle-btn-sec" onClick={bank}>
                {t.farkleBank} ({turnScore + selScore})
              </button>
            )}
            {!canReroll && !canBank && freeScoreNow > 0 && (
              <div style={{fontSize:11,color:'var(--ink-faint)',textAlign:'center'}}>{t.farkleSelectDice}</div>
            )}
          </div>
        )}

        {phase === 'end' && (
          <div className="farkle-actions">
            <button className="farkle-btn-main" onClick={() => setScreen('setup')}>{t.farkleNewGame}</button>
          </div>
        )}

        <button className="farkle-btn-back" onClick={() => { setScreen('setup'); onBack(); }}>{t.farkleBack}</button>
      </div>
    </div>
  );

  return gameContent;
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const engineRef    = useRef(null);
  const menuRef      = useRef(null);
  const hamburgerRef = useRef(null);

  const [lang, setLang] = useState(() => loadPrefs()?.lang || detectLang());
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const sp = loadPrefs() || {};
  const [color,         setColor]         = useState(sp.color        || 'obsidian');
  const [customColor,   setCustomColor]   = useState(sp.customColor  || '#5a87c2');
  const [material,      setMaterial]      = useState(sp.material     || 'glossy');
  const [numFont,       setNumFont]       = useState(sp.numFont      || 'mono');
  const [numColor,      setNumColor]      = useState(sp.numColor     || 'auto');
  const [tableKey,      setTableKey]      = useState(sp.tableKey     || 'forest');
  const [tableSize,     setTableSize]     = useState(sp.tableSize    || 8.5);
  const [soundEnabled,  setSoundEnabled]  = useState(sp.soundEnabled !== false);
  const [soundVol,      setSoundVol]      = useState(sp.soundVol     ?? 0.7);
  const [invertCamX,    setInvertCamX]    = useState(sp.invertCamX   || false);
  const [invertCamY,    setInvertCamY]    = useState(sp.invertCamY   !== false);
  const [camSens,       setCamSens]       = useState(sp.camSens      ?? 0.7);
  const [linkPercentile,setLinkPercentile]= useState(sp.linkPercentile !== false);
  const [shakeToRoll,   setShakeToRoll]   = useState(sp.shakeToRoll  !== false);

  const [diceSet,       setDiceSet]       = useState({d4:0,d6:0,d8:0,d10:0,d12:0,d20:1,d100:0});
  const [results,       setResults]       = useState(null);
  const [rolling,       setRolling]       = useState(false);
  const [showHelp,      setShowHelp]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [shakeArmed,    setShakeArmed]    = useState(false);
  const [showFarkle,    setShowFarkle]    = useState(false);
  const [dicePresets,   setDicePresets]   = useState(() => loadPresets());
  const [presetNameInput,setPresetNameInput] = useState('');
  const [showPresetInput,setShowPresetInput] = useState(false);
  const isTouch = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);

  // Persist prefs
  useEffect(() => {
    savePrefs({ color,customColor,material,numFont,numColor,tableKey,tableSize,
      soundEnabled,soundVol,invertCamX,invertCamY,camSens,linkPercentile,shakeToRoll,lang });
  }, [color,customColor,material,numFont,numColor,tableKey,tableSize,
      soundEnabled,soundVol,invertCamX,invertCamY,camSens,linkPercentile,shakeToRoll,lang]);

  // Init engine once
  useEffect(() => {
    const tab = TABLE_OPTIONS.find(x => x.key === tableKey) || TABLE_OPTIONS[0];
    const eng = new window.DiceEngine(document.getElementById('scene-canvas'), {
      tableColor: tab.color, accentLight: tab.accent,
      colorPreset: color, materialKind: material,
      gravity: GRAVITY, numberSize: NUMBER_SIZE,
      soundEnabled, soundVolume: soundVol,
      invertCameraX: invertCamX, invertCameraY: invertCamY, cameraSensitivity: camSens,
    });
    eng.onSettled = (res) => { setRolling(false); setResults(res); };
    engineRef.current = eng;
  }, []);

  // Dice set
  useEffect(() => {
    if (!engineRef.current) return;
    const list = DICE_TYPES.filter(x => diceSet[x.key] > 0).map(x => ({type:x.key,count:diceSet[x.key]}));
    engineRef.current.setDiceSet(list);
    setResults(null);
  }, [diceSet]);

  // Appearance
  useEffect(() => {
    if (!engineRef.current) return;
    const font = NUMBER_FONTS.find(f=>f.key===numFont)||NUMBER_FONTS[0];
    const nc   = NUMBER_COLOR_OPTIONS.find(x=>x.key===numColor)||NUMBER_COLOR_OPTIONS[0];
    engineRef.current.setOptions({ colorPreset:color, customColor, materialKind:material,
      numberFont:font.family, numberWeight:font.weight, numberColor:nc.hex, numberSize:NUMBER_SIZE });
  }, [color,customColor,material,numFont,numColor]);

  useEffect(() => {
    if (!engineRef.current) return;
    const tab = TABLE_OPTIONS.find(x=>x.key===tableKey)||TABLE_OPTIONS[0];
    engineRef.current.setOptions({ tableColor:tab.color, accentLight:tab.accent });
  }, [tableKey]);

  useEffect(() => { if (engineRef.current) engineRef.current.setTableSize(tableSize); }, [tableSize]);
  useEffect(() => { if (engineRef.current) engineRef.current.setOptions({soundEnabled,soundVolume:soundVol}); }, [soundEnabled,soundVol]);
  useEffect(() => { if (engineRef.current) engineRef.current.setOptions({invertCameraX:invertCamX,invertCameraY:invertCamY,cameraSensitivity:camSens}); }, [invertCamX,invertCamY,camSens]);

  const roll = useCallback((strength=THROW_STRENGTH_BASE) => {
    if (!engineRef.current) return;
    if (Object.values(diceSet).reduce((s,n)=>s+n,0)===0) return;
    setRolling(true); setResults(null);
    engineRef.current.roll(strength);
  }, [diceSet]);

  // Accelerometer
  const accelRef = useRef({ prev: 9.81 });
  useEffect(() => {
    if (!shakeArmed) return;
    let cooldown = false, timer = null;
    function onMotion(e) {
      const a = e.accelerationIncludingGravity;
      if (!a || !engineRef.current) return;
      const {x=0,y=0,z=0} = a;
      const total = Math.hypot(x,y,z);
      const delta = Math.abs(total - accelRef.current.prev);
      accelRef.current.prev = total;
      if (delta > 8 && !cooldown && !rolling) {
        cooldown = true;
        roll(Math.min(2.5, THROW_STRENGTH_BASE + delta/8));
        setTimeout(()=>{ cooldown=false; }, 1500);
        return;
      }
      engineRef.current.setGravityTilt(x,y,z,total);
      if (timer) clearTimeout(timer);
      timer = setTimeout(()=>{ if(engineRef.current) engineRef.current.resetGravity(); }, 800);
    }
    window.addEventListener('devicemotion', onMotion);
    return ()=>{ window.removeEventListener('devicemotion',onMotion); if(timer)clearTimeout(timer); if(engineRef.current)engineRef.current.resetGravity(); };
  }, [shakeArmed, roll, rolling]);

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.code==='Space' && !e.target.closest('input,textarea,select,button')) { e.preventDefault(); if(!rolling) roll(); }
      else if (e.code==='Escape') { setMenuOpen(false); setShowHelp(false); }
    }
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  }, [roll,rolling]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (hamburgerRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown',onDown);
    document.addEventListener('touchstart',onDown);
    return ()=>{ document.removeEventListener('mousedown',onDown); document.removeEventListener('touchstart',onDown); };
  }, [menuOpen]);

  const enableShake = async () => {
    if (typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function') {
      try { const p=await DeviceMotionEvent.requestPermission(); if(p==='granted') setShakeArmed(true); } catch{}
    } else setShakeArmed(true);
  };

  function adjust(type, delta) {
    setDiceSet(prev=>({ ...prev, [type]: Math.max(0,Math.min(20,(prev[type]||0)+delta)) }));
  }
  function savePreset() {
    if (!presetNameInput.trim()) return;
    const up = [...dicePresets, { name:presetNameInput.trim(), set:{...diceSet}, id:Date.now() }];
    setDicePresets(up); savePresets(up); setPresetNameInput(''); setShowPresetInput(false);
  }
  function deletePreset(id) { const up=dicePresets.filter(p=>p.id!==id); setDicePresets(up); savePresets(up); }
  function loadPreset(p)    { setDiceSet({...p.set}); }

  // Results grouping
  function buildResultGroups(res) {
    if (!res) return null;
    const out = {pairs:[],dice:[]};
    if (!linkPercentile) { out.dice=res.slice(); return out; }
    const d100=res.filter(r=>r.type==='d100'), d10=res.filter(r=>r.type==='d10');
    const others=res.filter(r=>r.type!=='d100'&&r.type!=='d10');
    const n=Math.min(d100.length,d10.length);
    for(let i=0;i<n;i++){const t=d100[i].value,u=d10[i].value;out.pairs.push({tens:t,units:u,value:(t===0&&u===0)?100:t+u});}
    out.dice=others.concat(d100.slice(n)).concat(d10.slice(n));
    return out;
  }
  const grouped = buildResultGroups(results);
  const totalFromGroups = grouped
    ? grouped.pairs.reduce((s,p)=>s+p.value,0)+grouped.dice.reduce((s,d)=>s+(d.value??0),0) : null;
  const totalDice = Object.values(diceSet).reduce((s,n)=>s+n,0);
  const rollNotation = notation(diceSet);

  if (showFarkle) {
    return <FarkleGame t={t} engineRef={engineRef} onBack={() => { setShowFarkle(false); /* restore dice */ const list=DICE_TYPES.filter(x=>diceSet[x.key]>0).map(x=>({type:x.key,count:diceSet[x.key]})); if(engineRef.current)engineRef.current.setDiceSet(list); }} />;
  }

  return (
    <React.Fragment>
      {/* Top bar */}
      <div className="top-bar">
        <button ref={hamburgerRef} className={`hamburger ${menuOpen?'open':''}`} onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
          <span/><span/><span/>
        </button>
        <div className="brand">
          <div className="brand-mark"><DieIcon type="d20" size={28} stroke="#e8b14a"/></div>
          <div className="brand-text">
            <div className="brand-title">{t.appName}</div>
            <div className="brand-sub">{t.appSub}</div>
          </div>
        </div>
        <button className="preset-pill" onClick={()=>setShowFarkle(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="5" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="11" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="5" cy="11" r="1.2" fill="currentColor"/>
          </svg>
          {t.farkle}
        </button>
        <button className="icon-btn" onClick={()=>setShowHelp(s=>!s)}>?</button>
      </div>

      {/* Menu */}
      {menuOpen && (
        <div className="menu-dropdown entering" ref={menuRef}>
          <div className="menu-section">
            <div className="menu-title">{t.dice}</div>
            <div className="dice-grid-menu">
              {DICE_TYPES.map(dt => {
                const count=diceSet[dt.key];
                return (
                  <div key={dt.key} className={`die-row-menu ${count>0?'active':''}`}>
                    <div className="die-info-menu">
                      <DieIcon type={dt.key} size={20} stroke={count>0?'#e8b14a':'#7e7669'}/>
                      <span className="die-label-menu">{dt.key}</span>
                    </div>
                    <div className="die-counter">
                      <button className="cbtn" onClick={()=>adjust(dt.key,-1)} disabled={count===0}>−</button>
                      <div className="count">{count}</div>
                      <button className="cbtn" onClick={()=>adjust(dt.key,+1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="menu-divider"/>
          <div className="menu-section">
            <div className="menu-title">{t.presets}</div>
            <div className="presets-list">
              {dicePresets.map(p=>(
                <div key={p.id} className="preset-row">
                  <button className="preset-load-btn" onClick={()=>{loadPreset(p);setMenuOpen(false);}}>{p.name}</button>
                  <button className="preset-del-btn" onClick={()=>deletePreset(p.id)}>×</button>
                </div>
              ))}
            </div>
            {showPresetInput ? (
              <div className="preset-input-row">
                <input className="preset-input" value={presetNameInput} onChange={e=>setPresetNameInput(e.target.value)}
                  placeholder={t.presetName} onKeyDown={e=>{if(e.key==='Enter')savePreset();if(e.key==='Escape')setShowPresetInput(false);}} autoFocus/>
                <button className="cbtn" onClick={savePreset} disabled={!presetNameInput.trim()}>✓</button>
                <button className="cbtn" onClick={()=>setShowPresetInput(false)}>×</button>
              </div>
            ) : (
              <button className="preset-add-btn" onClick={()=>setShowPresetInput(true)}>+ {t.addPreset}</button>
            )}
          </div>
          <div className="menu-divider"/>
          <div className="menu-section">
            <div className="menu-title">{t.diceColor}</div>
            <div className="swatch-grid">
              {COLOR_OPTIONS.map(c=>(
                <button key={c.key} className={`swatch ${color===c.key?'sel':''}`} onClick={()=>setColor(c.key)}>
                  <span className="swatch-disc" style={{background:c.swatch,borderColor:c.accent}}>
                    <span className="swatch-dot" style={{background:c.accent}}/>
                  </span>
                  <span className="swatch-label">{t[c.key]||c.key}</span>
                </button>
              ))}
              <label className={`swatch custom ${color==='custom'?'sel':''}`}>
                <span className="swatch-disc rainbow" style={color==='custom'?{background:customColor,borderColor:customColor}:undefined}>
                  {color!=='custom'&&<span className="swatch-plus">+</span>}
                  {color==='custom'&&<span className="swatch-dot" style={{background:'#fff',mixBlendMode:'difference'}}/>}
                </span>
                <span className="swatch-label">{t.custom}</span>
                <input type="color" className="color-input" value={customColor} onChange={e=>{setCustomColor(e.target.value);setColor('custom');}} onClick={()=>setColor('custom')}/>
              </label>
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.material}</div>
            <div className="mat-row">
              {MATERIAL_OPTIONS.map(m=><button key={m} className={`mat-pill ${material===m?'sel':''}`} onClick={()=>setMaterial(m)}>{t[m]}</button>)}
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.numberTypo}</div>
            <div className="num-row-grid">
              {NUMBER_FONTS.map(f=><button key={f.key} className={`num-font ${numFont===f.key?'sel':''}`} onClick={()=>setNumFont(f.key)} style={{fontFamily:f.family,fontWeight:f.weight}}>20</button>)}
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.numberColor}</div>
            <div className="num-row swatches">
              {NUMBER_COLOR_OPTIONS.map(c=>(
                <button key={c.key} className={`num-swatch ${numColor===c.key?'sel':''}`} onClick={()=>setNumColor(c.key)}>
                  {c.hex==='auto'?<span className="auto-disc">A</span>:<span className="solid-disc" style={{background:c.hex}}/>}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.tableColor}</div>
            <div className="table-row">
              {TABLE_OPTIONS.map(tb=>(
                <button key={tb.key} className={`table-pill ${tableKey===tb.key?'sel':''}`} onClick={()=>setTableKey(tb.key)}>
                  <span className="table-disc" style={{background:tb.color,boxShadow:`inset 0 0 14px ${tb.accent}66`}}/>
                  <span>{t[tb.key]}</span>
                </button>
              ))}
            </div>
            <div className="num-row size" style={{marginTop:12}}>
              <span className="num-label">{t.tableSize}</span>
              <input type="range" min="5" max="14" step="0.5" value={tableSize} onChange={e=>setTableSize(Number(e.target.value))} style={{flex:1}}/>
              <span className="num-value">{tableSize.toFixed(1)}</span>
            </div>
          </div>
          <div className="menu-divider"/>
          <div className="menu-section">
            <div className="menu-title">{t.sound}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.soundOn}</span>
              <button className={`toggle-btn ${soundEnabled?'on':''}`} onClick={()=>setSoundEnabled(v=>!v)}><span className="toggle-knob"/></button>
            </div>
            {soundEnabled&&(
              <div className="num-row size" style={{marginTop:6}}>
                <span className="num-label">{t.soundVol}</span>
                <input type="range" min="0" max="1" step="0.05" value={soundVol} onChange={e=>setSoundVol(Number(e.target.value))} style={{flex:1}}/>
                <span className="num-value">{Math.round(soundVol*100)}%</span>
              </div>
            )}
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.camera}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.invertH}</span>
              <button className={`toggle-btn ${invertCamX?'on':''}`} onClick={()=>setInvertCamX(v=>!v)}><span className="toggle-knob"/></button>
            </div>
            <div className="tweak-toggle-row" style={{marginTop:6}}>
              <span className="tweak-label">{t.invertV}</span>
              <button className={`toggle-btn ${invertCamY?'on':''}`} onClick={()=>setInvertCamY(v=>!v)}><span className="toggle-knob"/></button>
            </div>
            <div className="num-row size" style={{marginTop:8}}>
              <span className="num-label">{t.sensitivity}</span>
              <input type="range" min="0.2" max="2" step="0.1" value={camSens} onChange={e=>setCamSens(Number(e.target.value))} style={{flex:1}}/>
              <span className="num-value">{camSens.toFixed(1)}×</span>
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.rules}</div>
            <div className="tweak-toggle-row">
              <span className="tweak-label">{t.linkPercentile}</span>
              <button className={`toggle-btn ${linkPercentile?'on':''}`} onClick={()=>setLinkPercentile(v=>!v)}><span className="toggle-knob"/></button>
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.language}</div>
            <div className="mat-row">
              {['es','en'].map(l=><button key={l} className={`mat-pill ${lang===l?'sel':''}`} onClick={()=>setLang(l)}>{l==='es'?'🇪🇸 Español':'🇬🇧 English'}</button>)}
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
        <ChargeButton onRoll={roll} disabled={totalDice===0} rolling={rolling} t={t}/>
        {shakeToRoll&&isTouch&&!shakeArmed&&<button className="shake-arm" onClick={enableShake}>{t.accelBtn}</button>}
        {shakeToRoll&&isTouch&&shakeArmed&&<div className="shake-active">{t.accelActive}</div>}
      </div>

      {/* Results */}
      {results&&grouped&&(
        <div className="results-panel">
          <div className="results-head">
            <span className="results-label">{grouped.pairs.length>0&&grouped.dice.length===0?t.percentage:t.result}</span>
            <span className="results-total">{totalFromGroups}</span>
          </div>
          {grouped.pairs.length>0&&<div className="results-list">{grouped.pairs.map((p,i)=>(
            <div key={'p'+i} className="result-chip pair">
              <span className="pair-badge">%</span>
              <span className="result-type">d100+d10</span>
              <span className="pair-detail">{String(p.tens).padStart(2,'0')}+{p.units}</span>
              <span className="result-value">{p.value}</span>
            </div>
          ))}</div>}
          {grouped.dice.length>0&&<div className="results-list">{grouped.dice.map((r,i)=>(
            <div key={'d'+i} className="result-chip">
              <DieIcon type={r.type} size={18} stroke="#e8b14a"/>
              <span className="result-type">{r.type}</span>
              <span className="result-value">{r.value}</span>
            </div>
          ))}</div>}
          {(grouped.pairs.length+grouped.dice.length)>1&&(
            <div className="results-breakdown">
              {[...grouped.pairs.map(p=>p.value),...grouped.dice.map(d=>d.value)].join(' + ')} = <span>{totalFromGroups}</span>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      {showHelp&&(
        <div className="help-overlay" onClick={()=>setShowHelp(false)}>
          <div className="help-card" onClick={e=>e.stopPropagation()}>
            <div className="help-title">{t.howToRoll}</div>
            <ul>{t.helpItems.map((item,i)=><li key={i}>{item}</li>)}</ul>
            <button className="close" onClick={()=>setShowHelp(false)}>{t.understood}</button>
          </div>
        </div>
      )}

      <TweaksPanel title="Ajustes">
        <TweakSection label={t.rules}>
          <TweakToggle label={t.linkPercentile} value={linkPercentile} onChange={setLinkPercentile}/>
          <TweakToggle label={t.accel} value={shakeToRoll} onChange={setShakeToRoll}/>
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('ui-root'));
root.render(<App />);
