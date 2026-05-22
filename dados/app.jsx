// app.jsx — Dados v3.0
// Farkle: canvas always visible during play, HUD overlay,
//         no-entry-score option, 2P rotation, bug-free state machine

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
      'Mantén el botón para cargar más fuerza al lanzar.',
      'Cámara: arrastra para rotar, rueda o pellizco para zoom, doble clic para reiniciar.',
      'Personaliza colores, materiales y números desde el menú ☰.',
    ],
    understood: 'Entendido',
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
    farkleTarget: 'Meta', farkleEntry: 'Entrada mínima',
    farkleEntryOn: 'Con entrada (500 pts mín.)', farkleEntryOff: 'Sin entrada',
    farkleTargetOpts: ['2.500', '5.000', '10.000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRules: 'Reglas',
    farkleRulesText: [
      '1 = 100 pts | 5 = 50 pts',
      'Trío de 1s = 1000 pts',
      'Trío de Xs = X×100 (2s=200…)',
      'Cuatro iguales = trío × 2',
      'Cinco iguales = trío × 4',
      'Seis iguales = trío × 8',
      'Escalera 1-2-3-4-5-6 = 1500 pts',
      'Tres pares = 1500 pts',
      'Farkle = 0 pts, pierdes turno',
      'Entrada: necesitas ≥500 en un turno',
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
      'Hold the button to charge more throwing power.',
      'Camera: drag to rotate, scroll or pinch to zoom, double-click to reset.',
      'Customize colors, materials and numbers from the ☰ menu.',
    ],
    understood: 'Got it',
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
    farkleEntryOn: 'With entry (min 500 pts)', farkleEntryOff: 'No entry',
    farkleTargetOpts: ['2,500', '5,000', '10,000'],
    farkleTargetVals: [2500, 5000, 10000],
    farkleRules: 'Rules',
    farkleRulesText: [
      '1 = 100 pts | 5 = 50 pts',
      'Three 1s = 1000 pts',
      'Three Xs = X×100 (2s=200…)',
      'Four of a kind = three × 2',
      'Five of a kind = three × 4',
      'Six of a kind = three × 8',
      'Straight 1-2-3-4-5-6 = 1500 pts',
      'Three pairs = 1500 pts',
      'Farkle = 0 pts, lose turn',
      'Entry: need ≥500 pts in one turn',
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
    if (cnt.slice(1).every(c => c === 1)) return 1500; // straight
    const nonZero = cnt.slice(1).filter(c => c > 0);
    if (nonZero.length === 3 && nonZero.every(c => c === 2)) return 1500; // 3 pairs
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
const THROW_STRENGTH_BASE = 1.15;
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

// ─── Charge button ─────────────────────────────────────────────────────────
function ChargeButton({onRoll,disabled,rolling,t}) {
  const [charge,setCharge]=useState(0);
  const [pressed,setPressed]=useState(false);
  const iv=useRef(null),cr=useRef(0);
  const start=useCallback((e)=>{
    if(disabled||rolling)return;e.preventDefault();
    setPressed(true);cr.current=0;setCharge(0);
    iv.current=setInterval(()=>{cr.current=Math.min(1,cr.current+0.025);setCharge(cr.current);},30);
  },[disabled,rolling]);
  const release=useCallback((e)=>{
    if(!pressed)return;e.preventDefault();
    clearInterval(iv.current);setPressed(false);
    const c=cr.current;setCharge(0);cr.current=0;
    if(!disabled&&!rolling)onRoll(THROW_STRENGTH_BASE*(0.6+c*0.8));
  },[pressed,disabled,rolling,onRoll]);
  useEffect(()=>()=>clearInterval(iv.current),[]);
  const circ=2*Math.PI*22;
  return(
    <button className={`roll-btn${rolling?' rolling':''}${disabled?' disabled':''}${pressed?' charging':''}`}
      onMouseDown={start}onMouseUp={release}onMouseLeave={release}onTouchStart={start}onTouchEnd={release}
      disabled={disabled&&!rolling}>
      {charge>0.02&&<svg className="charge-ring" width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(232,177,74,0.2)" strokeWidth="3"/>
        <circle cx="27" cy="27" r="22" fill="none" stroke="var(--accent)" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ*(1-charge)} strokeLinecap="round" transform="rotate(-90 27 27)"
          style={{transition:'stroke-dashoffset 0.03s linear'}}/>
      </svg>}
      <span className="roll-label">{rolling?t.rolling:pressed&&charge>0.1?'⚡':t.roll}</span>
      {!rolling&&!pressed&&<span className="roll-hint"/>}
    </button>
  );
}

// ─── Farkle die face (dots) ────────────────────────────────────────────────
const DOTS = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
};

