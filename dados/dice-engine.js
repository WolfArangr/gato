// Dice Engine — Three.js scene + cannon.js physics
// Exposes window.DiceEngine + window.DICE_COLORS

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
    // Newell's method-ish: average of cross products for non-triangular faces.
    // For our convex faces this is fine.
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

  // Ensure every face is wound CCW viewed from outside (assumes convex polyhedron centred at origin)
  function fixWinding(verts, faces) {
    return faces.map(face => {
      const c = faceCentroid(verts, face);
      const n = faceNormal(verts, face);
      // If centroid · normal < 0, normal points inward → reverse.
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
      [3, 2, 1, 0], // back z=-1 → 1
      [4, 5, 6, 7], // front z=+1 → 6
      [0, 1, 5, 4], // bottom y=-1 → 2
      [7, 6, 2, 3], // top y=+1 → 5
      [4, 7, 3, 0], // left x=-1 → 3
      [1, 2, 6, 5], // right x=+1 → 4
    ];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [1, 6, 2, 5, 3, 4] };
  }

  function octa() {
    const v = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    // 8 octants; pair opposites sum to 9
    const f = [
      [0, 2, 4], [1, 3, 5],
      [0, 4, 3], [1, 5, 2],
      [0, 3, 5], [1, 2, 4],
      [0, 5, 2], [1, 4, 3],
    ];
    return { vertices: v, faces: fixWinding(v, f), faceNumbers: [1, 8, 2, 7, 3, 6, 4, 5] };
  }

  // Pentagonal trapezohedron for d10 / d100
  function trapezohedron(isPercentile) {
    const k = 0.18; // zigzag amplitude (good rolling)
    const apex = 1.0;
    const v = [];
    v.push([0, apex, 0]); // 0 = top apex
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      const y = i % 2 === 0 ? k : -k;
      v.push([Math.cos(a), y, Math.sin(a)]);
    }
    v.push([0, -apex, 0]); // 11 = bottom apex

    const f = [];
    for (let i = 0; i < 5; i++) {
      // top kite: top apex + upper + lower + next upper
      const a = 1 + ((i * 2) % 10);
      const b = 1 + ((i * 2 + 1) % 10);
      const c = 1 + ((i * 2 + 2) % 10);
      f.push([0, a, b, c]);
    }
    for (let i = 0; i < 5; i++) {
      // bottom kite: bottom apex + lower + upper + next lower
      const a = 1 + ((i * 2 + 1) % 10);
      const b = 1 + ((i * 2 + 2) % 10);
      const c = 1 + ((i * 2 + 3) % 10);
      f.push([11, a, b, c]);
    }
    const fixed = fixWinding(v, f);
    // Assign opposite-face numbers
    const numbers = assignOpposites(v, fixed, 10, /*startAtZero*/ true);
    if (isPercentile) {
      for (let i = 0; i < numbers.length; i++) numbers[i] = numbers[i] * 10;
    }
    return { vertices: v, faces: fixed, faceNumbers: numbers };
  }

  // Generic platonic from THREE.*Geometry (used for d12, d20)
  function fromThreeGeom(geom) {
    const pos = geom.attributes.position;
    const verts = [];
    const key = new Map();
    const tris = [];
    for (let i = 0; i < pos.count; i += 3) {
      const tri = [];
      for (let j = 0; j < 3; j++) {
        const x = +pos.getX(i + j).toFixed(5);
        const y = +pos.getY(i + j).toFixed(5);
        const z = +pos.getZ(i + j).toFixed(5);
        const k = `${x},${y},${z}`;
        let idx = key.get(k);
        if (idx === undefined) { idx = verts.length; key.set(k, idx); verts.push([x, y, z]); }
        tri.push(idx);
      }
      tris.push(tri);
    }
    // Group triangles by coplanar face
    const groups = [];
    for (const tri of tris) {
      const n = faceNormal(verts, tri);
      const c = faceCentroid(verts, tri);
      const d = vdot(c, n);
      let g = groups.find(g =>
        Math.abs(g.n[0] - n[0]) < 1e-3 &&
        Math.abs(g.n[1] - n[1]) < 1e-3 &&
        Math.abs(g.n[2] - n[2]) < 1e-3 &&
        Math.abs(g.d - d) < 1e-3
      );
      if (!g) { g = { n, d, verts: new Set() }; groups.push(g); }
      tri.forEach(i => g.verts.add(i));
    }
    // Order each face CCW around centroid (viewed from outside, i.e. along +normal)
    const faces = groups.map(g => {
      const arr = [...g.verts];
      const c = faceCentroid(verts, arr);
      // Build basis in plane
      const n = g.n;
      let t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      const td = vdot(t, n);
      t = vnorm([t[0] - td * n[0], t[1] - td * n[1], t[2] - td * n[2]]);
      const b = vcross(n, t);
      arr.sort((p, q) => {
        const dp = vsub(verts[p], c);
        const dq = vsub(verts[q], c);
        return Math.atan2(vdot(dp, b), vdot(dp, t)) - Math.atan2(vdot(dq, b), vdot(dq, t));
      });
      return arr;
    });
    return { vertices: verts, faces: fixWinding(verts, faces) };
  }

  function assignOpposites(verts, faces, count, startAtZero) {
    const N = faces.length;
    const normals = faces.map(f => faceNormal(verts, f));
    const used = new Set();
    const pairs = [];
    for (let i = 0; i < N; i++) {
      if (used.has(i)) continue;
      let bestJ = -1, bestDot = Infinity;
      for (let j = 0; j < N; j++) {
        if (j === i || used.has(j)) continue;
        const dot = vdot(normals[i], normals[j]);
        if (dot < bestDot) { bestDot = dot; bestJ = j; }
      }
      pairs.push([i, bestJ]);
      used.add(i); used.add(bestJ);
    }
    const numbers = new Array(N).fill(0);
    const base = startAtZero ? 0 : 1;
    pairs.forEach(([a, b], idx) => {
      const lo = base + idx;
      const hi = (startAtZero ? (count - 1) : count) - idx + (startAtZero ? 0 : 1) - 1;
      // simpler: opposite pair sums:
      // startAtZero: 0+9, 1+8, 2+7, 3+6, 4+5 → sum = count-1 = 9
      // else: 1+count, 2+(count-1), ... → sum = count+1
      const sum = startAtZero ? (count - 1) : (count + 1);
      const x = base + idx;
      const y = sum - x;
      numbers[a] = x;
      numbers[b] = y;
    });
    return numbers;
  }

  function dodecahedron() {
    const g = new THREE.DodecahedronGeometry(1);
    const built = fromThreeGeom(g);
    const numbers = assignOpposites(built.vertices, built.faces, 12, false);
    return { vertices: built.vertices, faces: built.faces, faceNumbers: numbers };
  }
  function icosahedron() {
    const g = new THREE.IcosahedronGeometry(1);
    const built = fromThreeGeom(g);
    const numbers = assignOpposites(built.vertices, built.faces, 20, false);
    return { vertices: built.vertices, faces: built.faces, faceNumbers: numbers };
  }

  function specFor(type) {
    switch (type) {
      case 'd4':   return tetra();
      case 'd6':   return cube();
      case 'd8':   return octa();
      case 'd10':  return trapezohedron(false);
      case 'd12':  return dodecahedron();
      case 'd20':  return icosahedron();
      case 'd100': return trapezohedron(true);
      default: throw new Error('Unknown die type: ' + type);
    }
  }

  // Scales chosen so every die has approximately the same circumradius.
  // Tetra & cube vertices sit at √3 from origin (≈1.732), so they need a smaller scale
  // to match dice whose vertices are at radius 1.
  function scaleFor(type) {
    switch (type) {
      case 'd4':   return 0.50;  // √3 * 0.50 ≈ 0.87 circumradius
      case 'd6':   return 0.52;  // √3 * 0.52 ≈ 0.90
      case 'd8':   return 0.86;
      case 'd10':  return 0.85;
      case 'd12':  return 0.86;
      case 'd20':  return 0.92;  // d20 traditionally slightly larger
      case 'd100': return 0.85;
      default: return 0.85;
    }
  }

  // ---------- Build Three.js geometry from a spec (each face is its own material slot) ----------
  function buildDieGeom(spec, scale) {
    const positions = [], normals = [], uvs = [];
    const groups = [];
    let triIdx = 0;
    for (let fIdx = 0; fIdx < spec.faces.length; fIdx++) {
      const face = spec.faces[fIdx];
      const n = faceNormal(spec.vertices, face);
      const c = faceCentroid(spec.vertices, face);
      // tangent basis in face plane
      const r0 = spec.vertices[face[0]];
      let t = vsub(r0, c);
      const tlen = vlen(t) || 1; t = [t[0] / tlen, t[1] / tlen, t[2] / tlen];
      const b = vcross(n, t);
      // max radius for UV scaling
      let maxR = 0;
      face.forEach(i => {
        const p = vsub(spec.vertices[i], c);
        const u = vdot(p, t), v = vdot(p, b);
        const r = Math.hypot(u, v);
        if (r > maxR) maxR = r;
      });
      const start = triIdx;
      for (let i = 1; i < face.length - 1; i++) {
        const tri = [face[0], face[i], face[i + 1]];
        tri.forEach(vi => {
          const p = spec.vertices[vi];
          positions.push(p[0] * scale, p[1] * scale, p[2] * scale);
          normals.push(n[0], n[1], n[2]);
          const pc = vsub(p, c);
          const u = vdot(pc, t) / maxR;
          const v = vdot(pc, b) / maxR;
          uvs.push(0.5 + u * 0.42, 0.5 + v * 0.42);
        });
        triIdx += 3;
      }
      groups.push([start, triIdx - start, fIdx]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
    g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
    groups.forEach(([s, c, m]) => g.addGroup(s, c, m));
    return g;
  }

  function buildCannonShape(spec, scale) {
    const verts = spec.vertices.map(p => new CANNON.Vec3(p[0] * scale, p[1] * scale, p[2] * scale));
    const faces = spec.faces.map(f => f.slice());
    return new CANNON.ConvexPolyhedron(verts, faces);
  }

  // ---------- Per-face number texture ----------
  // textOpts: { font: '"JetBrains Mono"', size: 1.0 (scale factor), color: '#xxx' | 'auto' }
  function makeFaceTexture(number, opts, textOpts) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, size, size);
    // subtle inner edge highlight
    if (opts.edge) {
      ctx.strokeStyle = opts.edge;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, size - 8, size - 8);
    }
    const s = String(number);
    const scale = (textOpts && textOpts.size) ? textOpts.size : 1.0;
    const baseSize = s.length === 1 ? 168 : s.length === 2 ? 124 : 100;
    const fontSize = Math.round(baseSize * scale);
    const color = (textOpts && textOpts.color && textOpts.color !== 'auto') ? textOpts.color : opts.fg;
    const fontFamily = (textOpts && textOpts.font) ? textOpts.font : '"JetBrains Mono","Menlo",monospace';
    const fontWeight = (textOpts && textOpts.weight) ? textOpts.weight : 700;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillText(s, size / 2, size / 2 + fontSize * 0.04);
    // Underline ambiguous digits
    const underline = (s === '6' || s === '9' || s === '60' || s === '90');
    if (underline) {
      const w = fontSize * 0.55;
      ctx.fillRect(size / 2 - w / 2, size / 2 + fontSize * 0.45, w, Math.max(4, fontSize * 0.06));
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const COLOR_PRESETS = {
    obsidian: { body: '#16161a', fg: '#e8b14a', edge: '#241f1a' },
    bone:     { body: '#ece3cf', fg: '#3a2a1c', edge: '#c8b896' },
    emerald:  { body: '#0f4435', fg: '#e6d8a5', edge: '#0a2a20' },
    royal:    { body: '#1a2b5a', fg: '#d9c98a', edge: '#0f1b3d' },
    crimson:  { body: '#5c1216', fg: '#e8d3a4', edge: '#3a0a0d' },
    gold:     { body: '#a9853a', fg: '#1a1208', edge: '#7a5d20' },
    amethyst: { body: '#3a1f5a', fg: '#e3d3f0', edge: '#26113d' },
  };

  // Derive a coherent fg/edge from any body hex (used for the custom color picker).
  function hexLuma(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function shade(hex, amount) {
    // amount in [-1, 1]: negative darkens toward black, positive lightens toward white
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    const t = amount < 0 ? 0 : 255;
    const a = Math.abs(amount);
    const mix = (c) => Math.round(c * (1 - a) + t * a);
    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return '#' + toHex(mix(r)) + toHex(mix(g)) + toHex(mix(b));
  }
  function deriveColors(body) {
    const light = hexLuma(body) > 0.55;
    return {
      body,
      fg:   light ? shade(body, -0.78) : shade(body, +0.72),
      edge: light ? shade(body, -0.22) : shade(body, +0.18),
    };
  }

  function buildFaceMaterials(spec, colorPreset, materialKind, textOpts, customColor) {
    let c;
    if (colorPreset === 'custom' && customColor) {
      c = deriveColors(customColor);
    } else {
      c = COLOR_PRESETS[colorPreset] || COLOR_PRESETS.obsidian;
    }
    return spec.faceNumbers.map(n => {
      const tex = makeFaceTexture(n, { bg: c.body, fg: c.fg, edge: c.edge }, textOpts);
      const params = { map: tex };
      let Cls = THREE.MeshStandardMaterial;
      if (materialKind === 'matte') {
        params.roughness = 0.85; params.metalness = 0.0;
        params.envMapIntensity = 0.35;
      } else if (materialKind === 'glossy') {
        // Lacquered: dielectric base + clearcoat for the "plastic gem" sheen
        Cls = THREE.MeshPhysicalMaterial;
        params.roughness = 0.45;
        params.metalness = 0.0;
        params.clearcoat = 1.0;
        params.clearcoatRoughness = 0.05;
        params.envMapIntensity = 1.0;
        params.reflectivity = 0.5;
      } else if (materialKind === 'metallic') {
        params.roughness = 0.28;
        params.metalness = 1.0;
        params.envMapIntensity = 1.4;
      } else if (materialKind === 'translucent') {
        Cls = THREE.MeshPhysicalMaterial;
        params.color = new THREE.Color('#ffffff');
        params.roughness = 0.08;
        params.metalness = 0.0;
        params.transmission = 1.0;
        params.thickness = 1.2;
        params.ior = 1.55;
        params.attenuationDistance = 1.2;
        params.attenuationColor = new THREE.Color(c.body);
        params.clearcoat = 1.0;
        params.clearcoatRoughness = 0.05;
        params.transparent = true;
        params.envMapIntensity = 1.2;
      }
      return new Cls(params);
    });
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
        gravity: 34,
        customColor: '#5a87c2',
      }, opts);
      this.dice = [];
      this.onSettled = null;
      this._rolling = false;
      this._settleTimer = 0;
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

      // Pseudo-env for reflections (a simple gradient texture as scene.environment)
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.Scene();
      // big sphere with gradient
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

      // Camera
      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.camera.position.set(0, 16, 11);
      this.camera.lookAt(0, 0, 0);

      // Lights
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

      // Table
      const tableGeom = new THREE.CircleGeometry(12, 64);
      const tableMat = new THREE.MeshStandardMaterial({
        color: this.opts.tableColor, roughness: 0.95, metalness: 0.0,
      });
      const table = new THREE.Mesh(tableGeom, tableMat);
      table.rotation.x = -Math.PI / 2;
      table.receiveShadow = true;
      this.scene.add(table);
      this.table = table;

      // Decorative trim ring
      const ringGeom = new THREE.RingGeometry(11.6, 12.0, 96);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 0.85 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.002;
      this.scene.add(ring);
      this._ring = ring;

      // Physics
      this.bounds = 8.5;
      this.world = new CANNON.World();
      this.world.gravity.set(0, -this.opts.gravity, 0);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 18;
      this.world.allowSleep = true;
      this.world.defaultContactMaterial.restitution = 0.32;
      this.world.defaultContactMaterial.friction = 0.45;

      // Ground plane (physics)
      const ground = new CANNON.Body({ mass: 0 });
      ground.addShape(new CANNON.Plane());
      ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.world.addBody(ground);

      // Octagonal walls — invisible
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

      // Resize
      this._onResize = () => {
        const nw = c.clientWidth || window.innerWidth;
        const nh = c.clientHeight || window.innerHeight;
        this.renderer.setSize(nw, nh, false);
        this.camera.aspect = nw / nh;
        this.camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', this._onResize);

      // Camera controls (orbit + zoom)
      this._initControls();
    }

    _initControls() {
      const canvas = this.canvas;
      this.cameraTarget = new THREE.Vector3(0, 0, 0);
      const p = this.camera.position;
      this.cameraDist = p.length();
      // azimuth: rotation around Y axis; polar: angle from +Y axis
      this.cameraAzimuth = Math.atan2(p.x, p.z);
      const horiz = Math.hypot(p.x, p.z);
      this.cameraPolar = Math.atan2(horiz, p.y);
      this._homePolar = this.cameraPolar;
      this._homeAzimuth = this.cameraAzimuth;
      this._homeDist = this.cameraDist;

      const POLAR_MIN = 0.12;          // ≈ 7° from straight down
      const POLAR_MAX = 1.40;          // ≈ 80°, just above horizon
      const DIST_MIN = 6;
      const DIST_MAX = 38;

      let dragging = false;
      let lastX = 0, lastY = 0;
      let pinchStart = null;
      let movedSincePress = 0;
      let lastClick = 0;

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
        dragging = true;
        movedSincePress = 0;
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
        movedSincePress += Math.abs(dx) + Math.abs(dy);
        this.cameraAzimuth -= dx * 0.008;
        this.cameraPolar = clamp(this.cameraPolar + dy * 0.006, POLAR_MIN, POLAR_MAX);
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
      // Clamp between 5 and 14
      radius = Math.max(5, Math.min(14, radius));
      this.bounds = radius;
      // Move walls
      for (const w of this._walls) {
        w.body.position.set(Math.cos(w.angle) * radius, 0, Math.sin(w.angle) * radius);
      }
      // Resize visual table and ring
      const s = radius / 12; // 12 was the original radius
      this.table.scale.set(s, s, s);
      if (this._ring) this._ring.scale.set(s, s, s);
    }

    // Tilt gravity to simulate device tilt (ax, az in m/s², base gravity magnitude)
    setGravityTilt(ax, az) {
      const g = this.opts.gravity;
      // ax/az from accelerometer: when device tilts right, ax goes positive → push dice left
      this.world.gravity.set(-ax * 2.2, -g, az * 2.2);
      for (const d of this.dice) d.body.wakeUp();
    }

    resetGravity() {
      this.world.gravity.set(0, -this.opts.gravity, 0);
    }

    setOptions(opts) {
      const rebuildMats = (
        (opts.colorPreset && opts.colorPreset !== this.opts.colorPreset) ||
        (opts.materialKind && opts.materialKind !== this.opts.materialKind) ||
        (opts.numberFont && opts.numberFont !== this.opts.numberFont) ||
        (opts.numberColor && opts.numberColor !== this.opts.numberColor) ||
        (opts.numberSize !== undefined && opts.numberSize !== this.opts.numberSize) ||
        (opts.numberWeight !== undefined && opts.numberWeight !== this.opts.numberWeight) ||
        (opts.customColor && opts.customColor !== this.opts.customColor)
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
        // Wake all bodies so gravity change applies immediately
        for (const d of this.dice) d.body.wakeUp();
      }
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
    }

    roll(strength = 1.0) {
      if (this.dice.length === 0) return;
      this._rolling = true;
      this._settleTimer = 0;
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
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
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
          if (this._settleTimer > 18) { // ~0.3s of stillness
            this._rolling = false;
            this.dice.forEach(d => { d.value = this._readDieValue(d); d.settled = true; });
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
  }

  window.DiceEngine = DiceEngine;
  window.DICE_COLORS = COLOR_PRESETS;
})();
