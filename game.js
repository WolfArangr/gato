// game.js (versión actualizada)
// ==================== CONFIGURACIÓN GLOBAL ====================
const GAME_CONFIG = {
    // Tiempo: 1 minuto real = 1 día del juego (mantengo tu escala)
    TIME_SCALE: 1 / 60,
    YEAR_DAYS: 365,

    // Órbitas (unidades visuales)
    ORBITS: {
        EARTH: { distance: 1500, speed: 0.1, eccentricity: 0.017 },
        MOON: { distance: 150, speed: 1.237, eccentricity: 0.055 },
        MARS: { distance: 2280, speed: 0.0532, eccentricity: 0.093 },
        VENUS: { distance: 1080, speed: 0.1626, eccentricity: 0.007 },
        JUPITER: { distance: 5200, speed: 0.0084, eccentricity: 0.048 },
    },

    SIZES: {
        SUN: 40,
        EARTH: 6,
        MOON: 2,
        MARS: 3,
        VENUS: 6,
        JUPITER: 18,
    },

    // Factor para transformar "distancia visual" en ms de viaje:
    // travelDurationMs = distance * TRAVEL_MS_PER_UNIT
    TRAVEL_MS_PER_UNIT: 10, // aumenta si quieres viajes más largos
    TRAVEL_DURATION_MULTIPLIER: 10, // petición: viajes 10x más largos
};

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    day: 1,
    year: 1,
    time: 0,
    credits: 5000,

    resources: {
        minerals: { amount: 100, capacity: 500, price: 50, lastPrice: 50 },
        water: { amount: 50, capacity: 300, price: 80, lastPrice: 80 },
        fuel: { amount: 200, capacity: 1000, price: 30, lastPrice: 30 },
        electronics: { amount: 10, capacity: 100, price: 200, lastPrice: 200 },
        alien_artifacts: { amount: 0, capacity: 50, price: 1000, lastPrice: 1000 }
    },

    ship: {
        fuel: 1000,
        maxFuel: 1000,
        health: 100,
        crew: 5,
        maxCrew: 10,
        cargo: 0,
        maxCargo: 500
    },

    currentPlanet: 'earth',
    discoveredPlanets: ['earth', 'moon'],

    missions: [],
    completedMissions: 0,

    structures: {
        refinery: 0,
        factory: 0,
        storage: 0,
        laboratory: 0
    },

    production: { lastUpdate: 0 },

    // Bases por ubicación (inventarios y estructuras locales)
    bases: {
        earth: { exists: true, owner: 'player', structures: { refinery: 1, storage: 1 }, inventory: { minerals: 200, fuel: 500, electronics: 20 } },
        moon: { exists: false, owner: null, structures: {}, inventory: {} },
        mars: { exists: false, owner: null, structures: {}, inventory: {} },
        venus: { exists: false, owner: null, structures: {}, inventory: {} },
        jupiter: { exists: false, owner: null, structures: {}, inventory: {} },
        europa: { exists: false, owner: null, structures: {}, inventory: {} }
    },

    // Acciones en progreso (solo una acción general visible para simplicidad)
    activeAction: null,

    // Viaje
    shipTraveling: false,
    travelOrigin: null,
    travelTargetName: null,
    travelStartTime: null,
    travelDuration: 0,
};

// Recursos únicos por planeta
const PLANET_RESOURCES = {
    earth: ['water', 'electronics', 'minerals'],
    moon: ['minerals'],
    mars: ['minerals', 'fuel'],
    venus: ['minerals', 'fuel'],
    jupiter: ['fuel'],
    europa: ['water', 'alien_artifacts']
};

// ==================== THREE.JS SETUP ====================
let scene, camera, renderer;
let planets = {};
let selectedPlanet = null;
let touchStartPos = null;
let lastTouchPos = null;
let cameraAngle = 0;
let cameraHeight = 50;
let cameraDistance = 100;
let spaceship = null;
let shipTraveling = false;

function initThreeJS() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.set(100, 50, 100);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('gameCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);

    // Estrellas de fondo
    createStarfield();

    // Crear nave espacial (ahora 10% del tamaño anterior)
    createSpaceship();

    // Crear sistema solar
    createSolarSystem();

    window.addEventListener('resize', onWindowResize);

    // Soporte táctil
    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('click', onMouseClick);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 10000;
        positions[i + 1] = (Math.random() - 0.5) * 10000;
        positions[i + 2] = (Math.random() - 0.5) * 10000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createSpaceship() {
    const shipGroup = new THREE.Group();

    // Cuerpo principal
    const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.5, 8, 16);
    const bodyTexture = new THREE.TextureLoader().load('/constelacion/estrella.png');
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        map: bodyTexture,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    shipGroup.add(body);

    // Cabina
    const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.7,
        metalness: 0.8,
        roughness: 0.1
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.x = 4;
    cockpit.rotation.z = -Math.PI / 2;
    shipGroup.add(cockpit);

    // Nariz
    const noseGeometry = new THREE.ConeGeometry(1.2, 2, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.8,
        roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.x = 5.5;
    nose.rotation.z = -Math.PI / 2;
    shipGroup.add(nose);

    // Alas
    const wingGeometry = new THREE.BoxGeometry(2, 0.3, 6);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        metalness: 0.6,
        roughness: 0.4
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, -3);
    leftWing.rotation.y = -0.2;
    shipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, 0, 3);
    rightWing.rotation.y = 0.2;
    shipGroup.add(rightWing);

    // Motores
    const engineGeometry = new THREE.CylinderGeometry(0.6, 0.8, 2, 12);
    const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0x404040,
        metalness: 0.9,
        roughness: 0.1
    });

    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-3.5, 0, -2);
    leftEngine.rotation.z = Math.PI / 2;
    shipGroup.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(-3.5, 0, 2);
    rightEngine.rotation.z = Math.PI / 2;
    shipGroup.add(rightEngine);

    // Glow motores
    const glowGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.5, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });

    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    leftGlow.position.set(-4.5, 0, -2);
    leftGlow.rotation.z = Math.PI / 2;
    shipGroup.add(leftGlow);

    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    rightGlow.position.set(-4.5, 0, 2);
    rightGlow.rotation.z = Math.PI / 2;
    shipGroup.add(rightGlow);

    // Lights
    const leftLight = new THREE.PointLight(0x00ffff, 2, 20);
    leftLight.position.set(-4.5, 0, -2);
    shipGroup.add(leftLight);

    const rightLight = new THREE.PointLight(0x00ffff, 2, 20);
    rightLight.position.set(-4.5, 0, 2);
    shipGroup.add(rightLight);

    // Detalles
    const detailGeometry = new THREE.BoxGeometry(6, 0.15, 0.3);
    const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x0044aa,
        metalness: 0.8,
        roughness: 0.2
    });

    const topDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    topDetail.position.set(0, 1.3, 0);
    shipGroup.add(topDetail);

    const bottomDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    bottomDetail.position.set(0, -1.3, 0);
    shipGroup.add(bottomDetail);

    // Escalar la nave a ~10% del tamaño anterior
    shipGroup.scale.set(0.08, 0.08, 0.08);

    // Posicionar inicialmente en la Tierra (posición sustituida luego por órbita)
    shipGroup.position.set(GAME_CONFIG.ORBITS.EARTH.distance, 5, 0);

    spaceship = shipGroup;
    scene.add(shipGroup);
}

