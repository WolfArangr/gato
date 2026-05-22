// app.jsx — Dados v4.0
// Changes: home menu, no KCD label, Farkle zoom, wood dice, medieval UI,
//          super throw, tooltip, text-selection disabled, Android accel fix,
//          straight 1-5 detection, no-discard non-scoring, rules reordered,
//          default 5000 no-entry, removed "500 pts min" text

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── i18n ──────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    appName: 'Dados', appSub: 'lanzador de mesa',
    roll: 'Lanzar', rolling: '¡Suerte!',
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
      'Mantén el botón para cargar más fuerza al lanzar. Mantén 2.5s para ¡super lanzamiento!',
      'Cámara: arrastra para rotar, rueda o pellizco para zoom, doble clic para reiniciar.',
      'Personaliza colores, materiales y números desde el menú ☰.',
    ],
    holdToThrow: '¡Mantén para más fuerza!',
    superThrow: '⚡ SUPER LANZAMIENTO',
    understood: 'Entendido',
    // Home menu
    homeTitle: 'Dados',
    homeSub: 'LANZADOR DE MESA',
    homePlay: 'Simulador de Dados',
    homeFarkle: 'Jugar al Farkle',
    homeDesc: 'Simulador 3D de dados para cualquier juego de mesa',
    homeFarkleDesc: 'El clásico juego medieval de dados',
    // Farkle
    farkle: 'Farkle',
    farkleVsAI: 'vs IA', farkleTwoPlayer: '2 Jugadores',
    farkleBack: '← Salir',
    farkleRollBtn: 'Lanzar dados',
    farkleKeepRoll: 'Guardar y lanzar',
    farkleBank: 'Guardar puntos',
    farkleHot: '¡Dados al rojo! Lanza los 6.',
    farkleFarkle: '¡FARKLE!',
    farkleFarkleDetail: 'Sin puntos — pierdes el turno',
    farkleWin: '¡Has ganado!', farkleAIWin: '¡La IA gana!',
    farkleP1Win: '¡Jugador 1 gana!', farkleP2Win: '¡Jugador 2 gana!',
    farkleTurn: 'Turno de', farkleCurrent: 'En juego',
    farkleKept: 'Guardados',
    farkleSelectDice: 'Toca los dados que quieres guardar',
    farkleYou: 'Tú', farkleAI: 'IA', farkleP1: 'J1', farkleP2: 'J2',
    farkleThinking: 'La IA está pensando…', farkleNewGame: 'Nueva partida',
    farkleTarget: 'Meta', farkleEntry: 'Modo de entrada',
    farkleEntryOn: 'Con entrada', farkleEntryOff: 'Sin entrada',
    farkleTargetOpts: ['2.500', '5.000', '10.000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRules: 'Reglas',
    farkleRulesText: [
      '— ENTRADA —',
      'Con entrada: necesitas ≥500 pts en un turno para abrir tu marcador.',
      'Sin entrada: todos los puntos cuentan desde el primer turno.',
      '',
      '— PUNTUACIÓN —',
      '1 = 100 pts | 5 = 50 pts',
      'Trío de 1s = 1000 pts',
      'Trío de Xs = X×100 (ej: trío 2s = 200 pts)',
      'Cuatro iguales = trío × 2',
      'Cinco iguales = trío × 4',
      'Seis iguales = trío × 8',
      'Escalera 1-2-3-4-5 = 500 pts',
      'Escalera 1-2-3-4-5-6 = 1500 pts',
      'Tres pares = 1500 pts',
      '',
      '— TURNO —',
      'Farkle = 0 pts, pierdes el turno.',
      'Puedes guardar dados que puntúen y volver a tirar los demás.',
      'Si todos los dados puntúan, ¡vuelves a tirar los 6!',
    ],
    farkleNotOnBoard: '< 500 pts — no computa aún',
    farkleP2Pass: 'Turno del J2',
    farklePassBtn: 'Continuar →',
    matte: 'Mate', glossy: 'Brillante', metallic: 'Metálico',
    obsidian: 'Obsidiana', bone: 'Hueso', emerald: 'Esmeralda',
    royal: 'Real', crimson: 'Carmesí', goldColor: 'Oro', amethyst: 'Amatista',
    custom: 'Personalizado', forest: 'Bosque', ink: 'Tinta', wine: 'Vino', sand: 'Arena',
    auto: 'Auto', ivory: 'Marfil', gold: 'Oro', crimsonNum: 'Carmesí', inkNum: 'Tinta',
    mono: 'Mono', serif: 'Serif', roman: 'Romano', sans: 'Sans',
  },
  en: {
    appName: 'Dice', appSub: 'tabletop roller',
    roll: 'Roll', rolling: 'Good luck!',
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
      'Hold the button to charge more throwing power. Hold 2.5s for super throw!',
      'Camera: drag to rotate, scroll or pinch to zoom, double-click to reset.',
      'Customize colors, materials and numbers from the ☰ menu.',
    ],
    holdToThrow: 'Hold for more power!',
    superThrow: '⚡ SUPER THROW',
    understood: 'Got it',
    // Home menu
    homeTitle: 'Dice',
    homeSub: 'TABLETOP ROLLER',
    homePlay: 'Dice Simulator',
    homeFarkle: 'Play Farkle',
    homeDesc: '3D dice simulator for any tabletop game',
    homeFarkleDesc: 'The classic medieval dice game',
    // Farkle
    farkle: 'Farkle',
    farkleVsAI: 'vs AI', farkleTwoPlayer: '2 Players',
    farkleBack: '← Exit',
    farkleRollBtn: 'Roll dice',
    farkleKeepRoll: 'Keep & roll',
    farkleBank: 'Bank points',
    farkleHot: 'Hot dice! Roll all 6.',
    farkleFarkle: 'FARKLE!',
    farkleFarkleDetail: 'No points — turn lost',
    farkleWin: 'You win!', farkleAIWin: 'AI wins!',
    farkleP1Win: 'Player 1 wins!', farkleP2Win: 'Player 2 wins!',
    farkleTurn: 'Turn:', farkleCurrent: 'In play',
    farkleKept: 'Kept',
    farkleSelectDice: 'Tap dice to keep',
    farkleYou: 'You', farkleAI: 'AI', farkleP1: 'P1', farkleP2: 'P2',
    farkleThinking: 'AI is thinking…', farkleNewGame: 'New game',
    farkleTarget: 'Target', farkleEntry: 'Entry rule',
    farkleEntryOn: 'With entry', farkleEntryOff: 'No entry',
    farkleTargetOpts: ['2,500', '5,000', '10,000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRules: 'Rules',
    farkleRulesText: [
      '— ENTRY RULE —',
      'With entry: you need ≥500 pts in one turn to open your score.',
      'No entry: all points count from the very first turn.',
      '',
      '— SCORING —',
      '1 = 100 pts | 5 = 50 pts',
      'Three 1s = 1000 pts',
      'Three Xs = X×100 (e.g. three 2s = 200 pts)',
      'Four of a kind = three × 2',
      'Five of a kind = three × 4',
      'Six of a kind = three × 8',
      'Straight 1-2-3-4-5 = 500 pts',
      'Straight 1-2-3-4-5-6 = 1500 pts',
      'Three pairs = 1500 pts',
      '',
      '— TURN —',
      'Farkle = 0 pts, lose your turn.',
      'You can keep scoring dice and re-roll the rest.',
      'If all dice score, roll all 6 again!',
    ],
    farkleNotOnBoard: '< 500 pts — not counted yet',
    farkleP2Pass: "Player 2's turn",
    farklePassBtn: 'Continue →',
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
function calcFarkleScore(vals) {
  if (!vals || vals.length === 0) return 0;
  const cnt = [0,0,0,0,0,0,0];
  vals.forEach(v => { if (v >= 1 && v <= 6) cnt[v]++; });

  if (vals.length === 6) {
    // Straight 1-2-3-4-5-6
    if (cnt.slice(1).every(c => c === 1)) return 1500;
    // Three pairs
    const nonZero = cnt.slice(1).filter(c => c > 0);
    if (nonZero.length === 3 && nonZero.every(c => c === 2)) return 1500;
  }

  // Straight 1-2-3-4-5 (5 dice, all present once)
  if (vals.length === 5) {
    if (cnt[1]===1 && cnt[2]===1 && cnt[3]===1 && cnt[4]===1 && cnt[5]===1) return 500;
  }
  // Straight 1-2-3-4-5 hidden inside 6 dice (other die is 6 and doesn't interfere)
  if (vals.length === 6) {
    if (cnt[1]>=1 && cnt[2]>=1 && cnt[3]>=1 && cnt[4]>=1 && cnt[5]>=1 && cnt[6]===0) {
      // exactly one of each 1-5 plus one extra 1 or 5 — handle below with normal scoring
    }
  }

  let score = 0;
  for (let v = 1; v <= 6; v++) {
    const c = cnt[v];
    if (c === 0) continue;
    const base = v === 1 ? 1000 : v * 100;
    if (c >= 6)      { score += base * 8; cnt[v] = 0; }
    else if (c >= 5) { score += base * 4; cnt[v] = c - 5; }
    else if (c >= 4) { score += base * 2; cnt[v] = c - 4; }
    else if (c >= 3) { score += base;     cnt[v] = c - 3; }
  }
  score += cnt[1] * 100;
  score += cnt[5] * 50;
  return score;
}

// Check for straight 1-5 in a subset of values
function hasStraight1to5(vals) {
  if (vals.length < 5) return false;
  const cnt = [0,0,0,0,0,0,0];
  vals.forEach(v => { if (v >= 1 && v <= 6) cnt[v]++; });
  return cnt[1]>=1 && cnt[2]>=1 && cnt[3]>=1 && cnt[4]>=1 && cnt[5]>=1;
}

function isFarkle(vals) { return calcFarkleScore(vals) === 0; }

// Best subset of indices to keep (highest score)
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

// Which individual die indices participate in at least one valid scoring subset?
function scoringDieIndices(vals) {
  const n = vals.length;
  const result = new Set();
  for (let mask = 1; mask < (1 << n); mask++) {
    const sub = [], idx = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { sub.push(vals[i]); idx.push(i); }
    if (calcFarkleScore(sub) > 0) idx.forEach(i => result.add(i));
  }
  return result;
}

function aiShouldBank(turnScore, remaining, totalScore, target) {
  const pFarkle = [0, 0.667, 0.444, 0.278, 0.167, 0.093, 0.046];
  const rem = Math.max(1, Math.min(remaining, 6));
  if (totalScore + turnScore >= target) return true;
  if (turnScore >= 1500) return true;
  if (rem <= 2 && turnScore >= 400) return true;
  if (pFarkle[rem] > 0.42 && turnScore >= 500) return true;
  return false;
}

// ─── Static data ───────────────────────────────────────────────────────────
const DICE_TYPES = [
  {key:'d4',sides:4},{key:'d6',sides:6},{key:'d8',sides:8},
  {key:'d10',sides:10},{key:'d12',sides:12},{key:'d20',sides:20},{key:'d100',sides:10},
];
const COLOR_OPTIONS = [
  {key:'obsidian',swatch:'#16161a',accent:'#e8b14a'},
  {key:'bone',    swatch:'#ece3cf',accent:'#3a2a1c'},
  {key:'emerald', swatch:'#0f4435',accent:'#e6d8a5'},
  {key:'royal',   swatch:'#1a2b5a',accent:'#d9c98a'},
  {key:'crimson', swatch:'#5c1216',accent:'#e8d3a4'},
  {key:'gold',    swatch:'#a9853a',accent:'#1a1208'},
  {key:'amethyst',swatch:'#3a1f5a',accent:'#e3d3f0'},
];
const MATERIAL_OPTIONS = ['matte','glossy','metallic'];
const NUMBER_FONTS = [
  {key:'mono', family:'"JetBrains Mono","Menlo",monospace',weight:700},
  {key:'serif',family:'"DM Serif Display",Georgia,serif',  weight:400},
  {key:'roman',family:'"Cinzel","Trajan Pro",serif',         weight:700},
  {key:'sans', family:'"Manrope",system-ui,sans-serif',      weight:700},
];
const NUMBER_COLOR_OPTIONS = [
  {key:'auto',      hex:'auto'},
  {key:'ivory',     hex:'#f0ebde'},
  {key:'gold',      hex:'#e8b14a'},
  {key:'crimsonNum',hex:'#e34232'},
  {key:'inkNum',    hex:'#0e0c08'},
];
const TABLE_OPTIONS = [
  {key:'forest',color:'#0d1614',accent:'#ffc97a'},
  {key:'ink',   color:'#0a0d14',accent:'#9bb3e6'},
  {key:'wine',  color:'#1a0c0e',accent:'#ffb37a'},
  {key:'sand',  color:'#2a241c',accent:'#ffd9a0'},
];
const THROW_STRENGTH_BASE = 1.4;
const THROW_STRENGTH_MAX  = 4.5;  // super throw
const SUPER_THROW_TIME    = 2500; // ms
const GRAVITY = 40;
const NUMBER_SIZE = 0.5;

// ─── Storage ───────────────────────────────────────────────────────────────
const PREFS_KEY   = 'dados_prefs_v2';
const PRESETS_KEY = 'dados_presets_v1';
const lsGet = (k,fb) => { try { const s=localStorage.getItem(k); return s?JSON.parse(s):fb; } catch{return fb;} };
const lsSet = (k,v)  => { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} };

