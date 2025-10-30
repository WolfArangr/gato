// exploracion_mod.js - Versión modificada con mejoras solicitadas
// Basado en exploracion.js original. Fuente: :contentReference[oaicite:1]{index=1}

// ==================== CONFIGURACIÓN GLOBAL ====================
const SOLAR_SYSTEM_SIMPLE = {
    sun: { distance: 0, size: 40, texture: 'estrella.png', color: 0xffffaa, moons: [] },
    mercury: { distance: 580, size: 2.4, texture: 'planeta3.png', color: 0x8c7853, speed: 0.241, moons: [] },
    venus: { distance: 1080, size: 6, texture: 'luna5.png', color: 0xffc649, speed: 0.1626, moons: [] },
    earth: { distance: 1500, size: 6, texture: 'planeta1.png', color: 0x2233ff, speed: 0.1, moons: ['moon'] },
    moon: { distance: 150, size: 2, texture: 'luna1.png', color: 0xaaaaaa, speed: 1.237, parent: 'earth' },
    mars: { distance: 2280, size: 3.2, texture: 'planeta2.png', color: 0xdc4c3c, speed: 0.0532, moons: ['phobos', 'deimos'] },
    phobos: { distance: 35, size: 0.8, texture: 'luna1.png', color: 0x998877, speed: 2.5, parent: 'mars' },
    deimos: { distance: 60, size: 0.6, texture: 'luna1.png', color: 0xaa9988, speed: 1.8, parent: 'mars' },
    jupiter: { distance: 5200, size: 18, texture: 'luna2.png', color: 0xc88b3a, speed: 0.0084, moons: ['io', 'europa', 'ganymede', 'callisto'] },
    io: { distance: 70, size: 1.8, texture: 'luna4.png', color: 0xffff00, speed: 0.8, parent: 'jupiter' },
    europa: { distance: 95, size: 1.5, texture: 'luna3.png', color: 0xccddff, speed: 0.6, parent: 'jupiter' },
    ganymede: { distance: 120, size: 2.5, texture: 'luna1.png', color: 0x998866, speed: 0.4, parent: 'jupiter' },
    callisto: { distance: 150, size: 2.3, texture: 'luna1.png', color: 0x776655, speed: 0.3, parent: 'jupiter' },
    saturn: { distance: 9540, size: 16, texture: 'planeta3.png', color: 0xfad5a5, speed: 0.0034, moons: ['titan', 'rhea', 'iapetus'] },
    titan: { distance: 100, size: 2.5, texture: 'luna5.png', color: 0xffaa66, speed: 0.5, parent: 'saturn' },
    rhea: { distance: 70, size: 1.2, texture: 'luna1.png', color: 0xaaaaaa, speed: 0.7, parent: 'saturn' },
    iapetus: { distance: 200, size: 1.1, texture: 'luna1.png', color: 0x666666, speed: 0.3, parent: 'saturn' },
    uranus: { distance: 19180, size: 8, texture: 'luna3.png', color: 0x4fd0e8, speed: 0.0012, moons: ['titania', 'oberon'] },
    titania: { distance: 60, size: 1.2, texture: 'luna1.png', color: 0x99bbcc, speed: 0.6, parent: 'uranus' },
    oberon: { distance: 80, size: 1.1, texture: 'luna1.png', color: 0x8899aa, speed: 0.5, parent: 'uranus' },
    neptune: { distance: 30070, size: 7.8, texture: 'luna2.png', color: 0x4169e1, speed: 0.0006, moons: ['triton'] },
    triton: { distance: 55, size: 1.3, texture: 'luna3.png', color: 0x99ccff, speed: 0.7, parent: 'neptune' }
};

