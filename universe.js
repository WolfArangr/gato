// ========= Three.js Universe actualizado: Sol central, planetas (categorías) y lunas (links)
// Requisitos aplicados: sin líneas de órbita, órbitas no fijas, texturas procedurales,
// color de 'halo' aplicado desde DB, click centra la cámara y muestra nombre abajo,
// modo juego con gravedad, controles invertidos corregidos, móvil optimizado.

// Nota: requiere THREE.js incluido en la página y contenedores HTML:
// - <div id="canvas-container"></div>
// - <div id="loading">Cargando...</div>
// - <div id="bottom-label" class="bottom-label"></div>
// - <button id="game-toggle">Modo Juego</button>
// - Opcional: estilos CSS para .bottom-label etc. (asegúrate que existan)

let scene, camera, renderer;
let raycaster, mouse = new THREE.Vector2();
let isDragging = false;
let previousPointer = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let targetCamera = null;
let cameraLerpSpeed = 0.08;
let allBodies = []; // cuerpos dinámicos para física (planetas + lunas)
let sun = null;
let planets = []; // planet objects (with moons)
let maxPhysicsBodies = 60; // límite para móvil
let physicsEnabled = false;
let lastPhysicsTime = performance.now();
let timeScale = 1.0; // escalado tiempo física
let deviceIsMobile = /Mobi|Android/i.test(navigator.userAgent);

// parámetros para ergonomía móvil
const ROTATION_SENSITIVITY = deviceIsMobile ? 0.006 : 0.005;
const TOUCH_ROTATION_SENSITIVITY = deviceIsMobile ? 0.01 : 0.008;

// ===================================================================================
// Utilidades: textura procedural (planeta/luna) y canvas flame para el sol
// ===================================================================================

function generateNoiseCanvas(size = 512, scale = 6, seed = Math.random()) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    // simple noise (value noise)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // pseudo-random based on coordinates + seed
            const n = Math.floor((Math.abs(Math.sin((x * 12.9898 + y * 78.233 + seed * 43758.5453))) * 43758.5453) % 255);
            img.data[i] = n;
            img.data[i + 1] = n;
            img.data[i + 2] = n;
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    // blur by draw scaled down/up to create smoother noise
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = size / scale;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(c, 0, 0, tmp.width, tmp.height);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, size, size);
    return c;
}