function DieFace({value,size=56,selected,kept,scorable,onClick}) {
  const dots=DOTS[value]||DOTS[1];
  const rx=Math.round(size*0.15);
  const dr=Math.round(size*0.085);
  let bg=kept?'#111':'#1c1710';
  let border=kept?'#1e1e1e':selected?'#e8b14a':'#3a3025';
  let bw=selected?2.5:1.5;
  let dotColor=kept?'#2a2520':selected?'#e8b14a':'#cfc4ae';
  const glow=selected?'drop-shadow(0 0 8px rgba(232,177,74,0.6))':'none';

  return(
    <button
      className={`fdie${selected?' fdie-sel':''}${kept?' fdie-kept':''}${scorable&&!kept?' fdie-scorable':''}`}
      style={{width:size,height:size,padding:0,background:'none',border:'none',cursor:kept?'default':'pointer',
              filter:glow,transition:'transform 150ms cubic-bezier(0.34,1.56,0.64,1), filter 120ms'}}
      onClick={onClick} disabled={kept}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="3" y="3" width="94" height="94" rx={rx} ry={rx}
          fill={bg} stroke={border} strokeWidth={bw}/>
        {selected&&<rect x="3" y="3" width="94" height="94" rx={rx} ry={rx}
          fill="none" stroke="rgba(232,177,74,0.18)" strokeWidth="8"/>}
        {dots.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={dr} fill={dotColor}/>)}
      </svg>
    </button>
  );
}

// ─── Farkle Setup Screen ───────────────────────────────────────────────────
// Color options for Farkle die picker (subset, no 'custom')
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
  const [target,   setTarget]    = useState(10000);
  const [useEntry, setUseEntry]  = useState(true);
  const [showRules,setShowRules] = useState(false);
  const [p1Color,  setP1Color]   = useState(globalColor || 'obsidian');
  const [p2Color,  setP2Color]   = useState('crimson');
  const [show2PColors, setShow2PColors] = useState(false);

  return(
    <div className="farkle-setup-overlay">
      <div className="farkle-setup-card">
        <div className="farkle-title">{t.farkle}</div>
        <div className="farkle-kcd-label">KINGDOM COME DELIVERANCE</div>

        <div className="fsetup-section">
          <div className="menu-title">{t.farkleTarget}</div>
          <div className="mat-row">
            {t.farkleTargetVals.map((v,i)=>(
              <button key={v} className={`mat-pill${target===v?' sel':''}`} onClick={()=>setTarget(v)}>
                {t.farkleTargetOpts[i]}
              </button>
            ))}
          </div>
        </div>

        <div className="fsetup-section">
          <div className="menu-title">{t.farkleEntry}</div>
          <div className="mat-row">
            <button className={`mat-pill${useEntry?' sel':''}`}  onClick={()=>setUseEntry(true)}>
              {t.farkleEntryOn}
            </button>
            <button className={`mat-pill${!useEntry?' sel':''}`} onClick={()=>setUseEntry(false)}>
              {t.farkleEntryOff}
            </button>
          </div>
        </div>

        {/* P1 color picker (always shown) */}
        <div className="fsetup-section">
          <div className="menu-title">{t.farkleP1} — {t.diceColor}</div>
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

        {/* P2 color picker (only for 2P) */}
        <div className="fsetup-section">
          <div className="menu-title">{t.farkleP2} — {t.diceColor}</div>
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

        <button className="farkle-btn-main" onClick={()=>onStart('ai', target, useEntry, p1Color, 'crimson')}>{t.farkleVsAI}</button>
        <button className="farkle-btn-main" style={{marginTop:6}} onClick={()=>onStart('2p', target, useEntry, p1Color, p2Color)}>{t.farkleTwoPlayer}</button>
        <button className="farkle-btn-sec"  style={{marginTop:4}} onClick={()=>setShowRules(s=>!s)}>{t.farkleRules}</button>

        {showRules&&(
          <div className="farkle-rules">
            {t.farkleRulesText.map((r,i)=><div key={i} className="farkle-rule-item">{r}</div>)}
          </div>
        )}

        <button className="farkle-btn-back" onClick={onBack}>{t.farkleBack}</button>
      </div>
    </div>
  );
}

