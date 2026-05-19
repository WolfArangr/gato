// Interfaz de usuario React para el lanzador de dados

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const DICE_TYPES = [
  { key: 'd4',   sides: 4,  subtitle: '4 caras'                 },
  { key: 'd6',   sides: 6,  subtitle: '6 caras'                 },
  { key: 'd8',   sides: 8,  subtitle: '8 caras'                 },
  { key: 'd10',  sides: 10, subtitle: '10 caras · unidades'     },
  { key: 'd12',  sides: 12, subtitle: '12 caras'                },
  { key: 'd20',  sides: 20, subtitle: '20 caras'                },
  { key: 'd100', sides: 10, subtitle: '10 caras · decenas (0–90)' },
];

const COLOR_OPTIONS = [
  { key: 'obsidian', label: 'Obsidiana', swatch: '#16161a', accent: '#e8b14a' },
  { key: 'bone',     label: 'Hueso',     swatch: '#ece3cf', accent: '#3a2a1c' },
  { key: 'emerald',  label: 'Esmeralda', swatch: '#0f4435', accent: '#e6d8a5' },
  { key: 'royal',    label: 'Real',      swatch: '#1a2b5a', accent: '#d9c98a' },
  { key: 'crimson',  label: 'Carmesí',   swatch: '#5c1216', accent: '#e8d3a4' },
  { key: 'gold',     label: 'Oro',       swatch: '#a9853a', accent: '#1a1208' },
  { key: 'amethyst', label: 'Amatista',  swatch: '#3a1f5a', accent: '#e3d3f0' },
];

const MATERIAL_OPTIONS = [
  { key: 'matte',    label: 'Mate'      },
  { key: 'glossy',   label: 'Brillante' },
  { key: 'metallic', label: 'Metálico'  },
];

const NUMBER_FONTS = [
  { key: 'mono',  label: 'Mono',   family: '"JetBrains Mono","Menlo",monospace', weight: 700 },
  { key: 'serif', label: 'Serif',  family: '"DM Serif Display",Georgia,serif',    weight: 400 },
  { key: 'roman', label: 'Romano', family: '"Cinzel","Trajan Pro",serif',          weight: 700 },
  { key: 'sans',  label: 'Sans',   family: '"Manrope",system-ui,sans-serif',       weight: 700 },
];

const NUMBER_COLOR_OPTIONS = [
  { key: 'auto',    label: 'Auto',    hex: 'auto'    },
  { key: 'ivory',   label: 'Marfil',  hex: '#f0ebde' },
  { key: 'gold',    label: 'Oro',     hex: '#e8b14a' },
  { key: 'crimson', label: 'Carmesí', hex: '#e34232' },
  { key: 'ink',     label: 'Tinta',   hex: '#0e0c08' },
];

const TABLE_OPTIONS = [
  { key: 'forest', color: '#0d1614', accent: '#ffc97a', label: 'Bosque' },
  { key: 'ink',    color: '#0a0d14', accent: '#9bb3e6', label: 'Tinta'  },
  { key: 'wine',   color: '#1a0c0e', accent: '#ffb37a', label: 'Vino'   },
  { key: 'sand',   color: '#2a241c', accent: '#ffd9a0', label: 'Arena'  },
];

// Constantes de física fijas
const THROW_STRENGTH = 1.15;
const GRAVITY = 40;
const NUMBER_SIZE = 0.5;

// Estado de ajustes — entre marcadores EDITMODE para persistencia del host
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "table": "forest",
  "shakeToRoll": true,
  "linkPercentile": true
}/*EDITMODE-END*/;