// Escala realista (distancias en millones de km / 10, tamaños en km / 100)
const SOLAR_SYSTEM_REALISTIC = {
    sun: { distance: 0, size: 696, texture: 'estrella.png', color: 0xffffaa, moons: [] },

    mercury: { distance: 57910, size: 2.44, texture: 'planeta3.png', color: 0x8c7853, speed: 0.241, moons: [] },
    venus: { distance: 108200, size: 6.05, texture: 'luna5.png', color: 0xffc649, speed: 0.1626, moons: [] },
    earth: { distance: 149600, size: 6.37, texture: 'planeta1.png', color: 0x2233ff, speed: 0.1, moons: ['moon'] },
    moon: { distance: 0.384, size: 1.74, texture: 'luna1.png', color: 0xaaaaaa, speed: 1.237, parent: 'earth' },

    mars: { distance: 227900, size: 3.39, texture: 'planeta2.png', color: 0xdc4c3c, speed: 0.0532, moons: ['phobos', 'deimos'] },
    phobos: { distance: 0.0094, size: 0.000011, texture: 'luna1.png', color: 0x998877, speed: 2.5, parent: 'mars' },
    deimos: { distance: 0.0234, size: 0.000006, texture: 'luna1.png', color: 0xaa9988, speed: 1.8, parent: 'mars' },

    jupiter: { distance: 778500, size: 69.9, texture: 'luna2.png', color: 0xc88b3a, speed: 0.0084, moons: ['io', 'europa', 'ganymede', 'callisto'] },
    io: { distance: 0.4218, size: 1.82, texture: 'luna4.png', color: 0xffff00, speed: 0.8, parent: 'jupiter' },
    europa: { distance: 0.6711, size: 1.56, texture: 'luna3.png', color: 0xccddff, speed: 0.6, parent: 'jupiter' },
    ganymede: { distance: 1.0704, size: 2.63, texture: 'luna1.png', color: 0x998866, speed: 0.4, parent: 'jupiter' },
    callisto: { distance: 1.8827, size: 2.41, texture: 'luna1.png', color: 0x776655, speed: 0.3, parent: 'jupiter' },

    saturn: { distance: 1427000, size: 58.2, texture: 'planeta3.png', color: 0xfad5a5, speed: 0.0034, moons: ['titan', 'rhea', 'iapetus'] },
    titan: { distance: 1.222, size: 2.57, texture: 'luna5.png', color: 0xffaa66, speed: 0.5, parent: 'saturn' },
    rhea: { distance: 0.527, size: 0.763, texture: 'luna1.png', color: 0xaaaaaa, speed: 0.7, parent: 'saturn' },
    iapetus: { distance: 3.561, size: 0.734, texture: 'luna1.png', color: 0x666666, speed: 0.3, parent: 'saturn' },

    uranus: { distance: 2871000, size: 25.4, texture: 'luna3.png', color: 0x4fd0e8, speed: 0.0012, moons: ['titania', 'oberon'] },
    titania: { distance: 0.436, size: 0.789, texture: 'luna1.png', color: 0x99bbcc, speed: 0.6, parent: 'uranus' },
    oberon: { distance: 0.584, size: 0.761, texture: 'luna1.png', color: 0x8899aa, speed: 0.5, parent: 'uranus' },

    neptune: { distance: 4495000, size: 24.6, texture: 'luna2.png', color: 0x4169e1, speed: 0.0006, moons: ['triton'] },
    triton: { distance: 0.355, size: 1.35, texture: 'luna3.png', color: 0x99ccff, speed: 0.7, parent: 'neptune' }
};


const PLANET_INFO = {
    sun: { name: 'Sol', info: 'Estrella central del Sistema Solar, contiene el 99.86% de la masa total del sistema.' },
    mercury: { name: 'Mercurio', info: 'El planeta más cercano al Sol y el más pequeño del Sistema Solar.' },
    venus: { name: 'Venus', info: 'El planeta más caliente del Sistema Solar debido a su densa atmósfera de CO₂.' },
    earth: { name: 'Tierra', info: 'Nuestro hogar, el único planeta conocido con vida.' },
    moon: { name: 'Luna', info: 'El único satélite natural de la Tierra.' },
    mars: { name: 'Marte', info: 'El planeta rojo, objetivo principal de la exploración espacial.' },
    phobos: { name: 'Fobos', info: 'La luna más grande de Marte, con forma irregular.' },
    deimos: { name: 'Deimos', info: 'La luna más pequeña de Marte.' },
    jupiter: { name: 'Júpiter', info: 'El gigante gaseoso más grande del Sistema Solar.' },
    io: { name: 'Ío', info: 'La luna más volcánicamente activa del Sistema Solar.' },
    europa: { name: 'Europa', info: 'Luna con océano subsuperficial, candidata para vida extraterrestre.' },
    ganymede: { name: 'Ganimedes', info: 'La luna más grande del Sistema Solar, mayor que Mercurio.' },
    callisto: { name: 'Calisto', info: 'Una de las lunas galileanas de Júpiter.' },
    saturn: { name: 'Saturno', info: 'Famoso por su espectacular sistema de anillos.' },
    titan: { name: 'Titán', info: 'La única luna con atmósfera densa, contiene lagos de metano.' },
    rhea: { name: 'Rea', info: 'La segunda luna más grande de Saturno.' },
    iapetus: { name: 'Jápeto', info: 'Luna con dos caras: una clara y otra oscura.' },
    uranus: { name: 'Urano', info: 'El gigante de hielo que rota de lado.' },
    titania: { name: 'Titania', info: 'La luna más grande de Urano.' },
    oberon: { name: 'Oberón', info: 'Una de las cinco lunas principales de Urano.' },
    neptune: { name: 'Neptuno', info: 'El planeta más alejado del Sol, con los vientos más rápidos.' },
    triton: { name: 'Tritón', info: 'Luna que orbita en dirección contraria a la rotación de Neptuno.' }
};

// ==================== ESTADO ====================
let state = {
    currentPlanet: 'earth',
    targetPlanet: null,
    traveling: false,
    travelStartTime: null,
    travelDuration: 0,
    travelOrigin: null,
    decoupled: false,
    timeScale: 1, // 1, 60, 3600
    orbitDistance: 100,
    minOrbitDistance: 10,
    maxOrbitDistance: 500,
    realisticMode: false,
    atmosphere: false,         // modo atmosférico (on/off)
    atmosphereIntensity: 0,    // 0..1 para interpolar efectos
    cinematic: false,
    audioEnabled: true
};

// ==================== THREE.JS SETUP ====================
let scene, camera, renderer;
let planets = {};
let spaceship = null;
let shipLights = []; // luces de la nave (controladas)
let shipGlows = [];  // meshes de glow (opacidad variable)
let touchStartPos = null;
let lastTouchPos = null;
let lastPinchDist = null;
let cameraAngle = 0;
let cameraHeight = 50;