// ─── Farkle HUD (overlays the live canvas) ────────────────────────────────
//
// DESIGN: The 3D canvas is always fully visible.
// - Top HUD strip: scores (fixed, transparent backdrop)
// - Bottom HUD panel: dice selection + action buttons (transparent backdrop)
// - Setup / passing screens: full overlay only when no play happening
//
// STATE MACHINE (stored in a single ref to avoid stale closure bugs):
//   phase: 'idle'|'rolling'|'select'|'farkle_anim'|'passing'|'ai_thinking'|'end'
//   Each transition is driven by a central dispatch() function.
//
function FarkleHUD({t, engineRef, mode, target, useEntry, p1Color, p2Color, onExitToSetup}) {
  // p1Color / p2Color: color preset keys. p1Color defaults to the global engine preset.
  // ── game state (ref = no stale closures, re-render via forceUpdate) ──────
  const gs = useRef({
    scores:   [0,0],
    onBoard:  [false,false],
    currentP: 0,
    turnScore:0,
    keptVals: [],       // values locked this turn (sub-rolls)
    rollVals: [],       // values from the most recent roll (fresh dice only)
    selectedIdx: [],    // indices into rollVals that player has tapped
    phase: 'idle',      // see above
    winner: null,
    message: '',
    hotDice: false,
  });
  const [tick, setTick] = useState(0);
  const rerender = () => setTick(n => n+1);

  const idCtr = useRef(0);
  const mkId  = () => ++idCtr.current;

  // ── helpers ───────────────────────────────────────────────────────────────
  function set(patch) {
    Object.assign(gs.current, patch);
    rerender();
  }

  // ── engine wiring ─────────────────────────────────────────────────────────
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
  });   // intentionally no deps — we want the latest gs.current each time

  // ── kick-off first roll ───────────────────────────────────────────────────
  useEffect(() => {
    // Enable pip mode on engine for Farkle
    if (engineRef.current) engineRef.current.setOptions({ pipMode: true });
    doRoll(6);
  }, []);

  // ── per-player color ─────────────────────────────────────────────────────
  function applyPlayerColor(playerIdx) {
    if (!engineRef.current) return;
    // Always set colorPreset explicitly — the engine may still hold the other
    // player's color from the previous turn.
    const preset = (playerIdx === 1 && p2Color) ? p2Color : (p1Color || 'obsidian');
    engineRef.current.setOptions({ colorPreset: preset, pipMode: true });
  }

  // ── roll ──────────────────────────────────────────────────────────────────
  function doRoll(count) {
    if (!engineRef.current) return;
    applyPlayerColor(gs.current.currentP);
    set({ phase:'rolling', message:'', selectedIdx:[], rollVals:[] });
    engineRef.current.setDiceSet([{type:'d6',count}]);
    setTimeout(() => { if (engineRef.current) engineRef.current.roll(1.3); }, 120);
  }

  // ── engine settled ────────────────────────────────────────────────────────
  function onSettled(vals) {
    // Route to AI handler if it's the AI's turn
    if (gs.current.phase === 'ai_rolling') {
      onSettledAI(vals);
      return;
    }
    if (gs.current.phase !== 'rolling') return;
    if (isFarkle(vals)) {
      set({ rollVals:vals, selectedIdx:[], phase:'farkle_anim',
            message: t.farkleFarkle });
      setTimeout(() => {
        doEndTurn(0);
      }, 2000);
    } else {
      set({ rollVals:vals, selectedIdx:[], phase:'select', message:'' });
    }
  }

  // ── player taps a die ─────────────────────────────────────────────────────
  // We allow selecting any die that is in scoringDieIndices (i.e. participates
  // in at least one valid scoring combo). Validation at submit time via
  // calcFarkleScore(selVals) > 0. This lets players build up combos like
  // three-of-a-kind by tapping dice one by one.
  function toggleDie(idx) {
    if (gs.current.phase !== 'select') return;
    const prev    = gs.current.selectedIdx;
    const allVals = gs.current.rollVals;
    // Is this die part of any valid scoring subset?
    const scorable = scoringDieIndices(allVals);
    if (!scorable.has(idx)) return; // die can never score
    let next;
    if (prev.includes(idx)) {
      next = prev.filter(i => i !== idx);
    } else {
      next = [...prev, idx];
    }
    set({ selectedIdx: next });
  }

  // ── keep selected and roll remaining ──────────────────────────────────────
  function keepAndRoll() {
    const {rollVals, selectedIdx, keptVals, turnScore} = gs.current;
    const selVals = selectedIdx.map(i => rollVals[i]);
    const pts = calcFarkleScore(selVals);
    if (pts === 0) return;

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

  // ── bank ──────────────────────────────────────────────────────────────────
  function bank() {
    const {rollVals, selectedIdx, keptVals, turnScore} = gs.current;
    const selVals    = selectedIdx.map(i => rollVals[i]);
    const pts        = calcFarkleScore(selVals);
    const finalScore = turnScore + pts;
    doEndTurn(finalScore);
  }

  // ── end turn ──────────────────────────────────────────────────────────────
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
      // vs AI
      set({ scores:newScores, onBoard:newOnBoard, currentP:next,
            keptVals:[], rollVals:[], selectedIdx:[], turnScore:0, phase:'ai_thinking', message:'' });
      if (next === 1) {
        setTimeout(() => runAI(newScores, newOnBoard, 0, []), 600);
      } else {
        doRoll(6);
      }
    }
  }

  // ── 2P pass ───────────────────────────────────────────────────────────────
  function confirmPass() {
    doRoll(6);
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  // AI now uses the physical engine: calls doRollAI() which triggers the 3D
  // physics roll. onSettled routes to onSettledAI() when gs.aiActive is set.
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
    // Roll physically
    if (engineRef.current) {
      applyPlayerColor(1); // AI is always player 1
      engineRef.current.setDiceSet([{type:'d6', count:rollCount}]);
      setTimeout(() => { if (engineRef.current) engineRef.current.roll(1.3); }, 120);
    }
  }

  function onSettledAI(vals) {
    const { curScores, curOnBoard, aiTurnScore, prevKept } = gs.current.aiCtx || {};
    if (!curScores) return;
    if (isFarkle(vals)) {
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

    // Show AI's choice
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

  // ── derived values ────────────────────────────────────────────────────────
  const {scores,onBoard,currentP,turnScore,keptVals,rollVals,selectedIdx,phase,winner,message,hotDice} = gs.current;

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

  // ─ 2P rotation: rotate entire HUD when player 2's turn ─
  const rotateHUD = mode==='2p' && currentP===1 && phase!=='passing';

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fhud-root" style={rotateHUD?{transform:'rotate(180deg)'}:{}}>

      {/* ── TOP STRIP: scores ── */}
      <div className="fhud-top">
        <div className={`fhud-player${currentP===0?' fhud-active':''}`}>
          <span className="fhud-pname">{p0Name}</span>
          <span className="fhud-pscore">{scores[0]}</span>
          {useEntry&&!onBoard[0]&&<span className="fhud-entry">–</span>}
        </div>
        <div className="fhud-mid">
          <span className="fhud-target">{target.toLocaleString()}</span>
        </div>
        <div className={`fhud-player${currentP===1?' fhud-active':''}`}>
          <span className="fhud-pname">{p1Name}</span>
          <span className="fhud-pscore">{scores[1]}</span>
          {useEntry&&!onBoard[1]&&<span className="fhud-entry">–</span>}
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div className="fhud-bottom">

        {/* Turn score + kept dice */}
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

        {/* Fresh dice (rollVals) */}
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

        {/* Rolling indicator */}
        {phase==='rolling' && rollVals.length===0 && (
          <div className="fhud-rolling-row">
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="fhud-rolling-die" style={{animationDelay:`${i*70}ms`}}>
                <svg width="44" height="44" viewBox="0 0 100 100">
                  <rect x="3" y="3" width="94" height="94" rx="15" fill="#1c1710" stroke="#3a3025" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="8" fill="#cfc4ae" opacity="0.3"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`fhud-message${phase==='farkle_anim'?' fhud-farkle-msg':''}`}>
            {message}
            {phase==='farkle_anim'&&<div className="fhud-farkle-detail">{t.farkleFarkleDetail}</div>}
          </div>
        )}

        {/* Hint */}
        {canInteract && !message && rollVals.length > 0 && (
          <div className="fhud-hint">{t.farkleSelectDice}</div>
        )}
        {notOnBoard && canInteract && (
          <div className="fhud-warn">{t.farkleNotOnBoard}</div>
        )}
        {phase==='ai_thinking' && !message && (
          <div className="fhud-hint">{t.farkleThinking}</div>
        )}

        {/* Action buttons */}
        <div className="fhud-actions">
          {/* Human: select phase */}
          {canInteract && (
            <>
              {/* No dice selected yet: show Roll button (they need to select first) */}
              {selectedIdx.length===0 && phase==='select' && (
                <div className="fhud-hint" style={{textAlign:'center',padding:'6px 0'}}>{t.farkleSelectDice}</div>
              )}
              {canReroll && (
                <button className="farkle-btn-main" onClick={keepAndRoll}>
                  {t.farkleKeepRoll} <span style={{opacity:0.7,fontSize:'0.8em'}}>(+{selScore})</span>
                </button>
              )}
              {canBank && (
                <button className="farkle-btn-sec" onClick={bank}>
                  {t.farkleBank} ({turnScore+selScore})
                </button>
              )}
            </>
          )}

          {/* Human rolling phase: no buttons, just wait */}

          {/* 2P passing */}
          {phase==='passing' && (
            <div className="fhud-passing">
              <div className="fhud-passing-title">{t.farkleP2Pass}</div>
              <button className="farkle-btn-main" onClick={confirmPass}>{t.farklePassBtn}</button>
            </div>
          )}

          {/* End game */}
          {phase==='end' && (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div className="fhud-message" style={{fontSize:22}}>{message}</div>
              <button className="farkle-btn-main" onClick={onExitToSetup}>{t.farkleNewGame}</button>
            </div>
          )}
        </div>

        {/* Exit */}
        <button className="farkle-btn-back" style={{marginTop:4}} onClick={onExitToSetup}>{t.farkleBack}</button>
      </div>
    </div>
  );
}