// ─── DieIcon (top-bar / menu) ──────────────────────────────────────────────
function DieIcon({type,size=22,stroke='currentColor'}) {
  const s=size,c=s/2,r=s*0.38;
  const cm={fill:'none',stroke,strokeWidth:1.4,strokeLinejoin:'round',strokeLinecap:'round'};
  if(type==='d4'){const pts=[[c,c-r],[c+r*.866,c+r*.5],[c-r*.866,c+r*.5]];return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')}{...cm}/>{pts.map((p,i)=><line key={i}x1={p[0]}y1={p[1]}x2={c}y2={c+r*.12}{...cm}/>)}</svg>;}
  if(type==='d6')return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><path d={`M${c-r*.9} ${c-r*.5} L${c} ${c-r} L${c+r*.9} ${c-r*.5} L${c+r*.9} ${c+r*.5} L${c} ${c+r} L${c-r*.9} ${c+r*.5} Z`}{...cm}/><line x1={c}y1={c-r}x2={c}y2={c+r}{...cm}/><line x1={c-r*.9}y1={c-r*.5}x2={c}y2={c}{...cm}/><line x1={c+r*.9}y1={c-r*.5}x2={c}y2={c}{...cm}/><line x1={c-r*.9}y1={c+r*.5}x2={c}y2={c}{...cm}/><line x1={c+r*.9}y1={c+r*.5}x2={c}y2={c}{...cm}/></svg>;
  if(type==='d8')return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><polygon points={`${c},${c-r} ${c+r*.9},${c} ${c},${c+r} ${c-r*.9},${c}`}{...cm}/><line x1={c}y1={c-r}x2={c}y2={c+r}{...cm}/><line x1={c-r*.9}y1={c}x2={c+r*.9}y2={c}{...cm}/></svg>;
  if(type==='d10'||type==='d100')return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><polygon points={`${c},${c-r} ${c+r*.85},${c-r*.1} ${c+r*.55},${c+r*.55} ${c-r*.55},${c+r*.55} ${c-r*.85},${c-r*.1}`}{...cm}/><line x1={c}y1={c-r}x2={c}y2={c+r*.55}{...cm}/></svg>;
  if(type==='d12'){const pts=Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return[c+r*Math.cos(a),c+r*Math.sin(a)];});return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')}{...cm}/>{pts.map((p,i)=><line key={i}x1={p[0]}y1={p[1]}x2={c}y2={c}{...cm}/>)}</svg>;}
  const pts=Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return[c+r*Math.cos(a),c+r*Math.sin(a)];});
  return<svg width={s}height={s}viewBox={`0 0 ${s} ${s}`}><polygon points={pts.map(p=>p.join(',')).join(' ')}{...cm}/><polygon points={`${pts[0][0]},${pts[0][1]} ${pts[2][0]},${pts[2][1]} ${pts[4][0]},${pts[4][1]}`}{...cm}/><polygon points={`${pts[1][0]},${pts[1][1]} ${pts[3][0]},${pts[3][1]} ${pts[5][0]},${pts[5][1]}`}{...cm}/></svg>;
}