// Control manual
let shipVelocity = new THREE.Vector3(0, 0, 0);
let joystickActive = false;
let joystickDelta = { x: 0, y: 0 };

// Audio (viento)
let audioCtx = null;
let windGain = null;
let windNoiseSource = null;

function initAudio() {
    if (!state.audioEnabled) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // crear buffer de ruido blanco
        const bufferSize = audioCtx.sampleRate * 1; // 1s buffer
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        windNoiseSource = audioCtx.createBufferSource();
        windNoiseSource.buffer = buffer;
        windNoiseSource.loop = true;

        // filtro pasa bajos para "suavizar" el viento
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        windGain = audioCtx.createGain();
        windGain.gain.value = 0;

        windNoiseSource.connect(filter);
        filter.connect(windGain);
        windGain.connect(audioCtx.destination);

        windNoiseSource.start(0);
    } catch (e) {
        console.warn('AudioContext no disponible:', e);
        audioCtx = null;
    }
}

function setWindVolume(v) {
    if (!audioCtx || !windGain) return;
    const vol = Math.max(0, Math.min(1, v));
    windGain.gain.linearRampToValueAtTime(vol * 0.6, audioCtx.currentTime + 0.05);
}

// ==================== INICIALIZACIÓN THREE ====================
function initThreeJS() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('gameCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000000);
    camera.position.set(100, 50, 100);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);

    // luz direccional (sol)
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.userData.sunLight = sunLight;

    // niebla inicial (se usará para atmósfera)
    scene.fog = null;

    createStarfield();
    createSpaceship();
    createSolarSystem();

    window.addEventListener('resize', onWindowResize);

    const canvas = document.getElementById('gameCanvas');
    // táctil con passive false para evitar scroll
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Controles de órbita botones (con soporte atmósfera si ya en min)
    document.getElementById('orbitIn').addEventListener('click', () => {
        if (!state.decoupled) {
            if (state.orbitDistance <= state.minOrbitDistance + 0.1) {
                // activar / desactivar modo atmósfera automaticamente
                toggleAtmosphere(true);
            } else {
                state.orbitDistance = Math.max(state.minOrbitDistance, state.orbitDistance - 20);
            }
        }
    });

    document.getElementById('orbitOut').addEventListener('click', () => {
        if (!state.decoupled) {
            if (state.atmosphere) toggleAtmosphere(false);
            state.orbitDistance = Math.min(state.maxOrbitDistance, state.orbitDistance + 20);
        }
    });

    // Botón Decouple
    document.getElementById('decoupleBtn').addEventListener('click', toggleDecouple);

    // Botón escala de tiempo
    document.getElementById('timeScaleBtn').addEventListener('click', cycleTimeScale);

    // Botón modo realista/simple
    document.getElementById('scaleBtn').addEventListener('click', toggleScaleMode);

    // Joystick mouse drag original (mejorado para no modificar distancia)
    let isDragging = false;
    let lastMousePos = null;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && lastMousePos) {
            const deltaX = e.clientX - lastMousePos.x;
            const deltaY = e.clientY - lastMousePos.y;

            // Corrección del zoom indeseado: NO tocar orbitDistance aquí.
            // Solo rotamos la cámara y ajustamos altura (con límites).
            cameraAngle -= deltaX * 0.01;
            cameraHeight = Math.max(5, Math.min(200, cameraHeight + deltaY * 0.2));

            lastMousePos = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        lastMousePos = null;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        lastMousePos = null;
    });

    // Joystick virtual
    setupJoystick();

    // init audio
    initAudio();
    updateUI();
}

function setupJoystick() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
    if (!joystickBase) return;

    let joystickCenter = { x: 0, y: 0 };

    const updateJoystickCenter = () => {
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    };

    joystickBase.addEventListener('touchstart', (e) => {
        if (!state.decoupled) return;
        e.preventDefault();
        joystickActive = true;
        updateJoystickCenter();
    });

    joystickBase.addEventListener('touchmove', (e) => {
        if (!state.decoupled || !joystickActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - joystickCenter.x;
        const deltaY = touch.clientY - joystickCenter.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 35;

        let finalX = deltaX;
        let finalY = deltaY;

        if (distance > maxDistance) {
            finalX = (deltaX / distance) * maxDistance;
            finalY = (deltaY / distance) * maxDistance;
        }

        joystickStick.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;

        joystickDelta.x = finalX / maxDistance;
        joystickDelta.y = finalY / maxDistance;
    });

    joystickBase.addEventListener('touchend', (e) => {
        e.preventDefault();
        joystickActive = false;
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickDelta = { x: 0, y: 0 };
    });
}

function toggleDecouple() {
    state.decoupled = !state.decoupled;
    const btn = document.getElementById('decoupleBtn');
    const joystick = document.getElementById('joystickContainer');

    if (state.decoupled) {
        btn.textContent = '🔓 Decoupled';
        btn.classList.add('active');
        joystick.classList.add('show');
        shipVelocity.set(0, 0, 0);
    } else {
        btn.textContent = '🔒 Coupled';
        btn.classList.remove('active');
        joystick.classList.remove('show');
        shipVelocity.set(0, 0, 0);
    }
}