// ───────────────────────── Íconos SVG para cada tipo de dado ─────────────────────────
function DieIcon({ type, size = 22, stroke = 'currentColor' }) {
  const s = size, c = s / 2;
  const r = s * 0.38;
  const common = { fill: 'none', stroke, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
  if (type === 'd4') {
    const pts = [
      [c, c - r],
      [c + r * 0.866, c + r * 0.5],
      [c - r * 0.866, c + r * 0.5],
    ];
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={pts.map(p => p.join(',')).join(' ')} {...common} />
        <line x1={pts[0][0]} y1={pts[0][1]} x2={c} y2={c + r * 0.12} {...common} />
        <line x1={pts[1][0]} y1={pts[1][1]} x2={c} y2={c + r * 0.12} {...common} />
        <line x1={pts[2][0]} y1={pts[2][1]} x2={c} y2={c + r * 0.12} {...common} />
      </svg>
    );
  }
  if (type === 'd6') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M${c - r * 0.9} ${c - r * 0.5} L${c} ${c - r} L${c + r * 0.9} ${c - r * 0.5} L${c + r * 0.9} ${c + r * 0.5} L${c} ${c + r} L${c - r * 0.9} ${c + r * 0.5} Z`} {...common} />
        <line x1={c} y1={c - r} x2={c} y2={c + r} {...common} />
        <line x1={c - r * 0.9} y1={c - r * 0.5} x2={c} y2={c} {...common} />
        <line x1={c + r * 0.9} y1={c - r * 0.5} x2={c} y2={c} {...common} />
        <line x1={c - r * 0.9} y1={c + r * 0.5} x2={c} y2={c} {...common} />
        <line x1={c + r * 0.9} y1={c + r * 0.5} x2={c} y2={c} {...common} />
      </svg>
    );
  }
  if (type === 'd8') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`${c},${c - r} ${c + r * 0.9},${c} ${c},${c + r} ${c - r * 0.9},${c}`} {...common} />
        <line x1={c} y1={c - r} x2={c} y2={c + r} {...common} />
        <line x1={c - r * 0.9} y1={c} x2={c + r * 0.9} y2={c} {...common} />
      </svg>
    );
  }
  if (type === 'd10' || type === 'd100') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`${c},${c - r} ${c + r * 0.85},${c - r * 0.1} ${c + r * 0.55},${c + r * 0.55} ${c - r * 0.55},${c + r * 0.55} ${c - r * 0.85},${c - r * 0.1}`} {...common} />
        <line x1={c} y1={c - r} x2={c} y2={c + r * 0.55} {...common} />
        <line x1={c + r * 0.85} y1={c - r * 0.1} x2={c - r * 0.55} y2={c + r * 0.55} {...common} />
        <line x1={c - r * 0.85} y1={c - r * 0.1} x2={c + r * 0.55} y2={c + r * 0.55} {...common} />
      </svg>
    );
  }
  if (type === 'd12') {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
    }
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={pts.map(p => p.join(',')).join(' ')} {...common} />
        {pts.map((p, i) => (
          <line key={i} x1={p[0]} y1={p[1]} x2={c} y2={c} {...common} />
        ))}
      </svg>
    );
  }
  // d20
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 6);
    pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={pts.map(p => p.join(',')).join(' ')} {...common} />
      <polygon points={`${pts[0][0]},${pts[0][1]} ${pts[2][0]},${pts[2][1]} ${pts[4][0]},${pts[4][1]}`} {...common} />
      <polygon points={`${pts[1][0]},${pts[1][1]} ${pts[3][0]},${pts[3][1]} ${pts[5][0]},${pts[5][1]}`} {...common} />
    </svg>
  );
}

function notation(set) {
  const parts = DICE_TYPES.filter(t => set[t.key] > 0).map(t => `${set[t.key]}${t.key}`);
  return parts.join(' + ') || '—';
}

function App() {
  const engineRef = useRef(null);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [color, setColor] = useState('obsidian');
  const [customColor, setCustomColor] = useState('#5a87c2');
  const [material, setMaterial] = useState('glossy');
  const [numFont, setNumFont] = useState('mono');
  const [numColor, setNumColor] = useState('auto');
  const [diceSet, setDiceSet] = useState({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 1, d100: 0 });
  const [results, setResults] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shakeArmed, setShakeArmed] = useState(false);
  const isTouch = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Init engine
  useEffect(() => {
    const tab = TABLE_OPTIONS.find(t => t.key === tweaks.table) || TABLE_OPTIONS[0];
    const canvas = document.getElementById('scene-canvas');
    const eng = new window.DiceEngine(canvas, {
      tableColor: tab.color,
      accentLight: tab.accent,
      colorPreset: color,
      materialKind: material,
      gravity: GRAVITY,
      numberSize: NUMBER_SIZE,
    });
    eng.onSettled = (res) => {
      setRolling(false);
      setResults(res);
    };
    engineRef.current = eng;
  }, []);

  // Build dice when set changes
  useEffect(() => {
    if (!engineRef.current) return;
    const list = DICE_TYPES
      .filter(t => diceSet[t.key] > 0)
      .map(t => ({ type: t.key, count: diceSet[t.key] }));
    engineRef.current.setDiceSet(list);
    setResults(null);
  }, [diceSet]);

  // Push color/material/text to engine
  useEffect(() => {
    if (!engineRef.current) return;
    const font = NUMBER_FONTS.find(f => f.key === numFont) || NUMBER_FONTS[0];
    const c = NUMBER_COLOR_OPTIONS.find(x => x.key === numColor) || NUMBER_COLOR_OPTIONS[0];
    engineRef.current.setOptions({
      colorPreset: color,
      customColor,
      materialKind: material,
      numberFont: font.family,
      numberWeight: font.weight,
      numberColor: c.hex,
      numberSize: NUMBER_SIZE,
    });
  }, [color, customColor, material, numFont, numColor]);

  // Table
  useEffect(() => {
    if (!engineRef.current) return;
    const tab = TABLE_OPTIONS.find(t => t.key === tweaks.table) || TABLE_OPTIONS[0];
    engineRef.current.setOptions({ tableColor: tab.color, accentLight: tab.accent });
  }, [tweaks.table]);

  // Roll
  const roll = useCallback(() => {
    if (!engineRef.current) return;
    const total = Object.values(diceSet).reduce((s, n) => s + n, 0);
    if (total === 0) return;
    setRolling(true);
    setResults(null);
    engineRef.current.roll(THROW_STRENGTH);
  }, [diceSet]);

  // Shake detection (acelerómetro móvil)
  useEffect(() => {
    if (!tweaks.shakeToRoll || !shakeArmed) return;
    let last = { x: 0, y: 0, z: 0, t: 0 };
    let cooldown = 0;
    function onMotion(e) {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const now = performance.now();
      const dt = now - last.t;
      if (dt < 30) return;
      const dx = a.x - last.x, dy = a.y - last.y, dz = a.z - last.z;
      last = { x: a.x, y: a.y, z: a.z, t: now };
      const speed = Math.hypot(dx, dy, dz) / dt * 1000;
      if (speed > 70 && now - cooldown > 1200 && !rolling) {
        cooldown = now;
        roll();
      }
    }
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [tweaks.shakeToRoll, shakeArmed, roll, rolling]);

  // Espacio para lanzar
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && !e.target.closest('input, textarea, select, button')) {
        e.preventDefault();
        if (!rolling) roll();
      } else if (e.code === 'Escape') {
        setMenuOpen(false);
        setShowHelp(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roll, rolling]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (hamburgerRef.current && hamburgerRef.current.contains(e.target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [menuOpen]);

  // Permiso de movimiento iOS
  const enableShake = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const p = await DeviceMotionEvent.requestPermission();
        if (p === 'granted') setShakeArmed(true);
      } catch (err) { /* el usuario denegó */ }
    } else {
      setShakeArmed(true);
    }
  };

  // Helpers de ajustes — también persiste vía postMessage al padre
  const setTweak = (k, v) => {
    setTweaks(prev => {
      const next = typeof k === 'object' ? { ...prev, ...k } : { ...prev, [k]: v };
      try {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: typeof k === 'object' ? k : { [k]: v } }, '*');
      } catch (e) { /* noop */ }
      return next;
    });
  };

  const totalDice = Object.values(diceSet).reduce((s, n) => s + n, 0);
  const rollNotation = notation(diceSet);

  // ---- Emparejamiento de porcentaje ----
  // Cuando linkPercentile está activo y hay cantidades iguales de d100 y d10,
  // se agrupan como porcentajes (00+0 = 100 por convención de D&D).
  function buildResultGroups(res) {
    if (!res) return null;
    const out = { pairs: [], dice: [] };
    if (!tweaks.linkPercentile) { out.dice = res.slice(); return out; }
    const d100s = res.filter(r => r.type === 'd100');
    const d10s  = res.filter(r => r.type === 'd10');
    const others = res.filter(r => r.type !== 'd100' && r.type !== 'd10');
    const pairN = Math.min(d100s.length, d10s.length);
    for (let i = 0; i < pairN; i++) {
      const tens = d100s[i].value;
      const units = d10s[i].value;
      const pct = (tens === 0 && units === 0) ? 100 : (tens + units);
      out.pairs.push({ tens, units, value: pct });
    }
    out.dice = others
      .concat(d100s.slice(pairN))
      .concat(d10s.slice(pairN));
    return out;
  }

  const grouped = buildResultGroups(results);
  const totalFromGroups = grouped
    ? grouped.pairs.reduce((s, p) => s + p.value, 0) + grouped.dice.reduce((s, d) => s + (d.value ?? 0), 0)
    : null;

  function adjust(type, delta) {
    setDiceSet(prev => {
      const cur = prev[type] || 0;
      const next = Math.max(0, Math.min(20, cur + delta));
      return { ...prev, [type]: next };
    });
  }

  // ---------- UI ----------
  return (
    <React.Fragment>
      {/* Barra superior */}
      <div className="top-bar">
        <button
          ref={hamburgerRef}
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menú de personalización"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="brand">
          <div className="brand-mark"><DieIcon type="d20" size={28} stroke="#e8b14a" /></div>
          <div className="brand-text">
            <div className="brand-title">Dados</div>
            <div className="brand-sub">lanzador de mesa</div>
          </div>
        </div>
        <button className="icon-btn" aria-label="Ayuda" onClick={() => setShowHelp(s => !s)}>?</button>
      </div>

      {/* Menú desplegable (hamburguer) */}
      {menuOpen && (
        <div className="menu-dropdown" ref={menuRef}>
          <div className="menu-section">
            <div className="menu-title">Color de los dados</div>
            <div className="swatch-grid">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.key}
                  className={`swatch ${color === c.key ? 'sel' : ''}`}
                  onClick={() => setColor(c.key)}
                  title={c.label}
                >
                  <span className="swatch-disc" style={{ background: c.swatch, borderColor: c.accent }}>
                    <span className="swatch-dot" style={{ background: c.accent }} />
                  </span>
                  <span className="swatch-label">{c.label}</span>
                </button>
              ))}
              <label
                className={`swatch custom ${color === 'custom' ? 'sel' : ''}`}
                title="Color personalizado"
              >
                <span
                  className="swatch-disc rainbow"
                  style={color === 'custom' ? { background: customColor, borderColor: customColor } : undefined}
                >
                  {color !== 'custom' && <span className="swatch-plus">+</span>}
                  {color === 'custom' && <span className="swatch-dot" style={{ background: '#ffffff', mixBlendMode: 'difference' }} />}
                </span>
                <span className="swatch-label">{color === 'custom' ? customColor.toUpperCase() : 'Personalizado'}</span>
                <input
                  type="color"
                  className="color-input"
                  value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setColor('custom'); }}
                  onClick={() => setColor('custom')}
                />
              </label>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Material</div>
            <div className="mat-row">
              {MATERIAL_OPTIONS.map(m => (
                <button
                  key={m.key}
                  className={`mat-pill ${material === m.key ? 'sel' : ''}`}
                  onClick={() => setMaterial(m.key)}
                >{m.label}</button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Tipografía de números</div>
            <div className="num-row-grid">
              {NUMBER_FONTS.map(f => (
                <button
                  key={f.key}
                  className={`num-font ${numFont === f.key ? 'sel' : ''}`}
                  onClick={() => setNumFont(f.key)}
                  style={{ fontFamily: f.family, fontWeight: f.weight }}
                >20</button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Color de los números</div>
            <div className="num-row swatches">
              {NUMBER_COLOR_OPTIONS.map(c => (
                <button
                  key={c.key}
                  className={`num-swatch ${numColor === c.key ? 'sel' : ''}`}
                  onClick={() => setNumColor(c.key)}
                  title={c.label}
                >
                  {c.hex === 'auto' ? (
                    <span className="auto-disc">A</span>
                  ) : (
                    <span className="solid-disc" style={{ background: c.hex }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Color de la mesa</div>
            <div className="table-row">
              {TABLE_OPTIONS.map(t => (
                <button
                  key={t.key}
                  className={`table-pill ${tweaks.table === t.key ? 'sel' : ''}`}
                  onClick={() => setTweak('table', t.key)}
                >
                  <span className="table-disc" style={{ background: t.color, boxShadow: `inset 0 0 14px ${t.accent}66` }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Columna izquierda: selector de dados */}
      <div className="left-panel">
        <div className="panel-title">Dados</div>
        <div className="dice-grid">
          {DICE_TYPES.map(t => {
            const count = diceSet[t.key];
            return (
              <div key={t.key} className={`die-row ${count > 0 ? 'active' : ''}`}>
                <div className="die-info">
                  <DieIcon type={t.key} size={26} stroke={count > 0 ? '#e8b14a' : '#7e7669'} />
                  <div className="die-meta">
                    <div className="die-label">{t.key}</div>
                    <div className="die-sides">{t.subtitle}</div>
                  </div>
                </div>
                <div className="die-counter">
                  <button className="cbtn" onClick={() => adjust(t.key, -1)} disabled={count === 0}>−</button>
                  <div className="count">{count}</div>
                  <button className="cbtn" onClick={() => adjust(t.key, +1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra inferior: notación + botón lanzar */}
      <div className="bottom-bar">
        <div className="notation-bubble">
          <span className="notation-label">Tirada</span>
          <span className="notation">{rollNotation}</span>
        </div>
        <button
          className={`roll-btn ${rolling ? 'rolling' : ''} ${totalDice === 0 ? 'disabled' : ''}`}
          onClick={roll}
          disabled={rolling || totalDice === 0}
        >
          <span className="roll-label">{rolling ? 'Lanzando…' : 'Lanzar'}</span>
          <span className="roll-hint">Espacio / Agitar</span>
        </button>
        {tweaks.shakeToRoll && isTouch && !shakeArmed && (
          <button className="shake-arm" onClick={enableShake}>Activar agitación</button>
        )}
      </div>

      {/* Panel de resultados (derecha) */}
      {results && grouped && (
        <div className="results-panel">
          <div className="results-head">
            <span className="results-label">{grouped.pairs.length > 0 && grouped.dice.length === 0 ? 'Porcentaje' : 'Resultado'}</span>
            <span className="results-total">{totalFromGroups}</span>
          </div>
          {grouped.pairs.length > 0 && (
            <div className="results-list">
              {grouped.pairs.map((p, i) => (
                <div key={'p' + i} className="result-chip pair">
                  <span className="pair-badge">%</span>
                  <span className="result-type">d100+d10</span>
                  <span className="pair-detail">{String(p.tens).padStart(2, '0')}+{p.units}</span>
                  <span className="result-value">{p.value}</span>
                </div>
              ))}
            </div>
          )}
          {grouped.dice.length > 0 && (
            <div className="results-list">
              {grouped.dice.map((r, i) => (
                <div key={'d' + i} className="result-chip">
                  <DieIcon type={r.type} size={18} stroke="#e8b14a" />
                  <span className="result-type">{r.type}</span>
                  <span className="result-value">{r.value}</span>
                </div>
              ))}
            </div>
          )}
          {(grouped.pairs.length + grouped.dice.length) > 1 && (
            <div className="results-breakdown">
              {[...grouped.pairs.map(p => p.value), ...grouped.dice.map(d => d.value)].join(' + ')} = <span>{totalFromGroups}</span>
            </div>
          )}
        </div>
      )}

      {/* Overlay de ayuda */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-card" onClick={e => e.stopPropagation()}>
            <div className="help-title">Cómo lanzar</div>
            <ul>
              <li><b>Elige dados</b> con los controles + / −. Mezcla cualquier combinación.</li>
              <li><b>Lanza</b> con el botón, la barra espaciadora, o agitando el teléfono.</li>
              <li><b>Cámara:</b> arrastra para rotar, rueda o pellizco para hacer zoom, doble clic para reiniciar la vista.</li>
              <li><b>Personaliza</b> colores, materiales y números desde el menú ☰.</li>
              <li>Las caras opuestas suman correctamente: d6 → 7, d8 → 9, d10 → 9, d12 → 13, d20 → 21.</li>
              <li>El d100 es un d10 de decenas (00, 10, … 90). Combínalo con un d10 para porcentajes.</li>
              <li>El total aparece en la parte superior derecha cuando los dados se detienen.</li>
            </ul>
            <button className="close" onClick={() => setShowHelp(false)}>Entendido</button>
          </div>
        </div>
      )}

      {/* Panel de Tweaks (activado por host) */}
      <TweaksPanel title="Ajustes">
        <TweakSection label="Reglas">
          <TweakToggle label="Emparejar d100+d10 como porcentaje" value={tweaks.linkPercentile} onChange={v => setTweak('linkPercentile', v)} />
          <TweakToggle label="Agitar para lanzar" value={tweaks.shakeToRoll} onChange={v => setTweak('shakeToRoll', v)} />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('ui-root'));
root.render(<App />);