function createSolarSystem() {
    // Sol
    const sunGeometry = new THREE.SphereGeometry(GAME_CONFIG.SIZES.SUN, 32, 32);
    const sunTexture = new THREE.TextureLoader().load('/constelacion/estrella.png');
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: 'sun', type: 'star' };
    scene.add(sun);
    planets.sun = { mesh: sun, orbit: 0, angle: 0, speed: 0 };

    // Luz del sol
    const sunLight = new THREE.PointLight(0xffffee, 2, 5000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Planetas y lunas
    const earthOrbit = GAME_CONFIG.ORBITS.EARTH;
    createPlanet('earth', 'planeta1.png', GAME_CONFIG.SIZES.EARTH,
        earthOrbit.distance, earthOrbit.speed, 0, earthOrbit.eccentricity);

    const moonOrbit = GAME_CONFIG.ORBITS.MOON;
    createMoon('moon', 'luna1.png', GAME_CONFIG.SIZES.MOON,
        moonOrbit.distance, moonOrbit.speed, planets.earth, moonOrbit.eccentricity);

    const marsOrbit = GAME_CONFIG.ORBITS.MARS;
    createPlanet('mars', 'planeta2.png', GAME_CONFIG.SIZES.MARS,
        marsOrbit.distance, marsOrbit.speed, Math.PI / 4, marsOrbit.eccentricity);

    const venusOrbit = GAME_CONFIG.ORBITS.VENUS;
    createPlanet('venus', 'luna5.png', GAME_CONFIG.SIZES.VENUS,
        venusOrbit.distance, venusOrbit.speed, Math.PI, venusOrbit.eccentricity);

    const jupiterOrbit = GAME_CONFIG.ORBITS.JUPITER;
    createPlanet('jupiter', 'luna2.png', GAME_CONFIG.SIZES.JUPITER,
        jupiterOrbit.distance, jupiterOrbit.speed, Math.PI / 2, jupiterOrbit.eccentricity);

    createMoon('europa', 'luna3.png', 1.2, 25, 0.06, planets.jupiter, 0.009);

    createAsteroidBelt();
}

function createPlanet(name, texture, size, orbitRadius, speed, startAngle, eccentricity) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const planetTexture = textureLoader.load(`/constelacion/${texture}`);
    const material = new THREE.MeshStandardMaterial({ map: planetTexture });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { name, type: 'planet' };
    scene.add(mesh);

    planets[name] = {
        mesh,
        orbit: orbitRadius,
        eccentricity: eccentricity || 0,
        angle: startAngle,
        speed: speed * 0.001,
        rotationSpeed: 0.01
    };
}

function createMoon(name, texture, size, orbitRadius, speed, parentPlanet, eccentricity) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load(`/constelacion/${texture}`);
    const material = new THREE.MeshStandardMaterial({ map: moonTexture });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { name, type: 'moon' };
    scene.add(mesh);

    planets[name] = {
        mesh,
        orbit: orbitRadius,
        eccentricity: eccentricity || 0,
        angle: 0,
        speed: speed * 0.001,
        parent: parentPlanet,
        tidalLock: true // la luna mira al planeta padre
    };
}

function createAsteroidBelt() {
    for (let i = 0; i < 150; i++) {
        const size = Math.random() * 0.5 + 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const texture = new THREE.TextureLoader().load('/constelacion/planeta3.png');
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const asteroid = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = 350 + Math.random() * 100;
        asteroid.position.x = Math.cos(angle) * radius;
        asteroid.position.z = Math.sin(angle) * radius;
        asteroid.position.y = (Math.random() - 0.5) * 20;

        asteroid.userData = { name: 'asteroid', type: 'asteroid' };
        scene.add(asteroid);
    }
}

function updatePlanets() {
    Object.keys(planets).forEach(key => {
        const planet = planets[key];

        if (planet.parent) {
            const parentPos = planet.parent.mesh.position;
            planet.angle += planet.speed;

            const r = planet.orbit * (1 - planet.eccentricity * planet.eccentricity) /
                (1 + planet.eccentricity * Math.cos(planet.angle));

            planet.mesh.position.x = parentPos.x + Math.cos(planet.angle) * r;
            planet.mesh.position.z = parentPos.z + Math.sin(planet.angle) * r;
            planet.mesh.position.y = parentPos.y;

            if (planet.tidalLock) {
                planet.mesh.lookAt(parentPos);
            }
        } else if (planet.orbit > 0) {
            planet.angle += planet.speed;

            const r = planet.orbit * (1 - planet.eccentricity * planet.eccentricity) /
                (1 + planet.eccentricity * Math.cos(planet.angle));

            planet.mesh.position.x = Math.cos(planet.angle) * r;
            planet.mesh.position.z = Math.sin(planet.angle) * r;

            if (planet.rotationSpeed) {
                planet.mesh.rotation.y += planet.rotationSpeed;
            }
        }
    });

    updateSpaceship();
    updateCamera();
}