// Time scale & scale mode (igual que antes)
function cycleTimeScale() {
    const scales = [1, 60, 3600];
    const currentIndex = scales.indexOf(state.timeScale);
    const nextIndex = (currentIndex + 1) % scales.length;
    state.timeScale = scales[nextIndex];

    const btn = document.getElementById('timeScaleBtn');
    const labels = ['x1', 'x60', 'x3600'];
    btn.textContent = `⏱️ Tiempo: ${labels[nextIndex]}`;

    updateUI();
}

function toggleScaleMode() {
    state.realisticMode = !state.realisticMode;
    const btn = document.getElementById('scaleBtn');

    if (state.realisticMode) {
        btn.textContent = '🔬 Modo Realista';
        // SOLAR_SYSTEM = SOLAR_SYSTEM_REALISTIC; // asignar si lo tienes completo
    } else {
        btn.textContent = '🌍 Modo Simple';
        SOLAR_SYSTEM = SOLAR_SYSTEM_SIMPLE;
    }

    // Reconstruir sistema solar
    Object.keys(planets).forEach(key => {
        if (planets[key].mesh) {
            scene.remove(planets[key].mesh);
        }
        if (planets[key].rings) {
            scene.remove(planets[key].rings);
        }
    });

    planets = {};
    createSolarSystem();
    updateUI();
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 500000;
        positions[i + 1] = (Math.random() - 0.5) * 500000;
        positions[i + 2] = (Math.random() - 0.5) * 500000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createSpaceship() {
    const shipGroup = new THREE.Group();

    // Cuerpo simplificado y reducido (más realista)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.1, 5.5, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    shipGroup.add(body);

    const cockpitGeometry = new THREE.SphereGeometry(0.9, 16, 16);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.7,
        metalness: 0.8,
        roughness: 0.1
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.x = 3;
    shipGroup.add(cockpit);

    const noseGeometry = new THREE.ConeGeometry(0.9, 1.5, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.8,
        roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.x = 4.2;
    nose.rotation.z = -Math.PI / 2;
    shipGroup.add(nose);

    const wingGeometry = new THREE.BoxGeometry(1.6, 0.2, 4.5);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        metalness: 0.6,
        roughness: 0.4
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, -2.5);
    leftWing.rotation.y = -0.2;
    shipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, 0, 2.5);
    rightWing.rotation.y = 0.2;
    shipGroup.add(rightWing);

    const engineGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 12);
    const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0x404040,
        metalness: 0.9,
        roughness: 0.1
    });

    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-2.6, 0, -1.5);
    leftEngine.rotation.z = Math.PI / 2;
    shipGroup.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(-2.6, 0, 1.5);
    rightEngine.rotation.z = Math.PI / 2;
    shipGroup.add(rightEngine);

    // glows y luces controlables: se apagan en órbita
    const glowGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.0 // inicio apagado
    });

    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
    leftGlow.position.set(-3.1, 0, -1.5);
    leftGlow.rotation.z = Math.PI / 2;
    shipGroup.add(leftGlow);
    shipGlows.push(leftGlow);

    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
    rightGlow.position.set(-3.1, 0, 1.5);
    rightGlow.rotation.z = Math.PI / 2;
    shipGroup.add(rightGlow);
    shipGlows.push(rightGlow);

    const leftLight = new THREE.PointLight(0x00ffff, 0, 12); // intensidad 0 al inicio
    leftLight.position.set(-3.1, 0, -1.5);
    shipGroup.add(leftLight);
    shipLights.push(leftLight);

    const rightLight = new THREE.PointLight(0x00ffff, 0, 12);
    rightLight.position.set(-3.1, 0, 1.5);
    shipGroup.add(rightLight);
    shipLights.push(rightLight);

    // detalles
    const detailGeometry = new THREE.BoxGeometry(4, 0.12, 0.25);
    const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x002244,
        metalness: 0.8,
        roughness: 0.2
    });

    const topDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    topDetail.position.set(0, 0.9, 0);
    shipGroup.add(topDetail);

    const bottomDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    bottomDetail.position.set(0, -0.9, 0);
    shipGroup.add(bottomDetail);

    // escala más pequeña (solicitud: tamaño reducido)
    shipGroup.scale.set(0.05, 0.05, 0.05);
    shipGroup.position.set(SOLAR_SYSTEM.earth.distance, 5, 0);

    spaceship = shipGroup;
    scene.add(shipGroup);
}

function createSolarSystem() {
    // Sol
    const sunData = SOLAR_SYSTEM.sun;
    const sunGeometry = new THREE.SphereGeometry(sunData.size, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: sunData.color });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: 'sun', type: 'star' };
    scene.add(sun);
    planets.sun = { mesh: sun, orbit: 0, angle: 0, speed: 0 };

    // Luz global/solar (para iluminación ambiente)
    const sunLight = new THREE.PointLight(0xffffee, 2, 500000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.userData.sunPointLight = sunLight;

    // Crear planetas y lunas
    Object.keys(SOLAR_SYSTEM).forEach(key => {
        if (key === 'sun') return;

        const body = SOLAR_SYSTEM[key];

        if (body.parent) {
            createMoon(key, body);
        } else {
            createPlanet(key, body);
        }
    });

    // Cinturón de asteroides y anillos
    createAsteroidBelt();
    createSaturnRings();
}