function notation(set) {
  return DICE_TYPES.filter(t=>set[t.key]>0).map(t=>`${set[t.key]}${t.key}`).join(' + ') || '—';
}

// ─── Charge button with super-throw ───────────────────────────────────────
function ChargeButton({onRoll,disabled,rolling,t}) {
  const [charge,setCharge]=useState(0);
  const [pressed,setPressed]=useState(false);
  const [isSuper,setIsSuper]=useState(false);
  const [showTooltip,setShowTooltip]=useState(false);
  const iv=useRef(null),cr=useRef(0),pressStart=useRef(0),superFired=useRef(false);

  const start=useCallback((e)=>{
    if(disabled||rolling)return;e.preventDefault();
    setPressed(true);setIsSuper(false);superFired.current=false;
    cr.current=0;setCharge(0);pressStart.current=Date.now();
    iv.current=setInterval(()=>{
      const elapsed=Date.now()-pressStart.current;
      const pct=Math.min(1, elapsed/SUPER_THROW_TIME);
      cr.current=pct;setCharge(pct);
      if(elapsed>=SUPER_THROW_TIME&&!superFired.current){
        setIsSuper(true);
      }
    },30);
  },[disabled,rolling]);

  const release=useCallback((e)=>{
    if(!pressed)return;e.preventDefault();
    clearInterval(iv.current);setPressed(false);setIsSuper(false);
    const c=cr.current;const elapsed=Date.now()-pressStart.current;
    setCharge(0);cr.current=0;
    if(!disabled&&!rolling){
      let strength;
      if(elapsed>=SUPER_THROW_TIME){
        strength=THROW_STRENGTH_MAX;
      } else {
        strength=THROW_STRENGTH_BASE*(0.5+c*1.2);
      }
      // Show tooltip if rolled at minimum (very quick tap)
      if(elapsed<200) setShowTooltip(true);
      onRoll(strength);
    }
  },[pressed,disabled,rolling,onRoll]);

  useEffect(()=>{
    if(showTooltip){const t=setTimeout(()=>setShowTooltip(false),2800);return()=>clearTimeout(t);}
  },[showTooltip]);

  useEffect(()=>()=>clearInterval(iv.current),[]);
  const circ=2*Math.PI*22;
  const ringColor=isSuper?'#ff6b20':charge>0.8?'#ffcf00':'var(--accent)';

  return(
    <div style={{position:'relative'}}>
      {showTooltip&&(
        <div className="throw-tooltip">{t.holdToThrow}</div>
      )}
      {isSuper&&(
        <div className="super-throw-label">{t.superThrow}</div>
      )}
      <button className={`roll-btn${rolling?' rolling':''}${disabled?' disabled':''}${pressed?' charging':''}${isSuper?' super':''}`}
        onMouseDown={start}onMouseUp={release}onMouseLeave={release}onTouchStart={start}onTouchEnd={release}
        disabled={disabled&&!rolling}>
        {charge>0.02&&<svg className="charge-ring" width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(232,177,74,0.15)" strokeWidth="3"/>
          <circle cx="27" cy="27" r="22" fill="none" stroke={ringColor} strokeWidth={isSuper?4:3}
            strokeDasharray={circ} strokeDashoffset={circ*(1-charge)} strokeLinecap="round" transform="rotate(-90 27 27)"
            style={{transition:'stroke-dashoffset 0.03s linear, stroke 0.15s'}}/>
        </svg>}
        <span className="roll-label">{rolling?t.rolling:isSuper?'⚡':pressed&&charge>0.1?'⚡':t.roll}</span>
        {!rolling&&!pressed&&<span className="roll-hint"/>}
      </button>
    </div>
  );
}

// ─── Farkle die face (wooden dots) ────────────────────────────────────────
const DOTS = {
  1:[[50,50]],
  2:[[30,30],[70,70]],
  3:[[30,30],[50,50],[70,70]],
  4:[[30,30],[70,30],[30,70],[70,70]],
  5:[[30,30],[70,30],[50,50],[30,70],[70,70]],
  6:[[30,24],[70,24],[30,50],[70,50],[30,76],[70,76]],
};