function updateSpaceship() {
    if (!spaceship) return;

    if (gameState.shipTraveling && gameState.travelStartTime && gameState.travelDuration) {
        // Viaje basado en tiempo
        const now = Date.now();
        const elapsed = now - gameState.travelStartTime;
        const t = Math.min(1, elapsed / gameState.travelDuration);

        const origin = gameState.travelOrigin;
        const target = planets[gameState.travelTargetName].mesh;

        const destVec = new THREE.Vector3(target.position.x, target.position.y + 5, target.position.z);
        spaceship.position.lerpVectors(origin, destVec, easeInOut(t));

        // Orientar la nave hacia la dirección de movimiento
        const dir = new THREE.Vector3().subVectors(destVec, spaceship.position).normalize();
        const angle = Math.atan2(dir.z, dir.x);
        spaceship.rotation.y = angle - Math.PI / 2;

        // Balanceo
        spaceship.rotation.z = Math.sin(t * Math.PI * 4) * 0.05;

        // Durante el viaje, con probabilidad pequeña, puede ocurrir un encuentro (piratas)
        if (Math.random() < 0.0008 * (gameState.travelDuration / 1000)) { // escalado suave
            pirateEncounter();
        }

        if (t >= 1) {
            // Llegada
            gameState.shipTraveling = false;
            gameState.travelStartTime = null;
            gameState.travelDuration = 0;
            gameState.travelOrigin = null;
            gameState.currentPlanet = gameState.travelTargetName;

            // Add discovered
            if (!gameState.discoveredPlanets.includes(gameState.currentPlanet)) {
                gameState.discoveredPlanets.push(gameState.currentPlanet);
                gameState.credits += 1000;
                showNotification('🎉 Descubrimiento!', `${gameState.currentPlanet.toUpperCase()} descubierto! +1000 créditos`);
            } else {
                showNotification('🚀 Viaje completado', `Has llegado a ${gameState.currentPlanet.toUpperCase()}`);
            }
        }
    } else {
        // Nave en órbita lenta alrededor del planeta actual
        const currentPlanetData = planets[gameState.currentPlanet];
        if (currentPlanetData) {
            const t = Date.now() * 0.00005; // órbita lenta visual
            const radius = 20 + currentPlanetData.mesh.geometry.parameters.radius; // radio visual
            spaceship.position.x = currentPlanetData.mesh.position.x + Math.cos(t) * radius;
            spaceship.position.z = currentPlanetData.mesh.position.z + Math.sin(t) * radius;
            spaceship.position.y = currentPlanetData.mesh.position.y + 3;

            // Orientación suave
            spaceship.rotation.y += 0.001;
            spaceship.rotation.z = 0;
        }
    }
}

function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function updateCamera() {
    if (!spaceship) return;

    const targetPos = spaceship.position;

    if (!gameState.shipTraveling) {
        cameraAngle += 0.00015;
    }

    camera.position.x = targetPos.x + Math.cos(cameraAngle) * cameraDistance;
    camera.position.z = targetPos.z + Math.sin(cameraAngle) * cameraDistance;
    camera.position.y = targetPos.y + cameraHeight;
    camera.lookAt(targetPos);
}

// ==================== EVENTOS TÁCTILES ====================
function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
        lastTouchPos = { ...touchStartPos };
    }
}

function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouchPos) {
        const deltaX = e.touches[0].clientX - lastTouchPos.x;
        const deltaY = e.touches[0].clientY - lastTouchPos.y;

        cameraAngle -= deltaX * 0.01;
        cameraHeight += deltaY * 0.3;
        cameraHeight = Math.max(20, Math.min(150, cameraHeight));

        lastTouchPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }
}

function onTouchEnd(e) {
    e.preventDefault();

    if (touchStartPos && Date.now() - touchStartPos.time < 200) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartPos.x);
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartPos.y);

        if (deltaX < 10 && deltaY < 10) {
            onMouseClick(e.changedTouches[0]);
        }
    }

    touchStartPos = null;
    lastTouchPos = null;
}

function onMouseClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.type === 'planet' || obj.userData.type === 'moon') {
            selectPlanet(obj.userData.name);
        }
    }
}

function selectPlanet(name) {
    selectedPlanet = name;
    // Cambiar planeta actual solo si no está en viaje (select no teletransporta)
    if (!gameState.shipTraveling) {
        gameState.currentPlanet = name;
    }
    showNotification(`🪐 ${name.toUpperCase()}`, `Has seleccionado ${getPlanetInfo(name)}`);
}