function createPlanetTexture(type = 'planet', colorHalo = '#ffffff') {
    // returns THREE.Texture
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // base gradient
    const g = ctx.createRadialGradient(size * 0.35, size * 0.35, size * 0.05, size * 0.5, size * 0.5, size * 0.6);
    if (type === 'planet') {
        g.addColorStop(0, '#999999');
        g.addColorStop(0.4, '#666666');
        g.addColorStop(1, '#222222');
    } else { // moon
        g.addColorStop(0, '#eeeeee');
        g.addColorStop(0.6, '#bdbdbd');
        g.addColorStop(1, '#888888');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // draw noise overlay from generated noise
    const noise = generateNoiseCanvas(size, 8, Math.random());
    ctx.globalAlpha = 0.25;
    ctx.drawImage(noise, 0, 0, size, size);
    ctx.globalAlpha = 1;

    // some craters / features for a moon or continents for a planet
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    if (type === 'moon') {
        for (let i = 0; i < 40; i++) {
            const r = 6 + Math.random() * 40;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // continents
        ctx.fillStyle = 'rgba(30,30,30,0.12)';
        for (let i = 0; i < 12; i++) {
            const w = 60 + Math.random() * 180;
            const h = 40 + Math.random() * 140;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // halo (atmosphere) — we do a transparent radial halo that will be used separately on a sprite
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = size;
    const hctx = haloCanvas.getContext('2d');
    const haloGrad = hctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size*0.6);
    haloGrad.addColorStop(0, hexToRgba(colorHalo, 0.65));
    haloGrad.addColorStop(0.6, hexToRgba(colorHalo, 0.12));
    haloGrad.addColorStop(1, hexToRgba(colorHalo, 0.0));
    hctx.fillStyle = haloGrad;
    hctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.needsUpdate = true;
    haloTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    return { map: tex, halo: haloTex };
}

function hexToRgba(hex, a = 1) {
    // supports '#rrggbb' or '#rgb'
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
}

// flame canvas for sun (animated)
function createFlameCanvas(size = 512) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
}
const flameCanvas = createFlameCanvas(512);
const flameCtx = flameCanvas.getContext('2d');

function updateFlameCanvas(t) {
    const w = flameCanvas.width, h = flameCanvas.height;
    flameCtx.clearRect(0, 0, w, h);
    // animated radial flames using sin patterns
    const centerX = w/2, centerY = h/2;
    for (let i = 0; i < 14; i++) {
        const a = (t*0.002 + i) * (0.8 + (i%3)*0.2);
        const amp = 0.15 + (i%4)*0.05;
        flameCtx.beginPath();
        flameCtx.moveTo(centerX, centerY);
        for (let theta = 0; theta <= Math.PI*2; theta += 0.02) {
            const r = (w*0.45)*(0.75 + Math.sin(theta*3 + a) * amp * Math.sin(t*0.003 + i));
            const x = centerX + Math.cos(theta)*r;
            const y = centerY + Math.sin(theta)*r;
            flameCtx.lineTo(x, y);
        }
        flameCtx.closePath();
        const grad = flameCtx.createRadialGradient(centerX, centerY, w*0.05, centerX, centerY, w*0.55);
        const alpha = 0.06 + (i%3)*0.02;
        grad.addColorStop(0, `rgba(255,230,120,${alpha})`);
        grad.addColorStop(0.6, `rgba(255,100,30,${alpha*0.6})`);
        grad.addColorStop(1, `rgba(100,20,0,0)`);
        flameCtx.fillStyle = grad;
        flameCtx.fill();
    }
}

// ===================================================================================
// Inicialización escena, cámara y renderer
// ===================================================================================

function init() {
    // scene & fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000006, 0.00025);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 200, 700);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // luz ambiente
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    // carga datos y crea universo
    loadData();

    // eventos de interacción
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick, { passive: false });

    // touch gestures fallback (pointer handles most)
    document.getElementById('game-toggle').addEventListener('click', togglePhysicsMode);

    animate();
}

// ===================================================================================
// CARGA de Datos (asume basedatosconstelacion.json en mismo host)
// ===================================================================================

async function loadData() {
    try {
        const res = await fetch('basedatosconstelacion.json');
        const data = await res.json();
        // build universe
        createUniverseFromData(data);
        const loadElem = document.getElementById('loading');
        if (loadElem) loadElem.classList.add('hidden');
    } catch (err) {
        console.error('Error cargando datos:', err);
        const loadElem = document.getElementById('loading');
        if (loadElem) loadElem.innerHTML = '<p>Error cargando basedatosconstelacion.json</p>';
    }
}

// ===================================================================================
// Crear Universo: SOL central, planetas (categorías) y lunas (links)
// ===================================================================================

function createUniverseFromData(data) {
    // crear sol central grande con llamas (sprite + sphere con emissive)
    sun = createSun();
    scene.add(sun.group);

    // Disponer planetas alrededor del sol
    const categories = data.categories || [];
    const angleStep = (Math.PI * 2) / Math.max(1, categories.length);
    const baseRadius = 280;

    categories.forEach((cat, i) => {
        const angle = angleStep * i + (Math.random() - 0.5)*0.4;
        const dist = baseRadius + i * 30 + Math.random() * 80;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = (Math.random() - 0.5) * 60;

        const planetObj = createPlanetFromCategory(cat, new THREE.Vector3(x,y,z), i);
        scene.add(planetObj.group);
        planets.push(planetObj);

        // convertir links en lunas
        cat.links = cat.links || [];
        cat.links.forEach((link, li) => {
            const moon = createMoonFromLink(link, planetObj, li, cat.links.length);
            planetObj.group.add(moon.mesh);
            planetObj.moons.push(moon);
        });
    });

    // build static list of bodies for physics (limited)
    rebuildPhysicsBodiesList();
}

// ===================================================================================
// Crear SOL con llamas animadas y click al enlace
// ===================================================================================

function createSun() {
    const g = new THREE.Group();

    // esfera emisiva central
    const sunGeom = new THREE.SphereGeometry(60, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd80, transparent: false });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    g.add(sunMesh);

    // add emissive shader-like layer using sprite (canvas)
    const flameTex = new THREE.CanvasTexture(flameCanvas);
    flameTex.minFilter = THREE.LinearFilter;
    const flameMat = new THREE.SpriteMaterial({
        map: flameTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const flameSprite = new THREE.Sprite(flameMat);
    flameSprite.scale.set(220, 220, 1);
    flameSprite.position.set(0,0,0);
    g.add(flameSprite);

    // clickable invisible sphere for raycasting (userData)
    const picker = new THREE.Mesh(new THREE.SphereGeometry(62, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    picker.userData = { type: 'sun', name: 'Sol', url: 'http://www.gato.red/' };
    g.add(picker);

    return {
        group: g,
        mesh: sunMesh,
        sprite: flameSprite,
        flameTex
    };
}

// ===================================================================================
// Crear Planet (desde categoría)
// ===================================================================================

function createPlanetFromCategory(category, worldPos, index) {
    const group = new THREE.Group();
    group.position.copy(worldPos);

    const radius = 18 + Math.random() * 18 + (index % 3) * 4;
    const geom = new THREE.SphereGeometry(radius, 48, 48);

    // generar textura procedural y halo
    const col = category.color ? (typeof category.color === 'number' ? ('#' + category.color.toString(16).padStart(6,'0')) : category.color) : '#7fb3ff';
    const textures = createPlanetTexture('planet', col);

    const mat = new THREE.MeshStandardMaterial({
        map: textures.map,
        roughness: 1.0,
        metalness: 0.0
    });
    const planetMesh = new THREE.Mesh(geom, mat);
    planetMesh.userData = {
        type: 'planet',
        name: category.name || 'Planeta',
        category: category.name || 'categoria',
        colorHalo: col,
        radius,
        isPlanet: true,
        db: category
    };

    // halo sprite
    const haloMat = new THREE.SpriteMaterial({ map: textures.halo, transparent: true, depthWrite: false });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(radius*6, radius*6, 1);
    halo.renderOrder = 0;

    // small axis / inclination random (used for non-fixed orbit wobble)
    const orbitParams = {
        center: sun.group.position.clone(),
        baseRadius: group.position.distanceTo(sun.group.position),
        angle: Math.random()*Math.PI*2,
        speed: 0.0006 + Math.random()*0.0009,
        tilt: (Math.random()-0.5)*0.4,
        eccentricity: 0.9 + Math.random()*0.4,
        wobbleAmp: 0.8 + Math.random()*1.8
    };

    group.add(planetMesh);
    group.add(halo);
    group.userData = {
        orbit: orbitParams,
        isPlanetGroup: true
    };

    // for physics and interactions
    const body = {
        mesh: planetMesh,
        group,
        mass: radius * radius * 0.6,
        radius,
        velocity: new THREE.Vector3(0,0,0),
        type: 'planet',
        name: category.name
    };

    allBodiesPush(body);

    return {
        group,
        mesh: planetMesh,
        halo,
        orbitParams,
        moons: [],
        body
    };
}

// ===================================================================================
// Crear LUNA (desde link) — orbitando alrededor de su planeta
// ===================================================================================

function createMoonFromLink(link, planetObj, index, total) {
    const moonRadius = 4 + Math.random()*6;
    const geom = new THREE.SphereGeometry(moonRadius, 32, 32);
    const textures = createPlanetTexture('moon', link.color || '#bbbbbb');
    const mat = new THREE.MeshStandardMaterial({
        map: textures.map,
        roughness: 1.0,
        metalness: 0.0
    });
    const mesh = new THREE.Mesh(geom, mat);

    // initial relative position around planet
    const angle = Math.random()*Math.PI*2;
    const dist = 30 + index*12 + Math.random()*18 + (total*2);
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    mesh.position.set(rx, (Math.random()-0.5)*8, rz);
    mesh.userData = {
        type: 'moon',
        name: link.name || 'Luna',
        url: link.url || null,
        parentPlanet: planetObj.group,
        relOrbitRadius: dist,
        relAngle: angle,
        relSpeed: 0.003 + Math.random()*0.004,
        colorHalo: link.color || '#aaaaaa'
    };

    // halo for moon (sprite)
    const haloMat = new THREE.SpriteMaterial({ map: textures.halo, transparent: true, depthWrite: false });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(moonRadius*5, moonRadius*5, 1);
    halo.position.set(mesh.position.x*1.02, mesh.position.y*1.02, mesh.position.z*1.02);
    mesh.add(halo);

    // physics body
    const body = {
        mesh,
        group: planetObj.group,
        mass: moonRadius * moonRadius * 0.4,
        radius: moonRadius,
        velocity: new THREE.Vector3((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.2),
        type: 'moon',
        name: link.name,
        url: link.url
    };

    allBodiesPush(body);

    return {
        mesh,
        halo,
        body
    };
}

// ===================================================================================
// Manejadores de interacción: mouse/pointer/touch
// - He corregido la inversión: ahora mover el ratón a la derecha gira la vista hacia la derecha
// ===================================================================================

function onPointerDown(e) {
    isDragging = true;
    previousPointer = { x: e.clientX, y: e.clientY };
    renderer.domElement.style.cursor = 'grabbing';
}

function onPointerMove(e) {
    if (isDragging) {
        const dx = e.clientX - previousPointer.x;
        const dy = e.clientY - previousPointer.y;
        // CORRECCIÓN: signos orientados a comportamiento intuitivo
        cameraRotation.y -= dx * ROTATION_SENSITIVITY; // invertido respecto al anterior (intuitivo)
        cameraRotation.x -= dy * ROTATION_SENSITIVITY;
        cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.x));
        const dist = camera.position.length();
        camera.position.x = dist * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = dist * Math.sin(cameraRotation.x);
        camera.position.z = dist * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(0,0,0);
        previousPointer = { x: e.clientX, y: e.clientY };
    }
}

function onPointerUp(e) {
    isDragging = false;
    renderer.domElement.style.cursor = 'auto';
}

// rueda zoom
function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY * 0.2;
    const dist = camera.position.length();
    const newDist = Math.max(120, Math.min(4000, dist + delta));
    camera.position.normalize().multiplyScalar(newDist);
}

// click / tap: raycast sobre meshes; planet -> center on planet + show bottom label; sun -> open link
function onClick(event) {
    // identify click position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // raycast against all meshes in scene (but faster to test bodies/planets and sun)
    const clickable = [];
    // sun's picker
    sun.group.traverse(node => { if (node.userData && (node.userData.type === 'sun')) clickable.push(node); });
    // planets & moons
    planets.forEach(p => {
        p.group.traverse(n => {
            if (n.userData && (n.userData.type === 'planet' || n.userData.type === 'moon')) clickable.push(n);
        });
    });

    const intersects = raycaster.intersectObjects(clickable, true);
    if (intersects.length === 0) return;

    const obj = intersects[0].object;
    const d = obj.userData || {};

    if (d.type === 'sun') {
        // abrir link
        if (d.url) window.open(d.url, '_blank');
        return;
    }

    if (d.type === 'planet') {
        // find the parent group for planet and center camera above it
        const planetGroup = findPlanetGroupByMesh(obj);
        if (planetGroup) {
            focusOnObject(planetGroup.group, { showBottomLabel: true, labelText: d.name });
        }
        return;
    }
    if (d.type === 'moon') {
        // focus on moon world position (mesh is child of planet)
        focusOnObject(obj, { showBottomLabel: true, labelText: d.name, url: d.url });
        return;
    }
}

function findPlanetGroupByMesh(mesh) {
    for (let p of planets) {
        if (p.mesh === mesh || p.mesh === mesh || p.group.children.includes(mesh) ) return p;
    }
    return null;
}

// centra la cámara hacia un objecto (obj puede ser Group o Mesh)
function focusOnObject(obj, opts = {}) {
    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    // position the camera a bit offset from the object along the camera direction so the object is centered
    const dir = camera.position.clone().sub(new THREE.Vector3(0,0,0)).normalize();
    // compute a target position relative to worldPos
    const offset = new THREE.Vector3(0, Math.max(40, obj.userData?.radius || 60) * 2, Math.max(140, obj.userData?.radius || 60) * 1.5);
    const pos = new THREE.Vector3(worldPos.x + offset.x, worldPos.y + offset.y, worldPos.z + offset.z);
    targetCamera = { position: pos, lookAt: worldPos, options: opts };

    // if asked, show bottom label
    if (opts.showBottomLabel) showBottomLabel(opts.labelText || 'Objeto', obj);
}

function showBottomLabel(text, obj = null) {
    let el = document.getElementById('bottom-label');
    if (!el) {
        el = document.createElement('div');
        el.id = 'bottom-label';
        el.className = 'bottom-label';
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = 'block';
    // approx position: center bottom
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.bottom = '8px';
}

// ===================================================================================
// Física simplificada: N-body gravitation (pairwise), con fusión por colisiones
// - Activado por toggle. Diseñado para ser simple y costo controlado.
// ===================================================================================

function allBodiesPush(body) {
    // mantiene la lista limitada
    if (!allBodies) allBodies = [];
    if (allBodies.length < maxPhysicsBodies) allBodies.push(body);
    else {
        // si supera, intenta reemplazar los más pequeños
        const minIdx = allBodies.reduce((mi, b, i, a) => (b.mass < a[mi].mass ? i : mi), 0);
        if (body.mass > allBodies[minIdx].mass) allBodies[minIdx] = body;
    }
}

function rebuildPhysicsBodiesList() {
    allBodies = [];
    planets.forEach(p => {
        if (p.body) allBodiesPush(p.body);
        p.moons.forEach(m => { if (m.body) allBodiesPush(m.body); });
    });
    // cap for mobiles
    if (deviceIsMobile && allBodies.length > 40) allBodies = allBodies.slice(0, 40);
}

function togglePhysicsMode() {
    physicsEnabled = !physicsEnabled;
    const btn = document.getElementById('game-toggle');
    if (btn) btn.textContent = physicsEnabled ? 'Modo Juego: ON' : 'Modo Juego: OFF';
    // when enabling physics, convert orbital velocities to initial velocities
    if (physicsEnabled) initializePhysicsVelocities();
    lastPhysicsTime = performance.now();
}

function initializePhysicsVelocities() {
    // set circular-ish velocities for bodies relative to their main attractor (sun for planets, planet for moons)
    const G = 0.5; // gravitational constant fudge
    allBodies.forEach(b => {
        if (b.type === 'planet') {
            const pos = new THREE.Vector3();
            b.group.getWorldPosition(pos);
            const r = pos.distanceTo(sun.group.position);
            const speed = Math.sqrt(G * (sun.mesh ? (sun.mesh.geometry.parameters.radius*500) : 1000) / Math.max(1, r)); // approximate
            // direction perpendicular to radius (simple)
            const dir = new THREE.Vector3().subVectors(pos, sun.group.position).normalize();
            const perp = new THREE.Vector3(-dir.z, 0, dir.x);
            b.velocity.copy(perp.multiplyScalar(speed * (0.6 + Math.random()*0.8)));
        } else if (b.type === 'moon') {
            // orbit around its parent planet
            const worldPos = new THREE.Vector3();
            b.mesh.getWorldPosition(worldPos);
            const parent = b.group;
            const parentWorld = new THREE.Vector3();
            parent.getWorldPosition(parentWorld);
            const r = worldPos.distanceTo(parentWorld);
            const speed = Math.sqrt(0.5 * (b.mass + parent.userData?.radius || 100) / Math.max(1, r));
            const dir = new THREE.Vector3().subVectors(worldPos, parentWorld).normalize();
            const perp = new THREE.Vector3(-dir.z, 0, dir.x);
            b.velocity.copy(perp.multiplyScalar(speed));
        } else {
            b.velocity.set((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.02, (Math.random()-0.5)*0.2);
        }
    });
}

// physics step (semi-implicit Euler)
function physicsStep(dt) {
    // dt in seconds
    const G = 6.674e-2; // scaled gravitational constant; tuned for visual results
    // build positions in world coords
    const worldPositions = allBodies.map(b => {
        const p = new THREE.Vector3();
        if (b.mesh) b.mesh.getWorldPosition(p);
        return p;
    });

    // pairwise forces
    for (let i = 0; i < allBodies.length; i++) {
        const bi = allBodies[i];
        const pi = worldPositions[i];
        if (!bi.velocity) bi.velocity = new THREE.Vector3();
        let acc = new THREE.Vector3(0,0,0);
        for (let j = 0; j < allBodies.length; j++) {
            if (i === j) continue;
            const bj = allBodies[j];
            const pj = worldPositions[j];
            const rVec = new THREE.Vector3().subVectors(pj, pi);
            const dist = rVec.length();
            if (dist < 0.0001) continue;
            const forceMag = (G * bi.mass * bj.mass) / (dist * dist + 10); // softening
            acc.add(rVec.normalize().multiplyScalar(forceMag / bi.mass));
        }
        // update velocity
        bi.velocity.add(acc.multiplyScalar(dt * timeScale));
    }

    // integrate positions and handle collisions
    for (let i = 0; i < allBodies.length; i++) {
        const b = allBodies[i];
        // new world position = old + v*dt
        const worldPos = new THREE.Vector3();
        b.mesh.getWorldPosition(worldPos);
        worldPos.add(b.velocity.clone().multiplyScalar(dt * timeScale));

        // apply new world position: if body is a planet (group) we move its group, else set local position if moon
        if (b.type === 'planet') {
            // place group at new world pos
            b.group.position.copy(worldPos);
        } else if (b.type === 'moon') {
            // set absolute position by updating world position via parent offset
            // simplest: convert worldPos to parent's local by parent.worldToLocal
            const parent = b.group;
            parent.worldToLocal(worldPos.clone());
            b.mesh.position.copy(worldPos);
        } else {
            // generic
            b.mesh.position.copy(worldPos);
        }
    }

    // collisions (merge)
    const toRemove = new Set();
    for (let i = 0; i < allBodies.length; i++) {
        for (let j = i+1; j < allBodies.length; j++) {
            const a = allBodies[i], b = allBodies[j];
            const pa = new THREE.Vector3(); a.mesh.getWorldPosition(pa);
            const pb = new THREE.Vector3(); b.mesh.getWorldPosition(pb);
            const dist = pa.distanceTo(pb);
            if (dist < (a.radius + b.radius) * 0.9) {
                // merge smaller into larger
                const large = (a.mass >= b.mass) ? a : b;
                const small = (a.mass >= b.mass) ? b : a;
                // new mass & velocity (momentum conservation)
                const newMass = large.mass + small.mass;
                const newVel = large.velocity.clone().multiplyScalar(large.mass).add(small.velocity.clone().multiplyScalar(small.mass)).divideScalar(newMass);
                large.mass = newMass;
                large.velocity = newVel;
                // adjust radius visually
                large.radius = Math.cbrt(large.radius**3 + small.radius**3) * 0.98;
                if (large.mesh.geometry.type === 'SphereGeometry') {
                    large.mesh.geometry = new THREE.SphereGeometry(Math.max(2, large.radius), 48, 48);
                }
                // remove small
                toRemove.add(small);
            }
        }
    }
    if (toRemove.size > 0) {
        // physically remove from scene and from allBodies
        for (let s of toRemove) {
            if (s.mesh && s.mesh.parent) s.mesh.parent.remove(s.mesh);
            const idx = allBodies.indexOf(s);
            if (idx >= 0) allBodies.splice(idx,1);
        }
    }
}

// ===================================================================================
// Animate loop
// ===================================================================================

function animate(time) {
    requestAnimationFrame(animate);

    // update flame canvas and apply to texture
    updateFlameCanvas(time);
    if (sun && sun.sprite && sun.sprite.material.map) {
        sun.sprite.material.map.needsUpdate = true;
    }

    // orbital motion when physics disabled (orbits "not fijas" = wobble + animation)
    if (!physicsEnabled) {
        planets.forEach(p => {
            const o = p.orbitParams;
            o.angle += o.speed * (1 + Math.sin(time*0.0003 + o.angle)*0.6);
            const r = o.baseRadius * o.eccentricity * (0.98 + Math.sin(time*0.001 + o.angle)*0.01);
            const x = Math.cos(o.angle) * r;
            const z = Math.sin(o.angle) * r;
            const y = Math.sin(o.angle*1.3) * o.wobbleAmp * 6 + Math.sin(time*0.0005 + o.angle)*6 * o.tilt;
            // apply world position (around sun)
            p.group.position.set(sun.group.position.x + x, sun.group.position.y + y, sun.group.position.z + z);
            // rotate planet on its axis
            p.mesh.rotation.y += 0.002 + 0.001 * Math.sin(time*0.001 + o.angle);
            // halo subtle pulse
            if (p.halo) p.halo.scale.set(p.body.radius*6*(1+Math.sin(time*0.001+o.angle)*0.02), p.body.radius*6*(1+Math.sin(time*0.001+o.angle)*0.02),1);
            // update moons relative motion (non-physics)
            p.moons.forEach(m => {
                const md = m.mesh.userData;
                md.relAngle += md.relSpeed * (1 + Math.sin(time*0.001 + md.relAngle)*0.3);
                const rx = Math.cos(md.relAngle) * md.relOrbitRadius;
                const rz = Math.sin(md.relAngle) * md.relOrbitRadius;
                const ry = Math.sin(md.relAngle*1.7) * 3;
                m.mesh.position.set(rx, ry, rz);
                // update halo position on moon
                if (m.halo) m.halo.position.set(rx*1.02, ry*1.02, rz*1.02);
                m.mesh.rotation.y += 0.004;
            });
        });
    } else {
        // physics mode
        const now = performance.now();
        let dt = (now - lastPhysicsTime) * 0.001; // seconds
        lastPhysicsTime = now;
        // clamp dt
        dt = Math.min(0.05, dt);
        physicsStep(dt * 1.0);
    }

    // camera interpolation to target
    if (targetCamera) {
        camera.position.lerp(targetCamera.position, cameraLerpSpeed);
        camera.lookAt(targetCamera.lookAt);
        // stop condition
        if (camera.position.distanceTo(targetCamera.position) < 1.2) {
            targetCamera = null;
        }
    }

    renderer.render(scene, camera);
}

// ===================================================================================
// Helpers y utilidades
// ===================================================================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===================================================================================
// Inicializar
// ===================================================================================

window.addEventListener('load', init);