// Wood grain SVG pattern helper
function WoodDieBackground({size, selected, kept}) {
  const rx=Math.round(size*0.18);
  // Warm wood colors
  const bg=kept?'#4a2c12':'#7a4520';
  const grain1=kept?'#3d2410':'#6b3a1a';
  const grain2=kept?'#562e15':'#8c5028';
  const border=kept?'#2a1808':selected?'#e8b14a':'#5a3218';
  const bw=selected?3:1.5;
  const w=size, h=size;
  return(
    <svg width={w} height={h} viewBox="0 0 100 100" style={{position:'absolute',top:0,left:0}}>
      <defs>
        <filter id={`wood-shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="1" dy="2"/>
          <feComposite in2="SourceGraphic" operator="over"/>
        </filter>
      </defs>
      {/* Base */}
      <rect x="3" y="3" width="94" height="94" rx={rx} ry={rx}
        fill={bg} stroke={border} strokeWidth={bw}/>
      {/* Wood grain lines */}
      <line x1="15" y1="3" x2="10" y2="97" stroke={grain1} strokeWidth="2.5" opacity="0.5"/>
      <line x1="30" y1="3" x2="28" y2="97" stroke={grain2} strokeWidth="1.5" opacity="0.35"/>
      <line x1="52" y1="3" x2="50" y2="97" stroke={grain1} strokeWidth="2" opacity="0.4"/>
      <line x1="70" y1="3" x2="68" y2="97" stroke={grain2} strokeWidth="1.5" opacity="0.3"/>
      <line x1="85" y1="3" x2="88" y2="97" stroke={grain1} strokeWidth="2" opacity="0.4"/>
      {/* Top sheen */}
      <rect x="3" y="3" width="94" height="28" rx={rx} ry={rx}
        fill="rgba(255,220,160,0.08)"/>
      {/* Selection glow */}
      {selected&&<rect x="3" y="3" width="94" height="94" rx={rx} ry={rx}
        fill="none" stroke="rgba(232,177,74,0.4)" strokeWidth="6"/>}
    </svg>
  );
}

function DieFace({value,size=56,selected,kept,scorable,onClick}) {
  const dots=DOTS[value]||DOTS[1];
  const dr=Math.round(size*0.1);
  const dotColor='#1a0e06';
  const glow=selected?'drop-shadow(0 0 10px rgba(232,177,74,0.7))':'none';

  return(
    <button
      className={`fdie${selected?' fdie-sel':''}${kept?' fdie-kept':''}${scorable&&!kept?' fdie-scorable':''}`}
      style={{width:size,height:size,padding:0,background:'none',border:'none',
              cursor:kept?'default':'pointer',position:'relative',
              filter:glow,transition:'transform 150ms cubic-bezier(0.34,1.56,0.64,1), filter 120ms'}}
      onClick={onClick} disabled={kept}>
      <WoodDieBackground size={size} selected={selected} kept={kept}/>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{position:'absolute',top:0,left:0}}>
        {dots.map(([cx,cy],i)=>(
          <g key={i}>
            {/* Pip depth shadow */}
            <circle cx={cx+1} cy={cy+2} r={dr} fill="rgba(0,0,0,0.5)"/>
            {/* Pip inset */}
            <circle cx={cx} cy={cy} r={dr} fill={dotColor}/>
            {/* Pip inner highlight */}
            <circle cx={cx-1} cy={cy-1} r={dr*0.35} fill="rgba(255,255,255,0.12)"/>
          </g>
        ))}
      </svg>
    </button>
  );
}

// ─── Farkle Setup Screen ───────────────────────────────────────────────────
const FARKLE_COLORS = [
  {key:'obsidian',label:'⬛',swatch:'#16161a'},
  {key:'bone',    label:'⬜',swatch:'#ece3cf'},
  {key:'emerald', label:'🟩',swatch:'#0f4435'},
  {key:'royal',   label:'🟦',swatch:'#1a2b5a'},
  {key:'crimson', label:'🟥',swatch:'#5c1216'},
  {key:'gold',    label:'🟨',swatch:'#a9853a'},
  {key:'amethyst',label:'🟪',swatch:'#3a1f5a'},
];

function FarkleSetup({t, onStart, onBack, globalColor}) {
  const [target,   setTarget]    = useState(5000);
  const [useEntry, setUseEntry]  = useState(false);  // default: no entry
  const [showRules,setShowRules] = useState(false);
  const [p1Color,  setP1Color]   = useState(globalColor || 'obsidian');
  const [p2Color,  setP2Color]   = useState('crimson');

  return(
    <div className="farkle-setup-overlay">
      <div className="farkle-setup-card medieval-card">
        {/* Decorative medieval header */}
        <div className="medieval-ornament">⚜</div>
        <div className="farkle-title medieval-title">{t.farkle}</div>
        <div className="medieval-sub-label">✦ TABERNA REGIS ✦</div>

        <div className="fsetup-section">
          <div className="menu-title medieval-label">{t.farkleTarget}</div>
          <div className="mat-row">
            {t.farkleTargetVals.map((v,i)=>(
              <button key={v} className={`mat-pill medieval-pill${target===v?' sel':''}`} onClick={()=>setTarget(v)}>
                {t.farkleTargetOpts[i]}
              </button>
            ))}
          </div>
        </div>

        <div className="fsetup-section">
          <div className="menu-title medieval-label">{t.farkleEntry}</div>
          <div className="mat-row">
            <button className={`mat-pill medieval-pill${useEntry?' sel':''}`}  onClick={()=>setUseEntry(true)}>
              {t.farkleEntryOn}
            </button>
            <button className={`mat-pill medieval-pill${!useEntry?' sel':''}`} onClick={()=>setUseEntry(false)}>
              {t.farkleEntryOff}
            </button>
          </div>
        </div>

        <div className="fsetup-section">
          <div className="menu-title medieval-label">{t.farkleP1} — {t.diceColor}</div>
          <div className="farkle-color-row">
            {FARKLE_COLORS.map(c=>(
              <button key={c.key}
                className={`farkle-color-swatch${p1Color===c.key?' sel':''}`}
                style={{background:c.swatch}}
                onClick={()=>setP1Color(c.key)}
                title={c.key}
              />
            ))}
          </div>
        </div>

        <div className="fsetup-section">
          <div className="menu-title medieval-label">{t.farkleP2} — {t.diceColor}</div>
          <div className="farkle-color-row">
            {FARKLE_COLORS.map(c=>(
              <button key={c.key}
                className={`farkle-color-swatch${p2Color===c.key?' sel':''}`}
                style={{background:c.swatch}}
                onClick={()=>setP2Color(c.key)}
                title={c.key}
              />
            ))}
          </div>
        </div>

        <button className="farkle-btn-main medieval-btn" onClick={()=>onStart('ai', target, useEntry, p1Color, 'crimson')}>{t.farkleVsAI}</button>
        <button className="farkle-btn-main medieval-btn" style={{marginTop:6}} onClick={()=>onStart('2p', target, useEntry, p1Color, p2Color)}>{t.farkleTwoPlayer}</button>
        <button className="farkle-btn-sec medieval-btn-sec"  style={{marginTop:4}} onClick={()=>setShowRules(s=>!s)}>{t.farkleRules}</button>

        {showRules&&(
          <div className="farkle-rules medieval-rules">
            {t.farkleRulesText.map((r,i)=>(
              r===''
                ? <div key={i} style={{height:6}}/>
                : r.startsWith('—')
                  ? <div key={i} className="farkle-rule-section">{r}</div>
                  : <div key={i} className="farkle-rule-item">{r}</div>
            ))}
          </div>
        )}

        <button className="farkle-btn-back" onClick={onBack}>{t.farkleBack}</button>
      </div>
    </div>
  );
}

// ─── Farkle HUD ────────────────────────────────────────────────────────────
function FarkleHUD({t, engineRef, mode, target, useEntry, p1Color, p2Color, onExitToSetup}) {
  const gs = useRef({
    scores:   [0,0],
    onBoard:  [false,false],
    currentP: 0,
    turnScore:0,
    keptVals: [],
    rollVals: [],
    selectedIdx: [],
    phase: 'idle',
    winner: null,
    message: '',
    hotDice: false,
  });
  const [tick, setTick] = useState(0);
  const rerender = () => setTick(n => n+1);

  const idCtr = useRef(0);
  const mkId  = () => ++idCtr.current;

  function set(patch) {
    Object.assign(gs.current, patch);
    rerender();
  }

  useEffect(() => {
    if (!engineRef.current) return;
    const prev = engineRef.current.onSettled;
    engineRef.current.onSettled = (results) => {
      const phase = gs.current.phase;
      if (phase !== 'rolling' && phase !== 'ai_rolling') return;
      const vals = results.filter(r=>r.type==='d6').map(r=>r.value);
      if (vals.length === 0) return;
      onSettled(vals);
    };
    return () => { if (engineRef.current) engineRef.current.onSettled = prev||null; };
  });

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setOptions({ pipMode: true, materialKind: 'wood', colorPreset: 'wood', cameraLocked: false });
    }
    doRoll(6);
  }, []);

  function applyPlayerColor(playerIdx) {
    if (!engineRef.current) return;
    const preset = (playerIdx === 1 && p2Color) ? p2Color : (p1Color || 'obsidian');
    engineRef.current.setOptions({ colorPreset: preset, pipMode: true, materialKind: 'wood' });
  }

  function doRoll(count) {
    if (!engineRef.current) return;
    applyPlayerColor(gs.current.currentP);
    set({ phase:'rolling', message:'', selectedIdx:[], rollVals:[] });
    engineRef.current.setDiceSet([{type:'d6',count}]);
    setTimeout(() => { if (engineRef.current) engineRef.current.roll(1.3); }, 120);
  }

  function onSettled(vals) {
    if (gs.current.phase === 'ai_rolling') {
      onSettledAI(vals);
      return;
    }
    if (gs.current.phase !== 'rolling') return;
    if (isFarkle(vals)) {
      if (engineRef.current) engineRef.current.getSoundSystem().playFarkle();
      set({ rollVals:vals, selectedIdx:[], phase:'farkle_anim',
            message: t.farkleFarkle });
      setTimeout(() => {
        doEndTurn(0);
      }, 2000);
    } else {
      set({ rollVals:vals, selectedIdx:[], phase:'select', message:'' });
    }
  }

  // Only allow selecting dice that can score — prevent discarding non-scoring dice
  function toggleDie(idx) {
    if (gs.current.phase !== 'select') return;
    const prev    = gs.current.selectedIdx;
    const allVals = gs.current.rollVals;
    const scorable = scoringDieIndices(allVals);
    if (!scorable.has(idx)) return; // die can never score — cannot select
    let next;
    if (prev.includes(idx)) {
      next = prev.filter(i => i !== idx);
    } else {
      next = [...prev, idx];
    }
    // Validate: the new selection must score > 0
    const newSelVals = next.map(i => allVals[i]);
    if (next.length > 0 && calcFarkleScore(newSelVals) === 0) return; // invalid combo
    set({ selectedIdx: next });
  }

  function keepAndRoll() {
    const {rollVals, selectedIdx, keptVals, turnScore} = gs.current;
    const selVals = selectedIdx.map(i => rollVals[i]);
    const pts = calcFarkleScore(selVals);
    if (pts === 0) return;
    if (engineRef.current) engineRef.current.getSoundSystem().playScore();

    const newKept   = [...keptVals, ...selVals];
    const newTscore = turnScore + pts;
    const remaining = rollVals.length - selectedIdx.length;
    const hot       = remaining === 0;

    if (hot) {
      set({ keptVals:[], turnScore:newTscore, message:t.farkleHot, phase:'rolling', selectedIdx:[] });
      setTimeout(() => doRoll(6), 700);
    } else {
      set({ keptVals:newKept, turnScore:newTscore, phase:'rolling', selectedIdx:[] });
      doRoll(remaining);
    }
  }

  function bank() {
    const {rollVals, selectedIdx, keptVals, turnScore} = gs.current;
    const selVals    = selectedIdx.map(i => rollVals[i]);
    const pts        = calcFarkleScore(selVals);
    const finalScore = turnScore + pts;
    if (engineRef.current) engineRef.current.getSoundSystem().playScore();
    doEndTurn(finalScore);
  }

  function doEndTurn(finalScore) {
    const {scores, onBoard, currentP} = gs.current;
    const newOnBoard = [...onBoard];
    const newScores  = [...scores];

    const qualifies = !useEntry || finalScore >= 500;
    if (qualifies) {
      if (!newOnBoard[currentP]) newOnBoard[currentP] = true;
      newScores[currentP] += finalScore;
    }

    const won = newScores[currentP] >= target ? currentP : null;

    if (won !== null) {
      const msg = mode==='ai'
        ? (won===0 ? t.farkleWin : t.farkleAIWin)
        : (won===0 ? t.farkleP1Win : t.farkleP2Win);
      set({ scores:newScores, onBoard:newOnBoard, winner:won, phase:'end', message:msg,
            keptVals:[], rollVals:[], selectedIdx:[], turnScore:0 });
      return;
    }

    const next = (currentP+1) % 2;

    if (mode === '2p') {
      set({ scores:newScores, onBoard:newOnBoard, currentP:next,
            keptVals:[], rollVals:[], selectedIdx:[], turnScore:0, phase:'passing', message:'' });
    } else {
      set({ scores:newScores, onBoard:newOnBoard, currentP:next,
            keptVals:[], rollVals:[], selectedIdx:[], turnScore:0, phase:'ai_thinking', message:'' });
      if (next === 1) {
        setTimeout(() => runAI(newScores, newOnBoard, 0, []), 600);
      } else {
        doRoll(6);
      }
    }
  }

  function confirmPass() {
    doRoll(6);
  }

  function runAI(curScores, curOnBoard, aiTurnScore, prevKept) {
    if (gs.current.winner !== null) return;
    const rollCount = prevKept.length === 0 ? 6 : (6 - prevKept.length) || 6;
    set({
      keptVals: prevKept,
      turnScore: aiTurnScore,
      rollVals: [],
      selectedIdx: [],
      phase: 'ai_rolling',
      aiCtx: { curScores, curOnBoard, aiTurnScore, prevKept },
    });
    if (engineRef.current) {
      applyPlayerColor(1);
      engineRef.current.setDiceSet([{type:'d6', count:rollCount}]);
      setTimeout(() => { if (engineRef.current) engineRef.current.roll(1.3); }, 120);
    }
  }

  function onSettledAI(vals) {
    const { curScores, curOnBoard, aiTurnScore, prevKept } = gs.current.aiCtx || {};
    if (!curScores) return;
    if (isFarkle(vals)) {
      if (engineRef.current) engineRef.current.getSoundSystem().playFarkle();
      set({ rollVals:vals, keptVals:prevKept, phase:'farkle_anim',
            message:t.farkleFarkle, selectedIdx:[] });
      setTimeout(() => doEndTurn(0), 2000);
      return;
    }

    const {indices, score} = bestKeepIndices(vals);
    const newTurnScore = aiTurnScore + score;
    const newKept = [...prevKept, ...indices.map(i=>vals[i])];
    const hot = newKept.length >= 6;
    const remaining = hot ? 6 : vals.length - indices.length;

    set({ rollVals:vals, selectedIdx:indices, keptVals:prevKept,
          turnScore:aiTurnScore, phase:'ai_thinking', message:'' });

    setTimeout(() => {
      const shouldBank = aiShouldBank(newTurnScore, remaining, curScores[1], target);
      if (shouldBank) {
        set({ keptVals:newKept, turnScore:newTurnScore, selectedIdx:[] });
        setTimeout(() => doEndTurn(newTurnScore), 500);
      } else {
        if (hot) {
          set({ keptVals:[], turnScore:newTurnScore, message:t.farkleHot, selectedIdx:[] });
          setTimeout(() => runAI(curScores, curOnBoard, newTurnScore, []), 700);
        } else {
          set({ keptVals:newKept, turnScore:newTurnScore, selectedIdx:[] });
          setTimeout(() => runAI(curScores, curOnBoard, newTurnScore, newKept), 700);
        }
      }
    }, 1000);
  }

  const {scores,onBoard,currentP,turnScore,keptVals,rollVals,selectedIdx,phase,winner,message} = gs.current;

  const isHuman     = !(mode==='ai' && currentP===1);
  const canInteract = phase==='select' && isHuman;

  const selVals   = selectedIdx.map(i => rollVals[i]);
  const selScore  = calcFarkleScore(selVals);
  const canBank   = (turnScore + selScore) > 0 && selectedIdx.length > 0;
  const canReroll = selScore > 0 && selectedIdx.length > 0;

  const scorableSet = canInteract ? scoringDieIndices(rollVals) : new Set();
  const p0Name = mode==='ai' ? t.farkleYou : t.farkleP1;
  const p1Name = mode==='ai' ? t.farkleAI  : t.farkleP2;

  const notOnBoard = useEntry && onBoard[currentP]===false && (turnScore+selScore) > 0 && (turnScore+selScore) < 500;

  const rotateHUD = mode==='2p' && currentP===1 && phase!=='passing';

  return (
    <div className="fhud-root" style={rotateHUD?{transform:'rotate(180deg)'}:{}}>

      {/* TOP STRIP: scores — medieval style */}
      <div className="fhud-top medieval-hud-top">
        <div className={`fhud-player${currentP===0?' fhud-active':''}`}>
          <span className="fhud-pname">{p0Name}</span>
          <span className="fhud-pscore">{scores[0]}</span>
          {useEntry&&!onBoard[0]&&<span className="fhud-entry">–</span>}
        </div>
        <div className="fhud-mid">
          <div className="medieval-sword">⚔</div>
          <span className="fhud-target">{target.toLocaleString()}</span>
        </div>
        <div className={`fhud-player${currentP===1?' fhud-active':''}`}>
          <span className="fhud-pname">{p1Name}</span>
          <span className="fhud-pscore">{scores[1]}</span>
          {useEntry&&!onBoard[1]&&<span className="fhud-entry">–</span>}
        </div>
      </div>

      {/* BOTTOM PANEL — medieval */}
      <div className="fhud-bottom medieval-hud-bottom">

        <div className="fhud-info-row">
          <div className="fhud-kept">
            {keptVals.map((v,i)=>(
              <DieFace key={i} value={v} size={36} kept />
            ))}
          </div>
          <div className="fhud-turn-score">
            <span className="fhud-ts-label">{t.farkleCurrent}</span>
            <span className="fhud-ts-val">{turnScore + selScore}</span>
          </div>
        </div>

        {rollVals.length > 0 && (
          <div className="fhud-dice-row">
            {rollVals.map((val,i) => (
              <DieFace
                key={i}
                value={val}
                size={52}
                selected={selectedIdx.includes(i)}
                scorable={scorableSet.has(i)}
                onClick={() => canInteract ? toggleDie(i) : null}
              />
            ))}
          </div>
        )}

        {phase==='rolling' && rollVals.length===0 && (
          <div className="fhud-rolling-row">
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="fhud-rolling-die" style={{animationDelay:`${i*70}ms`}}>
                <svg width="44" height="44" viewBox="0 0 100 100">
                  <rect x="3" y="3" width="94" height="94" rx="15" fill="#7a4520" stroke="#5a3218" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="8" fill="#1a0e06" opacity="0.3"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className={`fhud-message medieval-message${phase==='farkle_anim'?' fhud-farkle-msg':''}`}>
            {message}
            {phase==='farkle_anim'&&<div className="fhud-farkle-detail">{t.farkleFarkleDetail}</div>}
          </div>
        )}

        {canInteract && !message && rollVals.length > 0 && (
          <div className="fhud-hint medieval-hint">{t.farkleSelectDice}</div>
        )}
        {notOnBoard && canInteract && (
          <div className="fhud-warn">{t.farkleNotOnBoard}</div>
        )}
        {phase==='ai_thinking' && !message && (
          <div className="fhud-hint medieval-hint">{t.farkleThinking}</div>
        )}

        <div className="fhud-actions">
          {canInteract && (
            <>
              {selectedIdx.length===0 && phase==='select' && (
                <div className="fhud-hint medieval-hint" style={{textAlign:'center',padding:'6px 0'}}>{t.farkleSelectDice}</div>
              )}
              {canReroll && (
                <button className="farkle-btn-main medieval-btn" onClick={keepAndRoll}>
                  {t.farkleKeepRoll} <span style={{opacity:0.7,fontSize:'0.8em'}}>(+{selScore})</span>
                </button>
              )}
              {canBank && (
                <button className="farkle-btn-sec medieval-btn-sec" onClick={bank}>
                  {t.farkleBank} ({turnScore+selScore})
                </button>
              )}
            </>
          )}

          {phase==='passing' && (
            <div className="fhud-passing medieval-passing">
              <div className="fhud-passing-title">{t.farkleP2Pass}</div>
              <button className="farkle-btn-main medieval-btn" onClick={confirmPass}>{t.farklePassBtn}</button>
            </div>
          )}

          {phase==='end' && (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div className="fhud-message medieval-message" style={{fontSize:22}}>{message}</div>
              <button className="farkle-btn-main medieval-btn" onClick={onExitToSetup}>{t.farkleNewGame}</button>
            </div>
          )}
        </div>

        <button className="farkle-btn-back" style={{marginTop:4}} onClick={onExitToSetup}>{t.farkleBack}</button>
      </div>
    </div>
  );
}

// ─── Farkle container ──────────────────────────────────────────────────────
function FarkleContainer({t, engineRef, onClose, globalColor}) {
  const [gameConfig, setGameConfig] = useState(null);
  const [gameKey,    setGameKey]    = useState(0);

  function handleStart(mode, target, useEntry, p1Color, p2Color) {
    if (!engineRef.current) return;
    engineRef.current.setOptions({ colorPreset: p1Color || 'obsidian', pipMode: true, materialKind: 'wood', cameraLocked: false });
    engineRef.current.setDiceSet([{type:'d6',count:6}]);
    setGameConfig({mode, target, useEntry, p1Color, p2Color});
    setGameKey(k => k+1);
  }

  function handleExitToSetup() {
    if (engineRef.current) engineRef.current.setOptions({ pipMode: false, materialKind: 'glossy', cameraLocked: false });
    setGameConfig(null);
  }

  if (!gameConfig) {
    return <FarkleSetup t={t} onStart={handleStart} onBack={onClose} globalColor={globalColor}/>;
  }

  return (
    <FarkleHUD
      key={gameKey}
      t={t}
      engineRef={engineRef}
      mode={gameConfig.mode}
      target={gameConfig.target}
      useEntry={gameConfig.useEntry}
      p1Color={gameConfig.p1Color}
      p2Color={gameConfig.p2Color}
      onExitToSetup={handleExitToSetup}
    />
  );
}

// ─── Home Menu ────────────────────────────────────────────────────────────
function HomeMenu({t, onSelectSimulator, onSelectFarkle}) {
  return (
    <div className="home-overlay">
      <div className="home-content">
        {/* Logo */}
        <div className="home-logo">
          <div className="home-logo-die">
            <DieIcon type="d20" size={56} stroke="#e8b14a"/>
          </div>
        </div>
        <div className="home-title">{t.homeTitle}</div>
        <div className="home-sub">{t.homeSub}</div>

        {/* Decorative divider */}
        <div className="home-divider">
          <span>✦</span>
        </div>

        {/* Mode buttons */}
        <div className="home-buttons">
          <button className="home-btn home-btn-primary" onClick={onSelectSimulator}>
            <div className="home-btn-icon">
              <DieIcon type="d20" size={28} stroke="#e8b14a"/>
            </div>
            <div className="home-btn-text">
              <div className="home-btn-title">{t.homePlay}</div>
              <div className="home-btn-desc">{t.homeDesc}</div>
            </div>
          </button>

          <button className="home-btn home-btn-farkle" onClick={onSelectFarkle}>
            <div className="home-btn-icon">
              <DieIcon type="d6" size={28} stroke="#c8a04a"/>
            </div>
            <div className="home-btn-text">
              <div className="home-btn-title">{t.homeFarkle}</div>
              <div className="home-btn-desc">{t.homeFarkleDesc}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const engineRef    = useRef(null);
  const menuRef      = useRef(null);
  const hamburgerRef = useRef(null);

  const [lang, setLang] = useState(() => lsGet(PREFS_KEY,null)?.lang || detectLang());
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const sp = lsGet(PREFS_KEY,{});
  const [color,        setColor]        = useState(sp.color        ||'obsidian');
  const [customColor,  setCustomColor]  = useState(sp.customColor  ||'#5a87c2');
  const [material,     setMaterial]     = useState(sp.material     ||'glossy');
  const [numFont,      setNumFont]      = useState(sp.numFont      ||'mono');
  const [numColor,     setNumColor]     = useState(sp.numColor     ||'auto');
  const [tableKey,     setTableKey]     = useState(sp.tableKey     ||'forest');
  const [tableSize,    setTableSize]    = useState(sp.tableSize    ||8.5);
  const [soundEnabled, setSoundEnabled] = useState(sp.soundEnabled!==false);
  const [soundVol,     setSoundVol]     = useState(sp.soundVol     ??0.7);
  const [invertCamX,   setInvertCamX]   = useState(sp.invertCamX  ||false);
  const [invertCamY,   setInvertCamY]   = useState(sp.invertCamY  !==false);
  const [camSens,      setCamSens]      = useState(sp.camSens      ??0.7);
  const [linkPct,      setLinkPct]      = useState(sp.linkPct      !==false);
  const [shakeToRoll,  setShakeToRoll]  = useState(sp.shakeToRoll  !==false);

  const [diceSet,     setDiceSet]     = useState({d4:0,d6:0,d8:0,d10:0,d12:0,d20:1,d100:0});
  const [results,     setResults]     = useState(null);
  const [rolling,     setRolling]     = useState(false);
  const [showHelp,    setShowHelp]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [shakeArmed,  setShakeArmed]  = useState(false);
  // screen: 'home' | 'simulator' | 'farkle'
  const [screen,      setScreen]      = useState('home');
  const [dicePresets, setDicePresets] = useState(()=>lsGet(PRESETS_KEY,[]));
  const [presetInput, setPresetInput] = useState('');
  const [showPInput,  setShowPInput]  = useState(false);
  const isTouch = useMemo(()=>'ontouchstart' in window||navigator.maxTouchPoints>0,[]);

  // Persist
  useEffect(()=>{
    lsSet(PREFS_KEY,{color,customColor,material,numFont,numColor,tableKey,tableSize,
      soundEnabled,soundVol,invertCamX,invertCamY,camSens,linkPct,shakeToRoll,lang});
  },[color,customColor,material,numFont,numColor,tableKey,tableSize,
     soundEnabled,soundVol,invertCamX,invertCamY,camSens,linkPct,shakeToRoll,lang]);

  // Init engine once
  useEffect(()=>{
    const tab=TABLE_OPTIONS.find(x=>x.key===tableKey)||TABLE_OPTIONS[0];
    const isAndroid=/android/i.test(navigator.userAgent);
    const eng=new window.DiceEngine(document.getElementById('scene-canvas'),{
      tableColor:tab.color,accentLight:tab.accent,
      colorPreset:color,materialKind:material,
      gravity:GRAVITY,numberSize:NUMBER_SIZE,
      soundEnabled,soundVolume:soundVol,
      invertCameraX:invertCamX,invertCameraY:invertCamY,cameraSensitivity:camSens,
      isAndroid,
    });
    eng.onSettled=(res)=>{ setRolling(false); setResults(res); };
    engineRef.current=eng;
  },[]);

  useEffect(()=>{ if(!engineRef.current)return; const l=DICE_TYPES.filter(x=>diceSet[x.key]>0).map(x=>({type:x.key,count:diceSet[x.key]})); engineRef.current.setDiceSet(l); setResults(null); },[diceSet]);
  useEffect(()=>{ if(!engineRef.current)return; const f=NUMBER_FONTS.find(f=>f.key===numFont)||NUMBER_FONTS[0]; const nc=NUMBER_COLOR_OPTIONS.find(x=>x.key===numColor)||NUMBER_COLOR_OPTIONS[0]; engineRef.current.setOptions({colorPreset:color,customColor,materialKind:material,numberFont:f.family,numberWeight:f.weight,numberColor:nc.hex,numberSize:NUMBER_SIZE}); },[color,customColor,material,numFont,numColor]);
  useEffect(()=>{ if(!engineRef.current)return; const tab=TABLE_OPTIONS.find(x=>x.key===tableKey)||TABLE_OPTIONS[0]; engineRef.current.setOptions({tableColor:tab.color,accentLight:tab.accent}); },[tableKey]);
  useEffect(()=>{ if(engineRef.current)engineRef.current.setTableSize(tableSize); },[tableSize]);
  useEffect(()=>{ if(engineRef.current)engineRef.current.setOptions({soundEnabled,soundVolume:soundVol}); },[soundEnabled,soundVol]);
  useEffect(()=>{ if(engineRef.current)engineRef.current.setOptions({invertCameraX:invertCamX,invertCameraY:invertCamY,cameraSensitivity:camSens}); },[invertCamX,invertCamY,camSens]);

  const roll=useCallback((strength=THROW_STRENGTH_BASE)=>{
    if(!engineRef.current)return;
    if(Object.values(diceSet).reduce((s,n)=>s+n,0)===0)return;
    setRolling(true);setResults(null);engineRef.current.roll(strength);
  },[diceSet]);

  const accelRef=useRef({prev:9.81});
  useEffect(()=>{
    if(!shakeArmed)return;
    let cd=false,tmr=null;
    function onM(e){
      const a=e.accelerationIncludingGravity;if(!a||!engineRef.current)return;
      const{x=0,y=0,z=0}=a,total=Math.hypot(x,y,z),delta=Math.abs(total-accelRef.current.prev);
      accelRef.current.prev=total;
      if(delta>8&&!cd&&!rolling){cd=true;roll(Math.min(2.5,THROW_STRENGTH_BASE+delta/8));setTimeout(()=>{cd=false;},1500);return;}
      engineRef.current.setGravityTilt(x,y,z,total);
      if(tmr)clearTimeout(tmr);
      tmr=setTimeout(()=>{if(engineRef.current)engineRef.current.resetGravity();},800);
    }
    window.addEventListener('devicemotion',onM);
    return()=>{window.removeEventListener('devicemotion',onM);if(tmr)clearTimeout(tmr);if(engineRef.current)engineRef.current.resetGravity();};
  },[shakeArmed,roll,rolling]);

  useEffect(()=>{
    function onK(e){
      if(e.code==='Space'&&!e.target.closest('input,textarea,select,button')){e.preventDefault();if(!rolling)roll();}
      else if(e.code==='Escape'){setMenuOpen(false);setShowHelp(false);}
    }
    window.addEventListener('keydown',onK);
    return()=>window.removeEventListener('keydown',onK);
  },[roll,rolling]);

  useEffect(()=>{
    if(!menuOpen)return;
    const h=(e)=>{if(menuRef.current?.contains(e.target)||hamburgerRef.current?.contains(e.target))return;setMenuOpen(false);};
    document.addEventListener('mousedown',h);document.addEventListener('touchstart',h);
    return()=>{document.removeEventListener('mousedown',h);document.removeEventListener('touchstart',h);};
  },[menuOpen]);

  const enableShake=async()=>{
    if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){
      try{const p=await DeviceMotionEvent.requestPermission();if(p==='granted')setShakeArmed(true);}catch{}
    }else setShakeArmed(true);
  };

  function adjust(type,delta){setDiceSet(p=>({...p,[type]:Math.max(0,Math.min(20,(p[type]||0)+delta))}));}
  function savePreset(){if(!presetInput.trim())return;const up=[...dicePresets,{name:presetInput.trim(),set:{...diceSet},id:Date.now()}];setDicePresets(up);lsSet(PRESETS_KEY,up);setPresetInput('');setShowPInput(false);}
  function delPreset(id){const up=dicePresets.filter(p=>p.id!==id);setDicePresets(up);lsSet(PRESETS_KEY,up);}

  function buildGroups(res){
    if(!res)return null;const out={pairs:[],dice:[]};
    if(!linkPct){out.dice=res.slice();return out;}
    const d100=res.filter(r=>r.type==='d100'),d10=res.filter(r=>r.type==='d10');
    const others=res.filter(r=>r.type!=='d100'&&r.type!=='d10');
    const n=Math.min(d100.length,d10.length);
    for(let i=0;i<n;i++){const ten=d100[i].value,u=d10[i].value;out.pairs.push({tens:ten,units:u,value:ten===0&&u===0?100:ten+u});}
    out.dice=others.concat(d100.slice(n)).concat(d10.slice(n));return out;
  }
  const grouped=buildGroups(results);
  const total=grouped?grouped.pairs.reduce((s,p)=>s+p.value,0)+grouped.dice.reduce((s,d)=>s+(d.value??0),0):null;
  const totalDice=Object.values(diceSet).reduce((s,n)=>s+n,0);

  function closeFarkle(){
    setScreen('home');
    if(engineRef.current){
      const font=NUMBER_FONTS.find(f=>f.key===numFont)||NUMBER_FONTS[0];
      const nc=NUMBER_COLOR_OPTIONS.find(x=>x.key===numColor)||NUMBER_COLOR_OPTIONS[0];
      engineRef.current.setOptions({
        colorPreset:color, customColor, pipMode:false, materialKind:material,
        numberFont:font.family, numberWeight:font.weight, numberColor:nc.hex,
        cameraLocked:false,
      });
    }
    const l=DICE_TYPES.filter(x=>diceSet[x.key]>0).map(x=>({type:x.key,count:diceSet[x.key]}));
    if(l.length>0&&engineRef.current)engineRef.current.setDiceSet(l);
    else if(engineRef.current)engineRef.current.setDiceSet([{type:'d20',count:1}]);
  }

  // ── Home screen ─────────────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <HomeMenu
        t={t}
        onSelectSimulator={() => setScreen('simulator')}
        onSelectFarkle={() => setScreen('farkle')}
      />
    );
  }

  // ── Farkle mode ──────────────────────────────────────────────────────────
  if (screen === 'farkle') {
    return (
      <FarkleContainer
        t={t}
        engineRef={engineRef}
        onClose={closeFarkle}
        globalColor={color}
      />
    );
  }

  // ── Normal simulator mode ──────────────────────────────────────────────
  return(
    <React.Fragment>
      {/* Top bar */}
      <div className="top-bar">
        <button ref={hamburgerRef} className={`hamburger${menuOpen?' open':''}`} onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
          <span/><span/><span/>
        </button>
        <div className="brand">
          <div className="brand-mark"><DieIcon type="d20" size={28} stroke="#e8b14a"/></div>
          <div className="brand-text">
            <div className="brand-title">{t.appName}</div>
            <div className="brand-sub">{t.appSub}</div>
          </div>
        </div>
        <button className="preset-pill" onClick={()=>setScreen('farkle')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="5" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="11" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="5" cy="11" r="1.2" fill="currentColor"/>
          </svg>
          {t.farkle}
        </button>
        <button className="preset-pill" style={{marginLeft:-4}} onClick={()=>setScreen('home')}>⌂</button>
        <button className="icon-btn" onClick={()=>setShowHelp(s=>!s)}>?</button>
      </div>

      {/* Menu */}
      {menuOpen&&(
        <div className="menu-dropdown entering" ref={menuRef}>
          <div className="menu-section">
            <div className="menu-title">{t.dice}</div>
            <div className="dice-grid-menu">
              {DICE_TYPES.map(dt=>{const cnt=diceSet[dt.key];return(
                <div key={dt.key} className={`die-row-menu${cnt>0?' active':''}`}>
                  <div className="die-info-menu"><DieIcon type={dt.key} size={20} stroke={cnt>0?'#e8b14a':'#7e7669'}/><span className="die-label-menu">{dt.key}</span></div>
                  <div className="die-counter">
                    <button className="cbtn" onClick={()=>adjust(dt.key,-1)} disabled={cnt===0}>−</button>
                    <div className="count">{cnt}</div>
                    <button className="cbtn" onClick={()=>adjust(dt.key,+1)}>+</button>
                  </div>
                </div>
              );})}
            </div>
          </div>
          <div className="menu-divider"/>
          <div className="menu-section">
            <div className="menu-title">{t.presets}</div>
            <div className="presets-list">
              {dicePresets.map(p=>(
                <div key={p.id} className="preset-row">
                  <button className="preset-load-btn" onClick={()=>{setDiceSet({...p.set});setMenuOpen(false);}}>{p.name}</button>
                  <button className="preset-del-btn" onClick={()=>delPreset(p.id)}>×</button>
                </div>
              ))}
            </div>
            {showPInput?(
              <div className="preset-input-row">
                <input className="preset-input" value={presetInput} onChange={e=>setPresetInput(e.target.value)}
                  placeholder={t.presetName} onKeyDown={e=>{if(e.key==='Enter')savePreset();if(e.key==='Escape')setShowPInput(false);}} autoFocus/>
                <button className="cbtn" onClick={savePreset} disabled={!presetInput.trim()}>✓</button>
                <button className="cbtn" onClick={()=>setShowPInput(false)}>×</button>
              </div>
            ):(
              <button className="preset-add-btn" onClick={()=>setShowPInput(true)}>+ {t.addPreset}</button>
            )}
          </div>
          <div className="menu-divider"/>
          <div className="menu-section">
            <div className="menu-title">{t.diceColor}</div>
            <div className="swatch-grid">
              {COLOR_OPTIONS.map(c=>(
                <button key={c.key} className={`swatch${color===c.key?' sel':''}`} onClick={()=>setColor(c.key)}>
                  <span className="swatch-disc" style={{background:c.swatch,borderColor:c.accent}}><span className="swatch-dot" style={{background:c.accent}}/></span>
                  <span className="swatch-label">{t[c.key]||c.key}</span>
                </button>
              ))}
              <label className={`swatch custom${color==='custom'?' sel':''}`}>
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
            <div className="mat-row">{MATERIAL_OPTIONS.map(m=><button key={m} className={`mat-pill${material===m?' sel':''}`} onClick={()=>setMaterial(m)}>{t[m]}</button>)}</div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.numberTypo}</div>
            <div className="num-row-grid">{NUMBER_FONTS.map(f=><button key={f.key} className={`num-font${numFont===f.key?' sel':''}`} onClick={()=>setNumFont(f.key)} style={{fontFamily:f.family,fontWeight:f.weight}}>20</button>)}</div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.numberColor}</div>
            <div className="num-row swatches">
              {NUMBER_COLOR_OPTIONS.map(c=>(
                <button key={c.key} className={`num-swatch${numColor===c.key?' sel':''}`} onClick={()=>setNumColor(c.key)}>
                  {c.hex==='auto'?<span className="auto-disc">A</span>:<span className="solid-disc" style={{background:c.hex}}/>}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.tableColor}</div>
            <div className="table-row">
              {TABLE_OPTIONS.map(tb=>(
                <button key={tb.key} className={`table-pill${tableKey===tb.key?' sel':''}`} onClick={()=>setTableKey(tb.key)}>
                  <span className="table-disc" style={{background:tb.color,boxShadow:`inset 0 0 14px ${tb.accent}66`}}/><span>{t[tb.key]}</span>
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
              <button className={`toggle-btn${soundEnabled?' on':''}`} onClick={()=>setSoundEnabled(v=>!v)}><span className="toggle-knob"/></button>
            </div>
            {soundEnabled&&<div className="num-row size" style={{marginTop:6}}>
              <span className="num-label">{t.soundVol}</span>
              <input type="range" min="0" max="1" step="0.05" value={soundVol} onChange={e=>setSoundVol(Number(e.target.value))} style={{flex:1}}/>
              <span className="num-value">{Math.round(soundVol*100)}%</span>
            </div>}
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.camera}</div>
            <div className="tweak-toggle-row"><span className="tweak-label">{t.invertH}</span><button className={`toggle-btn${invertCamX?' on':''}`} onClick={()=>setInvertCamX(v=>!v)}><span className="toggle-knob"/></button></div>
            <div className="tweak-toggle-row" style={{marginTop:6}}><span className="tweak-label">{t.invertV}</span><button className={`toggle-btn${invertCamY?' on':''}`} onClick={()=>setInvertCamY(v=>!v)}><span className="toggle-knob"/></button></div>
            <div className="num-row size" style={{marginTop:8}}>
              <span className="num-label">{t.sensitivity}</span>
              <input type="range" min="0.2" max="2" step="0.1" value={camSens} onChange={e=>setCamSens(Number(e.target.value))} style={{flex:1}}/>
              <span className="num-value">{camSens.toFixed(1)}×</span>
            </div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.rules}</div>
            <div className="tweak-toggle-row"><span className="tweak-label">{t.linkPercentile}</span><button className={`toggle-btn${linkPct?' on':''}`} onClick={()=>setLinkPct(v=>!v)}><span className="toggle-knob"/></button></div>
          </div>
          <div className="menu-section">
            <div className="menu-title">{t.language}</div>
            <div className="mat-row">
              {['es','en'].map(l=><button key={l} className={`mat-pill${lang===l?' sel':''}`} onClick={()=>setLang(l)}>{l==='es'?'🇪🇸 Español':'🇬🇧 English'}</button>)}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bottom-bar">
        <div className="notation-bubble">
          <span className="notation-label">{t.rollNotation}</span>
          <span className="notation">{notation(diceSet)}</span>
        </div>
        <ChargeButton onRoll={roll} disabled={totalDice===0} rolling={rolling} t={t}/>
        {shakeToRoll&&isTouch&&!shakeArmed&&<button className="shake-arm" onClick={enableShake}>{t.accelBtn}</button>}
        {shakeToRoll&&isTouch&&shakeArmed&&<div className="shake-active">{t.accelActive}</div>}
      </div>

      {/* Results panel */}
      {results&&grouped&&(
        <div className="results-panel">
          <div className="results-head">
            <span className="results-label">{grouped.pairs.length>0&&grouped.dice.length===0?t.percentage:t.result}</span>
            <span className="results-total">{total}</span>
          </div>
          {grouped.pairs.length>0&&<div className="results-list">{grouped.pairs.map((p,i)=>(
            <div key={'p'+i} className="result-chip pair">
              <span className="pair-badge">%</span><span className="result-type">d100+d10</span>
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
              {[...grouped.pairs.map(p=>p.value),...grouped.dice.map(d=>d.value)].join(' + ')} = <span>{total}</span>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      {showHelp&&(
        <div className="help-overlay" onClick={()=>setShowHelp(false)}>
          <div className="help-card" onClick={e=>e.stopPropagation()}>
            <div className="help-title">{t.howToRoll}</div>
            <ul>{t.helpItems.map((x,i)=><li key={i}>{x}</li>)}</ul>
            <button className="close" onClick={()=>setShowHelp(false)}>{t.understood}</button>
          </div>
        </div>
      )}

      <TweaksPanel title="Ajustes">
        <TweakSection label={t.rules}>
          <TweakToggle label={t.linkPercentile} value={linkPct} onChange={setLinkPct}/>
          <TweakToggle label={t.accel} value={shakeToRoll} onChange={setShakeToRoll}/>
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

const root=ReactDOM.createRoot(document.getElementById('ui-root'));
root.render(<App/>);