function getPlanetInfo(name) {
    const info = {
        earth: 'la Tierra - Tu base de operaciones',
        moon: 'la Luna - Rico en minerales',
        mars: 'Marte - Planeta rojo con recursos diversos',
        venus: 'Venus - Atmósfera densa, difícil de explorar',
        jupiter: 'Júpiter - Gigante gaseoso',
        europa: 'Europa - Luna helada con agua'
    };
    return info[name] || name;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==================== SISTEMA DE JUEGO ====================
let lastFrameTime = Date.now();

function updateGameState() {
    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    gameState.time += deltaTime * GAME_CONFIG.TIME_SCALE;

    const prevDay = gameState.day;
    gameState.day = Math.floor(gameState.time) + 1;
    gameState.year = Math.floor(gameState.day / GAME_CONFIG.YEAR_DAYS) + 1;

    if (gameState.day !== prevDay) {
        onNewDay();
    }

    if (gameState.day - gameState.production.lastUpdate >= 10) {
        produceResources();
        gameState.production.lastUpdate = gameState.day;
    }

    if (gameState.day % 5 === 0 && gameState.day !== prevDay) {
        updateMarket();
    }

    updateUI();
}

function onNewDay() {
    // Consumo diario de la nave
    gameState.ship.fuel = Math.max(0, gameState.ship.fuel - 5);

    // Generar misiones
    if (Math.random() < 0.2 && gameState.missions.length < 2) {
        generateMission();
    }

    // Eventos aleatorios
    if (Math.random() < 0.05) {
        generateRandomEvent();
    }
}

function produceResources() {
    // Producción local en bases (cada 10 días)
    Object.keys(gameState.bases).forEach(loc => {
        const base = gameState.bases[loc];
        if (!base.exists) return;

        const r = base.structures.refinery || 0;
        const f = base.structures.factory || 0;

        if (r > 0) {
            base.inventory.minerals = (base.inventory.minerals || 0) + r * 20;
            base.inventory.fuel = (base.inventory.fuel || 0) + r * 30;
        }
        if (f > 0) {
            base.inventory.electronics = (base.inventory.electronics || 0) + f * 10;
        }

        // Capacidad de almacenamiento local
        // (si no hay storage, pueden perderse recursos)
        if (base.structures.storage && base.structures.storage > 0) {
            // ok
        } else {
            // si no hay almacenamiento, tope pequeño
            Object.keys(base.inventory).forEach(k => {
                base.inventory[k] = Math.min(base.inventory[k], 1000);
            });
        }
    });
}

function generateMission() {
    const types = ['mining', 'exploration', 'trade'];
    const type = types[Math.floor(Math.random() * types.length)];

    const missions = {
        mining: {
            title: '⛏️ Extracción',
            desc: `Extrae 50 minerales`,
            reward: 800,
            requirement: { type: 'mine' }
        },
        exploration: {
            title: '🔭 Exploración',
            desc: 'Descubre un planeta',
            reward: 1500,
            requirement: { type: 'discover' }
        },
        trade: {
            title: '💰 Comercio',
            desc: 'Vende 20 electrónicos',
            reward: 1200,
            requirement: { type: 'sell' }
        }
    };

    const mission = { ...missions[type], id: Date.now() };
    gameState.missions.push(mission);
    showNotification('📋 Nueva Misión', mission.title);
}

function generateRandomEvent() {
    const events = [
        {
            title: '☄️ Lluvia de Meteoritos',
            desc: 'Daño a la nave: -10 HP',
            effect: () => {
                gameState.ship.health = Math.max(0, gameState.ship.health - 10);
            }
        },
        {
            title: '🎁 Descubrimiento',
            desc: '+3 artefactos alienígenas encontrados',
            effect: () => {
                gameState.resources.alien_artifacts.amount = Math.min(
                    gameState.resources.alien_artifacts.amount + 3,
                    gameState.resources.alien_artifacts.capacity
                );
            }
        },
        {
            title: '💎 Filón Rico',
            desc: '+50 minerales descubiertos',
            effect: () => {
                gameState.resources.minerals.amount = Math.min(
                    gameState.resources.minerals.amount + 50,
                    gameState.resources.minerals.capacity
                );
            }
        }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    showNotification(event.title, event.desc);
}

function updateMarket() {
    let hasChanges = false;

    Object.keys(gameState.resources).forEach(res => {
        const resource = gameState.resources[res];
        resource.lastPrice = resource.price;

        const volatility = 0.15;
        const change = (Math.random() - 0.5) * 2 * volatility;
        resource.price = Math.max(10, Math.round(resource.price * (1 + change)));

        if (Math.abs(resource.price - resource.lastPrice) > resource.lastPrice * 0.1) {
            hasChanges = true;
        }
    });

    if (hasChanges) {
        showNotification('📊 Mercado', 'Los precios han cambiado significativamente');
    }
}

// ==================== ACCIONES Y SISTEMA DE TIEMPO ====================

function startAction(name, durationMs, onComplete, onTick) {
    // Solo una acción global para simplificar
    if (gameState.activeAction) {
        showNotification('⌛ En curso', `Ya estás realizando ${gameState.activeAction.name}`);
        return false;
    }
    gameState.activeAction = {
        name,
        endTime: Date.now() + durationMs,
        onComplete,
        onTick
    };

    // Mostrar notificación
    showNotification('🔧 Acción iniciada', `${name} — duración: ${Math.round(durationMs / 1000)}s`);

    // Tick loop para la acción (simple)
    const interval = setInterval(() => {
        if (!gameState.activeAction) {
            clearInterval(interval);
            return;
        }
        const now = Date.now();
        const remaining = gameState.activeAction.endTime - now;
        if (gameState.activeAction.onTick) gameState.activeAction.onTick(Math.max(0, remaining));
        if (remaining <= 0) {
            const cb = gameState.activeAction.onComplete;
            gameState.activeAction = null;
            clearInterval(interval);
            if (cb) cb();
        }
    }, 500);

    return true;
}

// Minería con tiempo y basado en recursos del planeta/base
function mineResources() {
    if (gameState.ship.fuel < 50) {
        showNotification('⚠️ Sin Combustible', 'Necesitas al menos 50 de combustible');
        return;
    }

    const planet = gameState.currentPlanet;
    const yields = {
        earth: { minerals: 10, water: 5 },
        moon: { minerals: 25, water: 3 },
        mars: { minerals: 18, fuel: 12 },
        europa: { water: 30, minerals: 5 },
        venus: { minerals: 8, fuel: 8 },
        jupiter: { fuel: 15 }
    };

    const yieldInfo = yields[planet];
    if (!yieldInfo) {
        showNotification('⚠️ No Disponible', 'No puedes minar aquí');
        return;
    }

    // Consumir combustible inmediato como preparación
    gameState.ship.fuel -= 50;

    // Duración de la minería depende del planeta (más difícil = más tiempo)
    const baseDuration = 8000; // 8s
    const multiplier = (planet === 'moon') ? 1.2 : (planet === 'mars') ? 1.1 : 1.0;
    const duration = baseDuration * multiplier;

    startAction('Minería', duration, () => {
        // Al completar, añadir recursos a la base local si existe, si no a la bodega global
        const base = gameState.bases[planet];
        if (base && base.exists) {
            Object.keys(yieldInfo).forEach(res => {
                base.inventory[res] = (base.inventory[res] || 0) + yieldInfo[res];
            });
            showNotification('⛏️ Minería completada', `Recursos añadidos a la base en ${planet.toUpperCase()}`);
        } else {
            // Si no hay base, irán al inventario general (gameState.resources si es compatible)
            Object.keys(yieldInfo).forEach(res => {
                if (gameState.resources[res]) {
                    gameState.resources[res].amount = Math.min(gameState.resources[res].capacity,
                        gameState.resources[res].amount + yieldInfo[res]);
                } else {
                    // si no es un recurso global, guardar en base fall-back
                    // (creamos la entrada en bases[planet].inventory por si se quiere fundar base luego)
                    if (!gameState.bases[planet].inventory) gameState.bases[planet].inventory = {};
                    gameState.bases[planet].inventory[res] = (gameState.bases[planet].inventory[res] || 0) + yieldInfo[res];
                }
            });
            showNotification('⛏️ Minería completada', `Recursos guardados en el contenedor local de ${planet.toUpperCase()}`);
        }
    });

}

// ==================== VIAJES REALISTAS ====================
function travelToPlanet(planet) {
    if (!planets[planet]) return;

    if (planet === gameState.currentPlanet && !gameState.shipTraveling) {
        showNotification('ℹ️ Ya estás aquí', `Ya te encuentras en ${planet}`);
        return;
    }

    const fuelCost = 100;
    if (gameState.ship.fuel < fuelCost) {
        showNotification('⚠️ Sin Combustible', 'No tienes suficiente combustible');
        return;
    }

    // Si ya hay viaje en curso, rechazar
    if (gameState.shipTraveling) {
        showNotification('⌛ En viaje', 'Ya estás en tránsito');
        return;
    }

    // Consumir combustible por partida (preparación)
    gameState.ship.fuel -= fuelCost;

    // Origen
    const originVec = spaceship.position.clone();

    // Duración basada en distancia (visual) * factor * petición ×10
    const targetPlanet = planets[planet];
    const dist = originVec.distanceTo(new THREE.Vector3(targetPlanet.mesh.position.x, targetPlanet.mesh.position.y, targetPlanet.mesh.position.z));
    let durationMs = dist * GAME_CONFIG.TRAVEL_MS_PER_UNIT * GAME_CONFIG.TRAVEL_DURATION_MULTIPLIER;
    // Mínimo razonable
    durationMs = Math.max(durationMs, 5000);

    gameState.shipTraveling = true;
    gameState.travelOrigin = originVec;
    gameState.travelTargetName = planet;
    gameState.travelStartTime = Date.now();
    gameState.travelDuration = durationMs;

    showNotification('🚀 Viaje Iniciado', `Viajando a ${planet.toUpperCase()} — duración ~${Math.round(durationMs / 1000)}s`);
    selectedPlanet = planet;
}

// Encuentro con piratas en viaje
function pirateEncounter() {
    // Probabilidad y severidad escalan con distancia y con cargamento
    if (!gameState.shipTraveling) return;
    // Si nave ya baja de salud, menos chance (para no stackear)
    if (Math.random() > 0.85) return; // ajuste de frecuencia

    const severity = Math.ceil(Math.random() * 50); // daño
    gameState.ship.health = Math.max(0, gameState.ship.health - severity);

    // Roban parte de los minerales si hay
    const stolen = Math.min(gameState.resources.minerals.amount, Math.floor(Math.random() * 30));
    gameState.resources.minerals.amount -= stolen;

    showNotification('☠️ Encuentro con Piratas', `Daño: -${severity} HP. Minerales robados: ${stolen}`);
}

// ==================== COMERCIO, CONSTRUCCIÓN Y BASES ====================
function buyResource(resource) {
    const res = gameState.resources[resource];
    if (!res) return;

    const amount = 10;
    const cost = res.price * amount;

    if (gameState.credits < cost) {
        showNotification('⚠️ Sin Fondos', `Necesitas ${cost} créditos`);
        return;
    }

    if (res.amount + amount > res.capacity) {
        showNotification('⚠️ Capacidad Llena', 'Construye más almacenes');
        return;
    }

    gameState.credits -= cost;
    res.amount += amount;
    showNotification('💰 Compra', `+${amount} ${resource} por ${cost}cr`);
}

function sellResource(resource) {
    const res = gameState.resources[resource];
    const amount = 10;

    if (!res || res.amount < amount) {
        showNotification('⚠️ Sin Recursos', `Necesitas ${amount} unidades`);
        return;
    }

    const earnings = res.price * amount;
    gameState.credits += earnings;
    res.amount -= amount;
    showNotification('💰 Venta', `-${amount} ${resource} por ${earnings}cr`);
}

function buildStructure(type) {
    const current = gameState.currentPlanet;
    const base = gameState.bases[current];
    const costs = {
        refinery: { credits: 2000, minerals: 50 },
        factory: { credits: 3500, minerals: 80, electronics: 15 },
        storage: { credits: 1500, minerals: 40 },
        laboratory: { credits: 5000, electronics: 50 }
    };

    const cost = costs[type];
    if (!cost) return;

    if (gameState.credits < cost.credits) {
        showNotification('⚠️ Sin Fondos', `Necesitas ${cost.credits} créditos`);
        return;
    }

    // Verificar que la base exista (si no existe, debes establecer base primero)
    if (!base || !base.exists) {
        showNotification('⚠️ Sin Base', `No hay base en ${current}. Primero establece una base o trae recursos.`);
        return;
    }

    for (let res in cost) {
        if (res !== 'credits') {
            const have = base.inventory[res] || 0;
            if (have < cost[res]) {
                showNotification('⚠️ Recursos insuficientes', `La base en ${current} necesita ${cost[res]} ${res}`);
                return;
            }
        }
    }

    // Deducir
    gameState.credits -= cost.credits;
    for (let res in cost) {
        if (res !== 'credits') {
            base.inventory[res] -= cost[res];
        }
    }

    base.structures[type] = (base.structures[type] || 0) + 1;

    // Si storage, aumentar capacidad global para simplificar
    if (type === 'storage') {
        Object.keys(gameState.resources).forEach(r => gameState.resources[r].capacity += 200);
    }

    showNotification('🗏️ Construido', `${type} construido en ${current.toUpperCase()}`);
}

function establishBase() {
    // Para establecer base en la ubicación actual (si no existe) necesitas transportar materiales antes.
    const loc = gameState.currentPlanet;
    const base = gameState.bases[loc];

    if (base.exists) {
        showNotification('ℹ️ Ya existe base', `Ya existe una base en ${loc}`);
        return;
    }

    // Requisitos para fundar base (ejemplo)
    const req = { minerals: 200, electronics: 20, fuel: 100, credits: 3000 };

    // Requerir que los recursos estén en el inventario local (si ya trajiste) o en la base origen (earth)
    const localInv = gameState.bases[loc].inventory || {};
    const haveMinerals = localInv.minerals || 0;
    const haveElect = localInv.electronics || 0;
    const haveFuel = localInv.fuel || 0;

    if (haveMinerals < req.minerals || haveElect < req.electronics || haveFuel < req.fuel || gameState.credits < req.credits) {
        showNotification('⚠️ Recursos insuficientes', `Para fundar base en ${loc} necesitas trasladar: ${req.minerals} minerals, ${req.electronics} electronics, ${req.fuel} fuel y ${req.credits} credits.`);
        return;
    }

    // Consumir y fundar con tiempo
    gameState.bases[loc].inventory.minerals -= req.minerals;
    gameState.bases[loc].inventory.electronics -= req.electronics;
    gameState.bases[loc].inventory.fuel -= req.fuel;
    gameState.credits -= req.credits;

    const duration = 15000; // 15s para fundar (ejemplo)
    startAction(`Fundar base en ${loc.toUpperCase()}`, duration, () => {
        gameState.bases[loc].exists = true;
        gameState.bases[loc].owner = 'player';
        gameState.bases[loc].structures = { storage: 1 }; // base mínima
        showNotification('🏗️ Base establecida', `Base en ${loc.toUpperCase()} establecida con éxito.`);
    });
}

// Transportar recursos desde la base actual al destino (consume tiempo)
function transportResourcesToBase(destPlanet, resource, amount) {
    const src = gameState.currentPlanet;
    const srcBase = gameState.bases[src];
    const destBase = gameState.bases[destPlanet];

    if (!srcBase || !srcBase.exists) {
        showNotification('⚠️ No hay base origen', `No hay base operativa en ${src}`);
        return;
    }
    if (!srcBase.inventory || (srcBase.inventory[resource] || 0) < amount) {
        showNotification('⚠️ Sin recursos', `No hay ${amount} ${resource} en la base de ${src}`);
        return;
    }

    // Calcular tiempo de viaje ida+vuelta con factor y bloquear acción
    const distUnits = Math.abs(planets[src].orbit - planets[destPlanet].orbit);
    const durationMs = Math.max(5000, distUnits * GAME_CONFIG.TRAVEL_MS_PER_UNIT * GAME_CONFIG.TRAVEL_DURATION_MULTIPLIER * 0.6);

    // Deducir inmediatamente (los envíos se encolan)
    srcBase.inventory[resource] -= amount;

    startAction(`Transportando ${amount} ${resource} a ${destPlanet.toUpperCase()}`, durationMs, () => {
        if (!gameState.bases[destPlanet].inventory) gameState.bases[destPlanet].inventory = {};
        gameState.bases[destPlanet].inventory[resource] = (gameState.bases[destPlanet].inventory[resource] || 0) + amount;
        showNotification('📦 Entrega completada', `${amount} ${resource} entregados en ${destPlanet.toUpperCase()}`);
    });
}

// Reparar y repostar siguen siendo instant o con pequeño tiempo
function repairShip() {
    const cost = 500;
    if (gameState.credits < cost) {
        showNotification('⚠️ Sin Fondos', `Necesitas ${cost} créditos`);
        return;
    }

    if (gameState.ship.health >= 100) {
        showNotification('ℹ️ No Necesario', 'La nave está perfecta');
        return;
    }

    gameState.credits -= cost;
    // Tiempo de reparación
    startAction('Reparando nave', 5000, () => {
        gameState.ship.health = 100;
        showNotification('🔧 Reparado', 'Nave al 100%');
    });
}

function refuelShip() {
    const fuelNeeded = gameState.ship.maxFuel - gameState.ship.fuel;

    if (fuelNeeded === 0) {
        showNotification('ℹ️ Tanque Lleno', 'Ya tienes combustible completo');
        return;
    }

    // Preferir reabastecer desde la base local
    const base = gameState.bases[gameState.currentPlanet];
    const available = base && base.inventory ? (base.inventory.fuel || 0) : 0;

    if (available > 0) {
        const take = Math.min(available, fuelNeeded);
        base.inventory.fuel -= take;
        gameState.ship.fuel += take;
        showNotification('⛽ Reabastecido', `+${Math.floor(take)} combustible desde la base`);
        return;
    }

    const fuelFromResources = Math.min(fuelNeeded, gameState.resources.fuel.amount);

    if (fuelFromResources === 0) {
        showNotification('⚠️ Sin Combustible', 'No tienes recursos de combustible');
        return;
    }

    gameState.resources.fuel.amount -= fuelFromResources;
    gameState.ship.fuel += fuelFromResources;

    showNotification('⛽ Reabastecido', `+${Math.floor(fuelFromResources)} combustible`);
}

function toggleMarket() {
    const panel = document.getElementById('marketPanel');
    panel.classList.toggle('show');
}

// ==================== UI UPDATES ====================
function updateUI() {
    // Recursos (global)
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = '';

    Object.keys(gameState.resources).forEach(key => {
        const res = gameState.resources[key];
        const percentage = (res.amount / res.capacity) * 100;

        const priceChange = res.price - (res.lastPrice || res.price);
        const priceClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : '';
        const priceArrow = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→';

        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span class="stat-label">${key.replace('_', ' ').toUpperCase()}</span>
                <span class="stat-value">${Math.floor(res.amount)}/${res.capacity}</span>
            </div>
            <div class="resource-bar">
                <div class="resource-fill" style="width: ${percentage}%"></div>
            </div>
            <div style="font-size: 9px; color: #0ff; margin-top: 3px;">
                <span class="${priceClass}">${priceArrow} ${res.price}cr</span>
            </div>
        `;
        resourceList.appendChild(div);
    });

    // Créditos
    const creditsDiv = document.createElement('div');
    creditsDiv.innerHTML = `
        <div style="margin-top: 10px; padding: 8px; background: rgba(0,255,0,0.1); border: 2px solid #0f0;">
            <div class="stat-label">💰 CRÉDITOS</div>
            <div class="stat-value" style="font-size: 18px;">${gameState.credits}</div>
        </div>
    `;
    resourceList.appendChild(creditsDiv);

    // Estructuras (global)
    const structuresDiv = document.createElement('div');
    structuresDiv.innerHTML = `
        <div style="margin-top: 10px; padding: 5px; background: rgba(0,100,200,0.1); border: 1px solid #0ff;">
            <div class="stat-label">🏭 ESTRUCTURAS GLOBALES</div>
            <div style="font-size: 9px; margin-top: 3px;">
                <div>Refinerías: ${gameState.structures.refinery}</div>
                <div>Fábricas: ${gameState.structures.factory}</div>
                <div>Almacenes: ${gameState.structures.storage}</div>
            </div>
        </div>
    `;
    resourceList.appendChild(structuresDiv);

    // Mostrar información de la base local también
    const base = gameState.bases[gameState.currentPlanet];
    const baseDiv = document.createElement('div');
    baseDiv.style.marginTop = '8px';
    if (base && base.exists) {
        baseDiv.innerHTML = `
            <div style="margin-top: 6px; padding: 6px; background: rgba(255,255,255,0.02); border: 1px solid #00ffff;">
                <div class="stat-label">🏠 Base - ${gameState.currentPlanet.toUpperCase()}</div>
                <div style="font-size: 10px;">
                    <div>Propietario: ${base.owner}</div>
                    <div>Estructuras: ${Object.keys(base.structures).length ? Object.entries(base.structures).map(e=>`${e[0]}:${e[1]}`).join(', ') : 'Ninguna'}</div>
                    <div>Inventario: ${Object.keys(base.inventory).length ? JSON.stringify(base.inventory) : 'Vacío'}</div>
                </div>
            </div>
        `;
    } else {
        baseDiv.innerHTML = `
            <div style="margin-top: 6px; padding: 6px; background: rgba(255,0,0,0.02); border: 1px solid #00ffff;">
                <div class="stat-label">🏚️ No hay base - ${gameState.currentPlanet.toUpperCase()}</div>
                <div style="font-size: 10px;">Puedes transportar recursos y fundar una base aquí.</div>
            </div>
        `;
    }
    resourceList.appendChild(baseDiv);

    // Misiones
    const missionInfo = document.getElementById('missionInfo');
    if (gameState.missions.length > 0) {
        const mission = gameState.missions[0];
        missionInfo.innerHTML = `
            <div class="mission-item">
                <div style="font-weight: bold; color: #0ff; font-size: 11px;">${mission.title}</div>
                <div style="margin: 3px 0; font-size: 10px;">${mission.desc}</div>
                <div style="color: #0f0; font-size: 10px;">💰 ${mission.reward} créditos</div>
            </div>
        `;
    } else {
        missionInfo.innerHTML = '<div style="color: #888; font-size: 10px;">Sin misiones activas</div>';
    }

    // Info nave
    const shipInfo = document.getElementById('shipInfo');
    const fuelPercent = (gameState.ship.fuel / gameState.ship.maxFuel) * 100;
    const fuelColor = fuelPercent < 20 ? '#f00' : fuelPercent < 50 ? '#ff0' : '#0f0';
    const healthColor = gameState.ship.health < 30 ? '#f00' : gameState.ship.health < 60 ? '#ff0' : '#0f0';

    shipInfo.innerHTML = `
        <div style="font-size: 10px;">
            <div>⛽ <span style="color: ${fuelColor}">${Math.floor(gameState.ship.fuel)}/${gameState.ship.maxFuel}</span></div>
            <div>❤️ <span style="color: ${healthColor}">${gameState.ship.health}%</span></div>
            <div>👥 <span class="stat-value">${gameState.ship.crew}/${gameState.ship.maxCrew}</span></div>
            <div>📍 <span class="stat-value">${gameState.currentPlanet.toUpperCase()}</span></div>
            <div>🧭 Planetas cercanos: ${getNearestPlanetsList().map(p=>p.toUpperCase()).join(', ')}</div>
        </div>
    `;

    // Controles: Mostrar botones de viaje a los DOS planetas más cercanos
    const controlButtons = document.getElementById('controlButtons');
    const canMine = gameState.ship.fuel >= 50 && !gameState.activeAction;
    const canTravel = gameState.ship.fuel >= 100 && !gameState.shipTraveling && !gameState.activeAction;
    const canRepair = gameState.ship.health < 100 && gameState.credits >= 500 && !gameState.activeAction;
    const canRefuel = gameState.ship.fuel < gameState.ship.maxFuel && ((gameState.bases[gameState.currentPlanet] && (gameState.bases[gameState.currentPlanet].inventory.fuel || 0) > 0) || gameState.resources.fuel.amount > 0);

    // Botones de los 2 planetas más cercanos
    const nearest = getNearestPlanetsList();

    controlButtons.innerHTML = `
        <button onclick="mineResources()" ${!canMine ? 'disabled' : ''}>⛏️ MINAR</button>
        <button onclick="refuelShip()" ${!canRefuel ? 'disabled' : ''}>⛽ CARGAR</button>
        <button onclick="repairShip()" ${!canRepair ? 'disabled' : ''}>🔧 REPARAR</button>
        <button onclick="establishBase()">🏗️ Fundar base</button>
        <button onclick="buildStructure('storage')">📦 Almacén</button>
        <button onclick="buildStructure('refinery')">🏭 Refinería</button>
        <button onclick="buildStructure('factory')">🗏️ Fábrica</button>
        <button onclick="buildStructure('laboratory')">🔬 Laboratorio</button>
        <button onclick="transportDialog()">🚚 Transportar</button>
        <div style="grid-column: 1 / -1; display: flex; gap:6px; margin-top:4px;">
            ${nearest.map(p => `<button onclick="travelToPlanet('${p}')" ${!canTravel ? 'disabled' : ''} style="flex:1; background:${gameState.currentPlanet===p?'#006600':'#003366'}">
                🚀 ${p.toUpperCase()}
            </button>`).join('')}
        </div>
    `;

    // Mercado
    const marketList = document.getElementById('marketList');
    marketList.innerHTML = '';

    Object.keys(gameState.resources).forEach(key => {
        const res = gameState.resources[key];
        const priceChange = res.price - (res.lastPrice || res.price);
        const priceClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : '';
        const priceArrow = priceChange > 0 ? '📈' : priceChange < 0 ? '📉' : '➡️';

        const canBuy = gameState.credits >= res.price * 10 && res.amount + 10 <= res.capacity;
        const canSell = res.amount >= 10;

        const div = document.createElement('div');
        div.className = 'market-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold; font-size: 11px;">${key.replace('_', ' ').toUpperCase()}</span>
                <span class="${priceClass}" style="font-size: 11px;">${priceArrow} ${res.price}cr</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <button onclick="buyResource('${key}')" ${!canBuy ? 'disabled' : ''} style="font-size: 10px; padding: 8px;">
                    COMPRAR 10<br>(${res.price * 10}cr)
                </button>
                <button onclick="sellResource('${key}')" ${!canSell ? 'disabled' : ''} style="font-size: 10px; padding: 8px;">
                    VENDER 10<br>(+${res.price * 10}cr)
                </button>
            </div>
        `;
        marketList.appendChild(div);
    });

    // Actualizar contadores
    document.getElementById('dayCounter').textContent = gameState.day;
    document.getElementById('yearCounter').textContent = gameState.year;

    // Mostrar barra de acción si hay una acción en curso
    const controlPanel = document.getElementById('controlPanel');
    const existingAction = gameState.activeAction;
    let actionProgressHtml = '';
    if (existingAction) {
        const remaining = Math.max(0, existingAction.endTime - Date.now());
        actionProgressHtml = `<div style="margin-top:8px; font-size:10px; color:#0ff;">Acción: ${existingAction.name} — ${Math.ceil(remaining/1000)}s restantes</div>`;
    }
    if (controlPanel) {
        // Añadir info simple
        if (!controlPanel.querySelector('.action-status')) {
            const div = document.createElement('div');
            div.className = 'action-status';
            div.style.marginTop = '6px';
            div.style.fontSize = '10px';
            div.style.color = '#0ff';
            controlPanel.appendChild(div);
        }
        controlPanel.querySelector('.action-status').innerHTML = actionProgressHtml;
    }
}

// Devuelve los 2 planetas más cercanos (por diferencia de orbit radii) excluyendo el actual
function getNearestPlanetsList() {
    const current = gameState.currentPlanet;
    const all = Object.keys(planets).filter(k => ['sun', 'asteroid'].indexOf(k) === -1);
    if (!planets[current]) return all.slice(0, 2);
    const list = all
        .filter(k => k !== current)
        .map(k => ({ name: k, dist: Math.abs((planets[k].orbit || 0) - (planets[current].orbit || 0)) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2)
        .map(x => x.name);
    // Si hay menos de 2, rellenar con otros
    while (list.length < 2) {
        const extras = all.filter(n => list.indexOf(n) === -1 && n !== current);
        if (extras.length === 0) break;
        list.push(extras[0]);
    }
    return list;
}

// Dialogo simple para transportar recursos (usa prompt para compatibilidad rápida)
function transportDialog() {
    const dest = prompt('Transportar a (planet): escribe el nombre exacto (ej: moon, mars):');
    if (!dest || !planets[dest]) {
        showNotification('⚠️ Destino inválido', 'Planeta no reconocido');
        return;
    }
    const resource = prompt('Recurso a transportar (minerals, fuel, electronics):');
    if (!resource) return;
    const amount = parseInt(prompt('Cantidad:'), 10);
    if (!amount || amount <= 0) return;
    transportResourcesToBase(dest, resource, amount);
}

// ==================== NOTIFICACIONES ====================
function showNotification(title, text) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    document.getElementById('notifTitle').textContent = title;
    document.getElementById('notifText').textContent = text;
    notif.className = 'show';

    document.getElementById('notifBtn').onclick = () => {
        notif.className = '';
    };

    setTimeout(() => {
        if (notif.className === 'show') {
            notif.className = '';
        }
    }, 4000);
}

// ==================== GUARDADO / CARGADO ====================
function saveGame() {
    try {
        const saveData = {
            ...gameState,
            version: '1.1'
        };
        localStorage.setItem('spaceGameSave', JSON.stringify(saveData));
        console.log('Juego guardado');
    } catch (e) {
        console.log('Error al guardar:', e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('spaceGameSave');
        if (saved) {
            const loadedData = JSON.parse(saved);
            // Merge conservador
            gameState = { ...gameState, ...loadedData };
            console.log('Juego cargado');
        }
    } catch (e) {
        console.log('Error al cargar:', e);
    }
}

// Guardar periódicamente
setInterval(saveGame, 30000);
window.addEventListener('beforeunload', saveGame);

// ==================== GAME LOOP ====================
function animate() {
    requestAnimationFrame(animate);

    updatePlanets();
    updateGameState();

    renderer.render(scene, camera);
}

// ==================== INICIALIZACIÓN ====================
function init() {
    initThreeJS();
    updateUI();

    setTimeout(() => {
        showNotification(
            '🌟 BIENVENIDO COMANDANTE',
            'Explora el sistema solar, mina recursos, construye bases y gestiona tus operaciones. Los viajes llevan tiempo: planifica.'
        );
    }, 1000);

    // Simular carga
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 10;
        const el = document.getElementById('loadingFill');
        if (el) el.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                const ls = document.getElementById('loadingScreen');
                if (ls) ls.style.display = 'none';
            }, 500);
        }
    }, 200);

    loadGame();
    animate();
}

// Iniciar el juego cuando cargue la página
window.addEventListener('load', init);
