// Dice Engine — Three.js scene + cannon.js physics
// v3.0: collision sounds, vibration, Android accel fix, Farkle zoom enabled

(function () {
  const THREE = window.THREE;
  const CANNON = window.CANNON;

  // ---------- Vector helpers ----------
  function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function vcross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vlen(a) { return Math.hypot(a[0], a[1], a[2]); }
  function vnorm(a) { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  function faceNormal(verts, face) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < face.length; i++) {
      const a = verts[face[i]];
      const b = verts[face[(i + 1) % face.length]];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return vnorm([nx, ny, nz]);
  }

  function faceCentroid(verts, face) {
    let cx = 0, cy = 0, cz = 0;
    face.forEach(i => { cx += verts[i][0]; cy += verts[i][1]; cz += verts[i][2]; });
    const n = face.length;
    return [cx / n, cy / n, cz / n];
  }

  function fixWinding(verts, faces) {
    return faces.map(face => {
      const c = faceCentroid(verts, face);
      const n = faceNormal(verts, face);
      if (vdot(c, n) < 0) return face.slice().reverse();
      return face.slice();
    });
  }

  // ---------- Platonic spec builders ----------
  function tetra() {
    const v = [
      [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1],
    ];
    const f = [
      [1, 2, 3], [0, 3, 2], [0, 1, 3], [0, 2, 1],
    ];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [1, 2, 3, 4] };
  }

  function cube() {
    const v = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],
    ];
    const f = [
      [3, 2, 1, 0],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [7, 6, 2, 3],
      [4, 7, 3, 0],
      [1, 2, 6, 5],
    ];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [1, 6, 2, 5, 3, 4] };
  }

  function octa() {
    const v = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    const f = [
      [0, 2, 4], [1, 3, 5],
      [0, 4, 3], [1, 5, 2],
      [0, 3, 5], [1, 2, 4],
      [0, 5, 2], [1, 4, 3],
    ];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [1, 8, 2, 7, 3, 6, 4, 5] };
  }

  function trapezohedron(isPercentile) {
    const k = 0.18;
    const apex = 1.0;
    const v = [];
    v.push([0, apex, 0]);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      const y = i % 2 === 0 ? k : -k;
      v.push([Math.cos(a), y, Math.sin(a)]);
    }
    v.push([0, -apex, 0]);

    const f = [];
    for (let i = 0; i < 5; i++) {
      const a = 1 + ((i * 2) % 10);
      const b = 1 + ((i * 2 + 1) % 10);
      const c = 1 + ((i * 2 + 2) % 10);
      const d = 1 + ((i * 2 + 3) % 10);
      f.push([0, b, a]);
      f.push([11, c, b]);
      f.push([b, c, a]);
      f.push([a, c, d]);
    }

    const nums = isPercentile
      ? [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [...nums, ...nums] };
  }

  function dodeca() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const v = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
      v.push([sx, sy, sz]);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      v.push([0, sx * phi, sy / phi]);
      v.push([sy / phi, 0, sx * phi]);
      v.push([sx * phi, sy / phi, 0]);
    }
    const f = [
      [0,8,10,2,16],[0,16,4,14,12],[0,12,6,18,8],
      [1,17,5,15,13],[1,13,7,19,9],[1,9,11,3,17],
      [2,10,11,3,19],[2,19,7,15,16],[4,16,15,7,19], // approximate
      [4,19,3,11,10],[6,12,14,5,17],[6,17,11,10,18],
      [8,18,10,2,19],[9,19,3,17,11],[5,14,4,10,11], // approximate
      [13,15,16,4,14],[13,14,12,6,17],[18,8,0,12,6],
      [19,2,16,15,7],[9,11,17,5,15],
    ].slice(0, 12);
    const faceNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers };
  }

  function icosa() {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ];
    const f = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    const nums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: nums };
  }

  function specFor(type) {
    if (type === 'd4')   return tetra();
    if (type === 'd6')   return cube();
    if (type === 'd8')   return octa();
    if (type === 'd10')  return trapezohedron(false);
    if (type === 'd12')  return dodeca();
    if (type === 'd20')  return icosa();
    if (type === 'd100') return trapezohedron(true);
    return cube();
  }

  function scaleFor(type) {
    const s = { d4:0.9, d6:0.8, d8:0.85, d10:0.85, d12:0.88, d20:0.9, d100:0.85 };
    return s[type] || 0.8;
  }

  // ---------- Geometry builder ----------
  function buildDieGeom(spec, scale) {
    const geom = new THREE.BufferGeometry();
    const positions = [], normals = [], uvs = [], indices = [];
    let vIdx = 0;
    spec.faces.forEach((face, fi) => {
      const fverts = face.map(i => spec.vertices[i].map(c => c * scale));
      const n = faceNormal(spec.vertices, face);
      for (let i = 1; i < fverts.length - 1; i++) {
        [0, i, i + 1].forEach(j => {
          positions.push(...fverts[j]);
          normals.push(...n);
          const u = j === 0 ? 0.5 : j === i ? 0 : 1;
          const v = j === 0 ? 1 : 0;
          uvs.push(u, v);
          indices.push(vIdx++);
        });
      }
    });
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.clearGroups();
    let triIdx = 0;
    spec.faces.forEach((face, fi) => {
      const nTri = face.length - 2;
      geom.addGroup(triIdx * 3, nTri * 3, fi);
      triIdx += nTri;
    });
    return geom;
  }

  // ---------- Cannon shape ----------
  function buildCannonShape(spec, scale) {
    const verts = spec.vertices.map(v => new CANNON.Vec3(v[0]*scale, v[1]*scale, v[2]*scale));
    const faces = spec.faces.map(f => f.slice());
    return new CANNON.ConvexPolyhedron(verts, faces);
  }

  // ---------- Canvas text helper ----------
  function makeTextCanvas(text, font, color, weight, size, pip) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    if (pip) {
      // Draw pip pattern
      ctx.clearRect(0, 0, 128, 128);
      const n = parseInt(text) || 1;
      const dots = {
        1:[[64,64]],
        2:[[36,36],[92,92]],
        3:[[36,36],[64,64],[92,92]],
        4:[[36,36],[92,36],[36,92],[92,92]],
        5:[[36,36],[92,36],[64,64],[36,92],[92,92]],
        6:[[36,28],[92,28],[36,64],[92,64],[36,100],[92,100]],
      };
      const positions = dots[Math.min(n,6)] || dots[1];
      ctx.fillStyle = color === 'auto' ? '#1a1408' : color;
      // Shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;
      positions.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.clearRect(0, 0, 128, 128);
      ctx.fillStyle = color === 'auto' ? '#f0ebde' : color;
      ctx.font = `${weight} ${size * 72}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText(text, 64, 64);
    }
    return c;
  }

  // ---------- Color presets ----------
  const COLOR_PRESETS = {
    obsidian: { body: '#16161a', edge: '#2a2820', accent: '#e8b14a' },
    bone:     { body: '#ece3cf', edge: '#c8b898', accent: '#3a2a1c' },
    emerald:  { body: '#0f4435', edge: '#1a5a48', accent: '#e6d8a5' },
    royal:    { body: '#1a2b5a', edge: '#243870', accent: '#d9c98a' },
    crimson:  { body: '#5c1216', edge: '#7a1a1e', accent: '#e8d3a4' },
    gold:     { body: '#a9853a', edge: '#c8a040', accent: '#1a1208' },
    amethyst: { body: '#3a1f5a', edge: '#4e2a78', accent: '#e3d3f0' },
    // Wooden preset for Farkle
    wood:     { body: '#8b5a2b', edge: '#6b3d1e', accent: '#1a0e08' },
  };

  // ---------- Face material builder ----------
  function buildFaceMaterials(spec, colorPreset, materialKind, textOpts, customColor) {
    let c = COLOR_PRESETS[colorPreset];
    if (!c) {
      c = { body: customColor || '#5a87c2', edge: '#3a5a8a', accent: '#f0ebde' };
    }
    const numColor = textOpts.color === 'auto'
      ? (colorPreset === 'bone' || colorPreset === 'gold' ? '#1a1208' : '#f0ebde')
      : textOpts.color;

    return spec.faces.map((face, fi) => {
      const num = spec.faceNumbers[fi];
      const tex = new THREE.CanvasTexture(
        makeTextCanvas(String(num), textOpts.font, numColor, textOpts.weight, textOpts.size, textOpts.pips)
      );
      tex.colorSpace = THREE.SRGBColorSpace;

      let Cls = THREE.MeshStandardMaterial;
      const params = {
        map: tex,
        color: new THREE.Color(c.body),
        roughness: 0.55,
        metalness: 0.05,
        envMapIntensity: 0.8,
      };

      if (materialKind === 'glossy') {
        params.roughness = 0.18;
        params.metalness = 0.06;
        params.envMapIntensity = 1.1;
      } else if (materialKind === 'metallic') {
        params.roughness = 0.28;
        params.metalness = 1.0;
        params.envMapIntensity = 1.4;
      } else if (materialKind === 'wood') {
        // Wood material: matte with warm tones
        params.roughness = 0.82;
        params.metalness = 0.0;
        params.envMapIntensity = 0.4;
        // Slightly lighter face for wood grain effect
        const woodBody = new THREE.Color(c.body);
        woodBody.offsetHSL(0, 0, 0.04);
        params.color = woodBody;
      }
      return new Cls(params);
    });
  }

  // ---------- Web Audio Sound System ----------
  class SoundSystem {
    constructor() {
      this._ctx = null;
      this._enabled = true;
      this._volume = 0.7;
      this._lastHit = 0;
      this._lastTableHit = 0;
      this._minInterval = 50; // ms between dice-dice sounds
      this._minTableInterval = 40;
    }

    _getCtx() {
      if (!this._ctx) {
        try {
          this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return null; }
      }
      if (this._ctx.state === 'suspended') {
        this._ctx.resume();
      }
      return this._ctx;
    }

    setEnabled(v) { this._enabled = v; }
    setVolume(v) { this._volume = Math.max(0, Math.min(1, v)); }

    // Vibration helper
    _vibrate(pattern) {
      try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
    }

    // Generate procedural dice sounds using Web Audio API
    playDiceHit(intensity = 1.0) {
      if (!this._enabled) return;
      const now = Date.now();
      if (now - this._lastHit < this._minInterval) return;
      this._lastHit = now;

      const ctx = this._getCtx();
      if (!ctx) return;

      const t = ctx.currentTime;
      const vol = this._volume * Math.min(1, intensity * 0.8 + 0.2);

      // Wooden dice clack sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noise = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 600;
      filter.Q.value = 1.2;

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(180 + Math.random() * 120, t);
      osc1.frequency.exponentialRampToValueAtTime(60, t + 0.05);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(360 + Math.random() * 160, t);
      osc2.frequency.exponentialRampToValueAtTime(80, t + 0.04);

      noise.type = 'square';
      noise.frequency.setValueAtTime(Math.random() * 600 + 300, t);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(vol * 0.28, t + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + Math.random() * 0.05);

      osc1.connect(filter);
      osc2.connect(filter);
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(t); osc1.stop(t + 0.2);
      osc2.start(t); osc2.stop(t + 0.2);
      noise.start(t); noise.stop(t + 0.2);

      // Very subtle vibration for dice collision
      if (intensity > 0.3) this._vibrate(8);
    }

    playTableHit(intensity = 1.0) {
      if (!this._enabled) return;
      const now = Date.now();
      if (now - this._lastTableHit < this._minTableInterval * 0.5) return;
      this._lastTableHit = now;

      const ctx = this._getCtx();
      if (!ctx) return;

      const t = ctx.currentTime;
      const vol = this._volume * Math.min(1, intensity * 0.6 + 0.1);

      // Thud/thump for table contact
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 280 + Math.random() * 160;
      filter.Q.value = 1.4;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 50, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(vol * 0.45, t + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.18 + Math.random() * 0.08);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(t); osc.stop(t + 0.32);

      // Very subtle vibration on table hit
      if (intensity > 0.5) this._vibrate(6);
    }

    playSettle() {
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this._volume * 0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.25);
    }

    playFarkle() {
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      // Descending "fail" tone
      [0, 0.15, 0.30].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 - i * 80, t + delay);
        osc.frequency.exponentialRampToValueAtTime(200 - i * 40, t + delay + 0.12);
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(this._volume * 0.12, t + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.14);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t + delay); osc.stop(t + delay + 0.2);
      });
    }

    playScore() {
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      [0, 0.12].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660 + i * 110, t + delay);
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(this._volume * 0.1, t + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t + delay); osc.stop(t + delay + 0.2);
      });
      this._vibrate(20);
    }

    playSuperThrow() {
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      // Rising power sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.25);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this._volume * 0.18, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
      this._vibrate([30, 20, 60]);
    }
  }

  // ---------- Engine ----------
  class DiceEngine {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.opts = Object.assign({
        tableColor: '#0d1614',
        accentLight: '#ffc97a',
        colorPreset: 'obsidian',
        materialKind: 'glossy',
        numberFont: '"JetBrains Mono","Menlo",monospace',
        numberWeight: 700,
        numberColor: 'auto',
        numberSize: 1.0,
        gravity: 40,
        customColor: '#5a87c2',
        soundEnabled: true,
        soundVolume: 0.7,
        invertCameraX: false,
        invertCameraY: true,
        cameraSensitivity: 0.7,
        cameraLocked: false,    // when true, disables camera drag (but still zoom)
        isAndroid: /android/i.test(navigator.userAgent),
      }, opts);
      this.dice = [];
      this.onSettled = null;
      this.onDiceHit = null;
      this._rolling = false;
      this._settleTimer = 0;
      this._sound = new SoundSystem();
      this._sound.setEnabled(this.opts.soundEnabled);
      this._sound.setVolume(this.opts.soundVolume);
      this._prevPositions = [];
      this._init();
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
    }

    _init() {
      const c = this.canvas;
      const w = c.clientWidth || window.innerWidth;
      const h = c.clientHeight || window.innerHeight;
      this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h, false);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.opts.tableColor);

      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.Scene();
      const gradCanvas = document.createElement('canvas');
      gradCanvas.width = 512; gradCanvas.height = 256;
      const gctx = gradCanvas.getContext('2d');
      const g = gctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#5b4a36');
      g.addColorStop(0.5, '#221a14');
      g.addColorStop(1, '#0a0a0c');
      gctx.fillStyle = g; gctx.fillRect(0, 0, 512, 256);
      const envTex = new THREE.CanvasTexture(gradCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
      envTex.dispose();

      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.camera.position.set(0, 16, 11);
      this.camera.lookAt(0, 0, 0);

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.28));
      const key = new THREE.DirectionalLight(0xffffff, 1.7);
      key.position.set(6, 16, 8);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -10; key.shadow.camera.right = 10;
      key.shadow.camera.top = 10;   key.shadow.camera.bottom = -10;
      key.shadow.camera.near = 1;   key.shadow.camera.far = 40;
      key.shadow.bias = -0.0005;
      this.scene.add(key);
      this.keyLight = key;
      const fill = new THREE.DirectionalLight(this.opts.accentLight, 0.45);
      fill.position.set(-7, 5, -3);
      this.scene.add(fill);
      this.fillLight = fill;
      this.scene.add(new THREE.HemisphereLight(0xfff1d1, 0x1c1410, 0.18));

      const tableGeom = new THREE.CircleGeometry(12, 64);
      const tableMat = new THREE.MeshStandardMaterial({
        color: this.opts.tableColor, roughness: 0.95, metalness: 0.0,
      });
      const table = new THREE.Mesh(tableGeom, tableMat);
      table.rotation.x = -Math.PI / 2;
      table.receiveShadow = true;
      this.scene.add(table);
      this.table = table;

      const ringGeom = new THREE.RingGeometry(11.6, 12.0, 96);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 0.85 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.002;
      this.scene.add(ring);
      this._ring = ring;

      // Physics world
      this.bounds = 8.5;
      this.world = new CANNON.World();
      this.world.gravity.set(0, -this.opts.gravity, 0);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 20;
      this.world.allowSleep = true;
      this.world.defaultContactMaterial.restitution = 0.35;
      this.world.defaultContactMaterial.friction = 0.5;

      // Collision listener for sounds + vibration
      this.world.addEventListener('beginContact', (event) => {
        if (!this._rolling) return;
        const bA = event.bodyA, bB = event.bodyB;
        const isGround = bA.mass === 0 || bB.mass === 0;
        const vA = bA.velocity, vB = bB.velocity;
        const relVel = Math.hypot(vA.x - vB.x, vA.y - vB.y, vA.z - vB.z);
        const intensity = Math.min(1, relVel / 12);
        if (intensity > 0.05) {
          if (isGround) {
            this._sound.playTableHit(intensity);
          } else {
            this._sound.playDiceHit(intensity);
          }
        }
      });

      const ground = new CANNON.Body({ mass: 0 });
      ground.addShape(new CANNON.Plane());
      ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.world.addBody(ground);

      this._walls = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const wall = new CANNON.Body({ mass: 0 });
        const plane = new CANNON.Plane();
        wall.addShape(plane);
        const q = new CANNON.Quaternion();
        q.setFromVectors(new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(-Math.cos(a), 0, -Math.sin(a)));
        wall.quaternion.copy(q);
        wall.position.set(Math.cos(a) * this.bounds, 0, Math.sin(a) * this.bounds);
        this.world.addBody(wall);
        this._walls.push({ body: wall, angle: a });
      }

      this._onResize = () => {
        const nw = c.clientWidth || window.innerWidth;
        const nh = c.clientHeight || window.innerHeight;
        this.renderer.setSize(nw, nh, false);
        this.camera.aspect = nw / nh;
        this.camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', this._onResize);

      this._initControls();
    }

    _initControls() {
      const canvas = this.canvas;
      this.cameraTarget = new THREE.Vector3(0, 0, 0);
      const p = this.camera.position;
      this.cameraDist = p.length();
      this.cameraAzimuth = Math.atan2(p.x, p.z);
      const horiz = Math.hypot(p.x, p.z);
      this.cameraPolar = Math.atan2(horiz, p.y);
      this._homePolar = this.cameraPolar;
      this._homeAzimuth = this.cameraAzimuth;
      this._homeDist = this.cameraDist;

      const POLAR_MIN = 0.12;
      const POLAR_MAX = 1.40;
      const DIST_MIN = 6;
      const DIST_MAX = 38;

      let dragging = false;
      let lastX = 0, lastY = 0;
      let pinchStart = null;

      const update = () => {
        const r = this.cameraDist;
        const polar = this.cameraPolar;
        const az = this.cameraAzimuth;
        this.camera.position.set(
          r * Math.sin(polar) * Math.sin(az),
          r * Math.cos(polar),
          r * Math.sin(polar) * Math.cos(az),
        );
        this.camera.lookAt(this.cameraTarget);
      };
      this._updateCamera = update;

      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

      const onDown = (e) => {
        if (e.touches && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStart = { dist: Math.hypot(dx, dy), zoom: this.cameraDist };
          dragging = false;
          return;
        }
        if (this.opts.cameraLocked) return; // locked: no drag, but zoom still works
        dragging = true;
        const pt = e.touches ? e.touches[0] : e;
        lastX = pt.clientX; lastY = pt.clientY;
      };
      const onMove = (e) => {
        if (e.touches && e.touches.length === 2 && pinchStart) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const scale = pinchStart.dist / dist;
          this.cameraDist = clamp(pinchStart.zoom * scale, DIST_MIN, DIST_MAX);
          update();
          if (e.cancelable) e.preventDefault();
          return;
        }
        if (!dragging) return;
        const pt = e.touches ? e.touches[0] : e;
        const dx = pt.clientX - lastX;
        const dy = pt.clientY - lastY;
        lastX = pt.clientX; lastY = pt.clientY;

        const sens = this.opts.cameraSensitivity || 0.7;
        const invX = this.opts.invertCameraX ? -1 : 1;
        const invY = this.opts.invertCameraY ? -1 : 1;

        this.cameraAzimuth -= dx * 0.006 * sens * invX;
        this.cameraPolar = clamp(this.cameraPolar + dy * 0.005 * sens * invY, POLAR_MIN, POLAR_MAX);
        update();
        if (e.cancelable) e.preventDefault();
      };
      const onUp = () => { dragging = false; pinchStart = null; };
      const onWheel = (e) => {
        this.cameraDist = clamp(this.cameraDist + e.deltaY * 0.02, DIST_MIN, DIST_MAX);
        update();
        if (e.cancelable) e.preventDefault();
      };
      const onDblClick = () => {
        this.cameraDist = this._homeDist;
        this.cameraPolar = this._homePolar;
        this.cameraAzimuth = this._homeAzimuth;
        update();
      };

      canvas.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      canvas.addEventListener('touchstart', onDown, { passive: false });
      canvas.addEventListener('touchmove',  onMove, { passive: false });
      canvas.addEventListener('touchend',   onUp);
      canvas.addEventListener('wheel',      onWheel, { passive: false });
      canvas.addEventListener('dblclick',   onDblClick);
    }

    setTableSize(radius) {
      radius = Math.max(5, Math.min(14, radius));
      this.bounds = radius;
      for (const w of this._walls) {
        w.body.position.set(Math.cos(w.angle) * radius, 0, Math.sin(w.angle) * radius);
      }
      const s = radius / 12;
      this.table.scale.set(s, s, s);
      if (this._ring) this._ring.scale.set(s, s, s);
    }

    // Improved accelerometer physics — Android axis fix applied
    setGravityTilt(ax, ay, az, totalAccel) {
      const g = this.opts.gravity;
      const flatG = 9.81;

      let normX, normZ;
      if (this.opts.isAndroid) {
        // Android: axes are inverted relative to iOS
        normX = -ax / flatG;
        normZ = ay / flatG;
      } else {
        normX = ax / flatG;
        normZ = -ay / flatG;
      }

      const tx = Math.max(-1, Math.min(1, normX));
      const tz = Math.max(-1, Math.min(1, normZ));
      const ty = Math.sqrt(Math.max(0, 1 - tx * tx - tz * tz));

      const shakeBoost = Math.max(0, (totalAccel - flatG) / flatG);
      const forceScale = 1 + shakeBoost * 3.5;

      this.world.gravity.set(
        tx * g * forceScale,
        -ty * g,
        tz * g * forceScale
      );

      for (const d of this.dice) d.body.wakeUp();
    }

    resetGravity() {
      this.world.gravity.set(0, -this.opts.gravity, 0);
    }

    setOptions(opts) {
      const rebuildMats = (
        (opts.colorPreset !== undefined && opts.colorPreset !== this.opts.colorPreset) ||
        (opts.materialKind !== undefined && opts.materialKind !== this.opts.materialKind) ||
        (opts.numberFont !== undefined && opts.numberFont !== this.opts.numberFont) ||
        (opts.numberColor !== undefined && opts.numberColor !== this.opts.numberColor) ||
        (opts.numberSize !== undefined && opts.numberSize !== this.opts.numberSize) ||
        (opts.numberWeight !== undefined && opts.numberWeight !== this.opts.numberWeight) ||
        (opts.customColor !== undefined && opts.customColor !== this.opts.customColor) ||
        (opts.pipMode !== undefined && opts.pipMode !== this.opts.pipMode)
      );
      Object.assign(this.opts, opts);
      if (opts.tableColor) {
        this.scene.background = new THREE.Color(opts.tableColor);
        this.table.material.color = new THREE.Color(opts.tableColor);
      }
      if (opts.accentLight) {
        this.fillLight.color = new THREE.Color(opts.accentLight);
      }
      if (opts.gravity !== undefined) {
        this.world.gravity.set(0, -opts.gravity, 0);
        for (const d of this.dice) d.body.wakeUp();
      }
      if (opts.soundEnabled !== undefined) this._sound.setEnabled(opts.soundEnabled);
      if (opts.soundVolume !== undefined) this._sound.setVolume(opts.soundVolume);
      if (rebuildMats) {
        for (const d of this.dice) this._rebuildMaterials(d);
      }
    }

    _textOpts() {
      return {
        font: this.opts.numberFont,
        size: this.opts.numberSize,
        color: this.opts.numberColor,
        weight: this.opts.numberWeight,
        pips: this.opts.pipMode || false,
      };
    }

    _rebuildMaterials(d) {
      if (Array.isArray(d.mesh.material)) {
        d.mesh.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      }
      d.mesh.material = buildFaceMaterials(d.spec, this.opts.colorPreset, this.opts.materialKind, this._textOpts(), this.opts.customColor);
    }

    clearDice() {
      for (const d of this.dice) {
        this.scene.remove(d.mesh);
        this.world.removeBody(d.body);
        d.mesh.geometry.dispose();
        if (Array.isArray(d.mesh.material)) {
          d.mesh.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      }
      this.dice = [];
      this._prevPositions = [];
    }

    setDiceSet(set) {
      this.clearDice();
      const all = [];
      set.forEach(g => { for (let i = 0; i < g.count; i++) all.push(g.type); });
      all.forEach((type, idx) => this._addDie(type, idx, all.length));
    }

    _addDie(type, idx, total) {
      const spec = specFor(type);
      const scale = scaleFor(type);
      const geom = buildDieGeom(spec, scale);
      const mats = buildFaceMaterials(spec, this.opts.colorPreset, this.opts.materialKind, this._textOpts(), this.opts.customColor);
      const mesh = new THREE.Mesh(geom, mats);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      const cols = Math.min(total, 6);
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = (col - (cols - 1) / 2) * 1.6;
      const z = 3 + row * 1.6;
      mesh.position.set(x, 1, z);
      this.scene.add(mesh);

      const shape = buildCannonShape(spec, scale);
      const body = new CANNON.Body({ mass: 1, allowSleep: true });
      body.sleepSpeedLimit = 0.08;
      body.sleepTimeLimit = 0.4;
      body.addShape(shape);
      body.position.set(x, 1, z);
      body.linearDamping = 0.08;
      body.angularDamping = 0.10;
      this.world.addBody(body);

      this.dice.push({ type, spec, scale, mesh, body, value: null, settled: false });
      this._prevPositions.push({ x, y: 1, z });
    }

    roll(strength = 1.0) {
      if (this.dice.length === 0) return;
      this._rolling = true;
      this._settleTimer = 0;
      // Resume audio context on user gesture
      this._sound._getCtx();
      if (strength >= 3.5) this._sound.playSuperThrow();
      this.dice.forEach((d, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const startX = side * (5.5 + Math.random() * 1.5);
        const startY = 4.5 + Math.random() * 2.5;
        const startZ = -3 + Math.random() * 6;
        d.body.position.set(startX, startY, startZ);
        d.body.velocity.set(
          -side * (9 + Math.random() * 5) * strength,
          2 + Math.random() * 2,
          (Math.random() - 0.5) * 6 * strength,
        );
        d.body.angularVelocity.set(
          (Math.random() - 0.5) * 18 * Math.min(strength, 2),
          (Math.random() - 0.5) * 18 * Math.min(strength, 2),
          (Math.random() - 0.5) * 18 * Math.min(strength, 2),
        );
        d.body.quaternion.setFromEuler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        );
        d.body.wakeUp();
        d.value = null;
        d.settled = false;
      });
    }

    _readDieValue(d) {
      const spec = d.spec;
      const q = d.body.quaternion;
      let best = -Infinity, bestIdx = -1;
      const tmp = new CANNON.Vec3();
      for (let i = 0; i < spec.faces.length; i++) {
        const n = faceNormal(spec.vertices, spec.faces[i]);
        q.vmult(new CANNON.Vec3(n[0], n[1], n[2]), tmp);
        if (tmp.y > best) { best = tmp.y; bestIdx = i; }
      }
      return spec.faceNumbers[bestIdx];
    }

    _isAsleep(b) {
      if (b.sleepState === CANNON.Body.SLEEPING) return true;
      const v = b.velocity, w = b.angularVelocity;
      return Math.hypot(v.x, v.y, v.z) < 0.05 && Math.hypot(w.x, w.y, w.z) < 0.05;
    }

    _loop() {
      this.world.step(1 / 60);
      for (const d of this.dice) {
        d.mesh.position.copy(d.body.position);
        d.mesh.quaternion.copy(d.body.quaternion);
      }
      if (this._rolling) {
        const allRest = this.dice.length > 0 && this.dice.every(d => this._isAsleep(d.body));
        if (allRest) {
          this._settleTimer++;
          if (this._settleTimer > 18) {
            this._rolling = false;
            this.dice.forEach(d => { d.value = this._readDieValue(d); d.settled = true; });
            this._sound.playSettle();
            if (this.onSettled) this.onSettled(this.getResults());
          }
        } else {
          this._settleTimer = 0;
        }
      }
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._loop);
    }

    getResults() {
      return this.dice.map(d => ({ type: d.type, value: d.value }));
    }

    getSoundSystem() { return this._sound; }
  }

  window.DiceEngine = DiceEngine;
  window.DICE_COLORS = COLOR_PRESETS;
})();