// ─── Farkle container (manages setup ↔ game) ──────────────────────────────
function FarkleContainer({t, engineRef, onClose, globalColor}) {
  const [gameConfig, setGameConfig] = useState(null);
  const [gameKey,    setGameKey]    = useState(0);

  function handleStart(mode, target, useEntry, p1Color, p2Color) {
    if (!engineRef.current) return;
    // Apply p1 color to engine immediately
    if (p1Color) engineRef.current.setOptions({ colorPreset: p1Color, pipMode: true });
    else engineRef.current.setOptions({ pipMode: true });
    engineRef.current.setDiceSet([{type:'d6',count:6}]);
    setGameConfig({mode, target, useEntry, p1Color, p2Color});
    setGameKey(k => k+1);
  }

  function handleExitToSetup() {
    // Remove pipMode when leaving Farkle
    if (engineRef.current) engineRef.current.setOptions({ pipMode: false });
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
  const [showFarkle,  setShowFarkle]  = useState(false);
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
    const eng=new window.DiceEngine(document.getElementById('scene-canvas'),{
      tableColor:tab.color,accentLight:tab.accent,
      colorPreset:color,materialKind:material,
      gravity:GRAVITY,numberSize:NUMBER_SIZE,
      soundEnabled,soundVolume:soundVol,
      invertCameraX:invertCamX,invertCameraY:invertCamY,cameraSensitivity:camSens,
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

  // Restore normal dice when leaving farkle
  function closeFarkle(){
    setShowFarkle(false);
    // Restore original color + disable pip mode
    if(engineRef.current){
      const font=NUMBER_FONTS.find(f=>f.key===numFont)||NUMBER_FONTS[0];
      const nc=NUMBER_COLOR_OPTIONS.find(x=>x.key===numColor)||NUMBER_COLOR_OPTIONS[0];
      engineRef.current.setOptions({
        colorPreset:color, customColor, pipMode:false,
        numberFont:font.family, numberWeight:font.weight, numberColor:nc.hex,
      });
    }
    const l=DICE_TYPES.filter(x=>diceSet[x.key]>0).map(x=>({type:x.key,count:diceSet[x.key]}));
    if(l.length>0&&engineRef.current)engineRef.current.setDiceSet(l);
    else if(engineRef.current)engineRef.current.setDiceSet([{type:'d20',count:1}]);
  }

  // Farkle mode: no main UI overlay, just the HUD
  if (showFarkle) {
    return (
      <FarkleContainer
        t={t}
        engineRef={engineRef}
        onClose={closeFarkle}
        globalColor={color}
      />
    );
  }

  // ── Normal mode ──────────────────────────────────────────────────────────
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