function createPlanet(name, data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    let material;
    try {
        const texture = textureLoader.load(`/constelacion/${data.texture}`);
        material = new THREE.MeshStandardMaterial({ map: texture });
    } catch (e) {
        material = new THREE.MeshStandardMaterial({ color: data.color || 0x888888 });
    }
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { name, type: 'planet' };
    scene.add(mesh);

    planets[name] = {
        mesh,
        orbit: data.distance,
        angle: Math.random() * Math.PI * 2,
        speed: (data.speed || 0.01) * 0.001,
        rotationSpeed: 0.01,
        radius: data.size
    };
}

function createMoon(name, data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/constelacion/${data.texture}`);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { name, type: 'moon' };
    scene.add(mesh);

    planets[name] = {
        mesh,
        orbit: data.distance,
        angle: Math.random() * Math.PI * 2,
        speed: (data.speed || 0.05) * 0.001,
        parent: planets[data.parent],
        tidalLock: true,
        radius: data.size
    };
}

function createAsteroidBelt() {
    const beltDistance = state.realisticMode ? 35000 : 3500;
    const beltWidth = state.realisticMode ? 8000 : 800;

    for (let i = 0; i < 200; i++) {
        const size = Math.random() * 0.8 + 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const asteroid = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = beltDistance + Math.random() * beltWidth;
        asteroid.position.x = Math.cos(angle) * radius;
        asteroid.position.z = Math.sin(angle) * radius;
        asteroid.position.y = (Math.random() - 0.5) * 50;

        asteroid.userData = { name: 'asteroid', type: 'asteroid' };
        scene.add(asteroid);
    }
}

function createSaturnRings() {
    if (!planets.saturn) return;
    const saturnData = SOLAR_SYSTEM.saturn;
    const ringGeometry = new THREE.RingGeometry(saturnData.size * 1.5, saturnData.size * 2.5, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xc9b37a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;

    planets.saturn.rings = rings;
    scene.add(rings);
}

// ==================== ACTUALIZACIONES ====================
function updatePlanets() {
    const timeMultiplier = state.timeScale;

    Object.keys(planets).forEach(key => {
        const planet = planets[key];

        if (planet.parent) {
            const parentPos = planet.parent.mesh.position;
            planet.angle += planet.speed * timeMultiplier;

            planet.mesh.position.x = parentPos.x + Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = parentPos.z + Math.sin(planet.angle) * planet.orbit;
            planet.mesh.position.y = parentPos.y;

            if (planet.tidalLock) {
                planet.mesh.lookAt(parentPos);
            }
        } else if (planet.orbit > 0) {
            planet.angle += planet.speed * timeMultiplier;

            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbit;

            if (planet.rotationSpeed) {
                planet.mesh.rotation.y += planet.rotationSpeed * timeMultiplier;
            }

            if (key === 'saturn' && planet.rings) {
                planet.rings.position.copy(planet.mesh.position);
            }
        }
    });

    updateSpaceship();
    updateCamera();
    updateAtmosphereEffects();
    updateAudioEffects();
}

function updateSpaceship() {
    if (!spaceship) return;

    // Determine speed magnitude for effects
    const speedMag = shipVelocity.length();

    // actualizar luces de la nave: encender SOLO si viajando o acelerando fuerte en decoupled
    const lightsOn = state.traveling || (state.decoupled && speedMag > 0.05);
    shipLights.forEach(light => { light.intensity = lightsOn ? 1.6 : 0; });
    shipGlows.forEach(glow => { glow.material.opacity = lightsOn ? 0.8 : 0.0; });

    if (state.decoupled) {
        // Modo manual con joystick
        const speed = 0.12;
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();

        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize();

        const forwardMove = cameraDir.clone().multiplyScalar(-joystickDelta.y * speed);
        const rightMove = cameraRight.clone().multiplyScalar(joystickDelta.x * speed);

        shipVelocity.add(forwardMove);
        shipVelocity.add(rightMove);

        // fricción
        shipVelocity.multiplyScalar(0.96);

        spaceship.position.add(shipVelocity);

        // Rotación según dirección de movimiento
        if (shipVelocity.length() > 0.001) {
            const angle = Math.atan2(shipVelocity.z, shipVelocity.x);
            spaceship.rotation.y = angle - Math.PI / 2;
        }

    } else if (state.traveling && state.travelStartTime && state.travelDuration) {
        // Viaje automático -> cinematic camera & luz de motores encendida
        state.cinematic = true;
        const now = Date.now();
        const elapsed = now - state.travelStartTime;
        const t = Math.min(1, elapsed / state.travelDuration);

        const origin = state.travelOrigin;
        const target = planets[state.targetPlanet].mesh;

        const destVec = new THREE.Vector3(target.position.x, target.position.y + 5, target.position.z);
        spaceship.position.lerpVectors(origin, destVec, easeInOut(t));

        // rotación alineada a movimiento
        const dir = new THREE.Vector3().subVectors(destVec, spaceship.position);
        if (dir.lengthSq() > 0.0001) {
            const dirN = dir.clone().normalize();
            const angle = Math.atan2(dirN.z, dirN.x);
            spaceship.rotation.y = angle - Math.PI / 2;
        }

        // ligera oscilación por reentry/engine
        spaceship.rotation.z = Math.sin(t * Math.PI * 4) * 0.05;

        // Si alcanzó el destino
        if (t >= 1) {
            state.traveling = false;
            state.travelStartTime = null;
            state.travelDuration = 0;
            state.travelOrigin = null;
            state.currentPlanet = state.targetPlanet;
            state.targetPlanet = null;
            state.cinematic = false;
            updateUI();
        }
    } else {
        // Orbita alrededor del planeta actual
        const currentPlanetData = planets[state.currentPlanet];
        if (currentPlanetData) {
            const t = Date.now() * 0.00005;
            const radius = state.orbitDistance + (currentPlanetData.radius || currentPlanetData.mesh.geometry.parameters.radius || 5);
            // posicion circular
            const x = currentPlanetData.mesh.position.x + Math.cos(t) * radius;
            const z = currentPlanetData.mesh.position.z + Math.sin(t) * radius;
            spaceship.position.x = x;
            spaceship.position.z = z;
            spaceship.position.y = currentPlanetData.mesh.position.y + 3;

            // Rotación de la nave según dirección tangente a la órbita
            // tangente vector = derivative = (-sin, cos)
            const tangent = new THREE.Vector3(-Math.sin(t) * radius, 0, Math.cos(t) * radius).normalize();
            const angle = Math.atan2(tangent.z, tangent.x);
            spaceship.rotation.y = angle - Math.PI / 2;
            spaceship.rotation.z = 0;
        }
    }

    // Detectar colisión/penetración con planeta y ajustar distancia automáticamente
    if (!state.decoupled && planets[state.currentPlanet]) {
        const planet = planets[state.currentPlanet].mesh;
        const planetRadius = planets[state.currentPlanet].radius || (planet.geometry.parameters.radius || 5);

        const distToPlanetCenter = spaceship.position.distanceTo(planet.position);
        const desiredClearance = planetRadius * 1.05 + 2; // margen de seguridad

        if (distToPlanetCenter < desiredClearance) {
            // aumentar orbitDistance suavemente para evitar colisión
            state.orbitDistance = Math.max(state.orbitDistance, desiredClearance + 5);
            // re-posicionar inmediatamente fuera de la superficie
            const dirFromPlanet = new THREE.Vector3().subVectors(spaceship.position, planet.position).normalize();
            spaceship.position.copy(planet.position.clone().add(dirFromPlanet.multiplyScalar(desiredClearance)));
        }
    }
}

function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function updateCamera() {
    if (!spaceship) return;

    const targetPos = spaceship.position.clone();

    // Cinematic: cámara más cercana y suavizada durante viajes
    if (state.cinematic || state.traveling) {
        // modo cinematic: menor distancia y lerp suave
        const desiredDistance = Math.max(20, Math.min(120, state.orbitDistance * 0.6));
        const lerpFactor = 0.06;
        camera.position.x += (targetPos.x + Math.cos(cameraAngle) * desiredDistance - camera.position.x) * lerpFactor;
        camera.position.z += (targetPos.z + Math.sin(cameraAngle) * desiredDistance - camera.position.z) * lerpFactor;
        camera.position.y += (targetPos.y + cameraHeight * 0.6 - camera.position.y) * lerpFactor;
    } else {
        // Normal: mantener distancia orbitDistance y altura cameraHeight
        camera.position.x = targetPos.x + Math.cos(cameraAngle) * state.orbitDistance;
        camera.position.z = targetPos.z + Math.sin(cameraAngle) * state.orbitDistance;
        camera.position.y = targetPos.y + cameraHeight;
    }

    // Vibración de cámara si vuelo bajo y velocidad alta
    const lowAltitude = spaceship.position.y < 12;
    if (lowAltitude && shipVelocity.length() > 0.08) {
        const shake = Math.sin(Date.now() * 0.05) * 0.25;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.6;
        camera.position.z += (Math.random() - 0.5) * shake;
    }

    camera.lookAt(targetPos);
}

// ==================== EVENTOS TÁCTILES (soporte multitáctil: pinch to zoom) ====================
function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
        lastTouchPos = { ...touchStartPos };
        lastPinchDist = null;
    } else if (e.touches.length === 2) {
        // iniciar pinch
        lastPinchDist = getPinchDistance(e.touches);
    }
}

function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouchPos) {
        const deltaX = e.touches[0].clientX - lastTouchPos.x;
        const deltaY = e.touches[0].clientY - lastTouchPos.y;

        // Mover cámara (sin cambiar orbitDistance)
        cameraAngle -= deltaX * 0.01;
        cameraHeight = Math.max(5, Math.min(200, cameraHeight + deltaY * 0.25));

        lastTouchPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    } else if (e.touches.length === 2) {
        // manejo pinch-to-zoom
        const newDist = getPinchDistance(e.touches);
        if (lastPinchDist !== null) {
            const delta = lastPinchDist - newDist; // si newDist < lastPinchDist -> pinch in -> acercar (reducir orbitDistance)
            const zoomSensitivity = 0.08;
            state.orbitDistance = Math.max(state.minOrbitDistance, Math.min(state.maxOrbitDistance, state.orbitDistance + delta * zoomSensitivity));
        }
        lastPinchDist = newDist;

        // también permitir rotación con dos dedos: calcular angle entre dedos y usar para girar cámara
        const angleNow = getPinchAngle(e.touches);
        if (typeof onTouchMove.lastAngle !== 'undefined') {
            const angleDelta = angleNow - onTouchMove.lastAngle;
            cameraAngle -= angleDelta * 0.01;
        }
        onTouchMove.lastAngle = angleNow;
    }
}

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
function getPinchAngle(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.atan2(dy, dx);
}

function onTouchEnd(e) {
    e.preventDefault();

    if (touchStartPos && Date.now() - touchStartPos.time < 200 && e.changedTouches && e.changedTouches.length > 0) {
        try {
            const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartPos.x);
            const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartPos.y);

            if (deltaX < 10 && deltaY < 10) {
                onMouseClick(e.changedTouches[0]);
            }
        } catch (err) {}
    }

    // reset pinch state si no hay dos dedos
    if (!e.touches || e.touches.length < 2) {
        lastPinchDist = null;
        onTouchMove.lastAngle = undefined;
    }

    touchStartPos = null;
    lastTouchPos = null;
}

// ==================== MOUSE/INTERACCIÓN ====================
function onMouseClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.type === 'planet' || obj.userData.type === 'moon') {
            travelToPlanet(obj.userData.name);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 12 : -12;
    // solo cambiar orbitDistance con el wheel explícito (corrección del zoom indeseado)
    state.orbitDistance = Math.max(state.minOrbitDistance, Math.min(state.maxOrbitDistance, state.orbitDistance + delta));
}

// ==================== NAVEGACIÓN ====================
function travelToPlanet(planetName) {
    if (!planets[planetName]) return;

    if (planetName === state.currentPlanet && !state.traveling) {
        return;
    }

    if (state.traveling) {
        return;
    }

    // Activar modo coupled automáticamente al viajar
    if (state.decoupled) {
        toggleDecouple();
    }

    const originVec = spaceship.position.clone();
    const targetPlanet = planets[planetName];
    const dist = originVec.distanceTo(new THREE.Vector3(
        targetPlanet.mesh.position.x,
        targetPlanet.mesh.position.y,
        targetPlanet.mesh.position.z
    ));

    // duración relativa a distancia (ligeramente acelerada)
    let durationMs = dist * 6;
    durationMs = Math.max(durationMs, 2000);
    durationMs = Math.min(durationMs, 30000);

    state.traveling = true;
    state.travelOrigin = originVec;
    state.targetPlanet = planetName;
    state.travelStartTime = Date.now();
    state.travelDuration = durationMs;
    state.cinematic = true;

    updateUI();
}

// ==================== ATMÓSFERA Y EFECTOS ====================
function toggleAtmosphere(forceOn) {
    state.atmosphere = (typeof forceOn === 'boolean') ? forceOn : !state.atmosphere;
    // activar niebla y ajustar intensidades
    if (state.atmosphere) {
        // empezar transición gradual
        state.atmosphereIntensity = Math.max(0, state.atmosphereIntensity);
        // establecer fog si no existe
        if (!scene.fog) {
            scene.fog = new THREE.FogExp2(0x88aaee, 0.0005);
        }
    } else {
        // apagar con transición
    }
}

function updateAtmosphereEffects() {
    // interpolar atmosphereIntensity hacia 1 o 0
    const target = state.atmosphere ? 1 : 0;
    const speed = 0.01;
    state.atmosphereIntensity += (target - state.atmosphereIntensity) * speed;

    // ajustar fog density y sky color según intensidad
    if (scene.fog) {
        scene.fog.color.setRGB(0.6 * state.atmosphereIntensity, 0.7 * state.atmosphereIntensity, 1 * state.atmosphereIntensity);
        scene.fog.density = 0.0008 * state.atmosphereIntensity;
    }

    // ajustar color de fondo (sky) desde noche (0x000011) hacia cielo atmosférico (ej. 0x87ceeb)
    const skyNight = new THREE.Color(0x000011);
    const skyDay = new THREE.Color(0x87ceeb);
    const skyColor = skyNight.clone().lerp(skyDay, state.atmosphereIntensity);
    renderer.setClearColor(skyColor);

    // iluminación variable (dispersión lumínica): ajustar intensidad de luz solar y ambient
    const sunPoint = scene.userData.sunPointLight;
    if (sunPoint) {
        sunPoint.intensity = 2 + state.atmosphereIntensity * 1.5;
        // color desplazado ligeramente
        sunPoint.color.setRGB(1, 0.98 - 0.2 * state.atmosphereIntensity, 0.9 - 0.3 * state.atmosphereIntensity);
    }
    // ambient light
    scene.traverse(obj => {
        if (obj.isAmbientLight) {
            obj.intensity = 0.15 + 0.35 * state.atmosphereIntensity;
        }
    });
}

// ==================== AUDIO EFECTS (viento dinámico) ====================
function updateAudioEffects() {
    if (!audioCtx) return;

    // volumen del viento depende de la altitud (más cerca de la atmósfera -> más viento)
    // además aumenta con la velocidad
    let altitudeFactor = 1;
    if (spaceship && planets[state.currentPlanet]) {
        const planetY = planets[state.currentPlanet].mesh.position.y;
        const altitude = spaceship.position.y - planetY;
        altitudeFactor = 1 - Math.min(1, Math.max(0, (altitude - 5) / 60)); // cuando bajo -> más viento
    }
    const speedFactor = Math.min(1, shipVelocity.length() * 5);
    const wind = (0.25 + 0.75 * altitudeFactor) * (0.2 + 0.8 * speedFactor) * state.atmosphereIntensity;
    setWindVolume(wind);
}

// ==================== UI ====================
function updateUI() {
    const currentLoc = document.getElementById('currentLocation');
    const travelStatus = document.getElementById('travelStatus');
    const timeScaleLabel = document.getElementById('timeScale');

    if (currentLoc) currentLoc.textContent = PLANET_INFO[state.currentPlanet]?.name || state.currentPlanet;

    if (travelStatus) {
        if (state.traveling) {
            const remaining = Math.max(0, state.travelDuration - (Date.now() - state.travelStartTime));
            travelStatus.textContent = `Viajando a ${PLANET_INFO[state.targetPlanet]?.name} (${Math.ceil(remaining / 1000)}s)`;
        } else if (state.decoupled) {
            travelStatus.textContent = 'Vuelo libre';
        } else {
            travelStatus.textContent = 'En órbita';
        }
    }

    if (timeScaleLabel) {
        const timeLabels = { 1: 'x1', 60: 'x60', 3600: 'x3600' };
        timeScaleLabel.textContent = `Tiempo: ${timeLabels[state.timeScale] || state.timeScale}`;
    }

    renderPlanetList();
}

function renderPlanetList() {
    const planetList = document.getElementById('planetList');
    if (!planetList) return;
    planetList.innerHTML = '';

    const mainPlanets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    mainPlanets.forEach(planetKey => {
        const planetData = SOLAR_SYSTEM[planetKey];
        const planetInfo = PLANET_INFO[planetKey];

        const groupDiv = document.createElement('div');
        groupDiv.className = 'planet-group';

        const isCurrent = state.currentPlanet === planetKey;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'planet-header';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'planet-name' + (isCurrent ? ' current' : '');
        nameDiv.innerHTML = `🪐 ${planetInfo?.name || planetKey}`;

        const travelBtn = document.createElement('button');
        travelBtn.className = 'action-button travel';
        travelBtn.textContent = '🚀';
        travelBtn.title = 'Viajar';
        travelBtn.onclick = () => travelToPlanet(planetKey);

        const infoBtn = document.createElement('button');
        infoBtn.className = 'action-button info';
        infoBtn.textContent = 'ℹ️';
        infoBtn.title = 'Información';
        infoBtn.onclick = () => showInfo(planetKey);

        headerDiv.appendChild(nameDiv);
        headerDiv.appendChild(travelBtn);
        headerDiv.appendChild(infoBtn);

        if (planetData.moons && planetData.moons.length > 0) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'action-button toggle';
            toggleBtn.textContent = `🌙 ${planetData.moons.length}`;
            toggleBtn.title = 'Mostrar/Ocultar lunas';
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const moonList = groupDiv.querySelector('.moon-list');
                if (moonList) moonList.classList.toggle('show');
                toggleBtn.classList.toggle('active');
            };
            headerDiv.appendChild(toggleBtn);
        }

        groupDiv.appendChild(headerDiv);

        if (planetData.moons && planetData.moons.length > 0) {
            const moonListDiv = document.createElement('div');
            moonListDiv.className = 'moon-list';

            planetData.moons.forEach(moonKey => {
                const moonInfo = PLANET_INFO[moonKey] || { name: moonKey };
                const isMoonCurrent = state.currentPlanet === moonKey;

                const moonItem = document.createElement('div');
                moonItem.className = 'moon-item';

                const moonName = document.createElement('div');
                moonName.className = 'moon-name' + (isMoonCurrent ? ' current' : '');
                moonName.innerHTML = `🌙 ${moonInfo.name}`;

                const moonTravelBtn = document.createElement('button');
                moonTravelBtn.className = 'action-button travel';
                moonTravelBtn.textContent = '🚀';
                moonTravelBtn.title = 'Viajar';
                moonTravelBtn.onclick = () => travelToPlanet(moonKey);

                const moonInfoBtn = document.createElement('button');
                moonInfoBtn.className = 'action-button info';
                moonInfoBtn.textContent = 'ℹ️';
                moonInfoBtn.title = 'Información';
                moonInfoBtn.onclick = () => showInfo(moonKey);

                moonItem.appendChild(moonName);
                moonItem.appendChild(moonTravelBtn);
                moonItem.appendChild(moonInfoBtn);

                moonListDiv.appendChild(moonItem);
            });

            groupDiv.appendChild(moonListDiv);
        }

        planetList.appendChild(groupDiv);
    });
}

// ==================== INFO MODAL ====================
function showInfo(bodyName) {
    const info = PLANET_INFO[bodyName];
    if (!info) return;

    const modal = document.getElementById('infoModal');
    if (!modal) return;
    document.getElementById('infoTitle').textContent = info.name;
    document.getElementById('infoContent').innerHTML = `<p>${info.info}</p>`;
    modal.classList.add('show');
}

function closeInfo() {
    const modal = document.getElementById('infoModal');
    if (!modal) return;
    modal.classList.remove('show');
}

// ==================== GAME LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    updatePlanets();
    renderer.render(scene, camera);
}

// ==================== INICIALIZACIÓN ====================
function init() {
    initThreeJS();
    updateUI();
    animate();

    document.getElementById('closeInfo').onclick = closeInfo;

    setInterval(updateUI, 200);
}

window.addEventListener('load', init);
