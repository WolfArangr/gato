// ==================== CONFIGURACIÓN GLOBAL ====================
const GAME_CONFIG = {
    // Tiempo: 1 minuto real = 1 día del juego
    TIME_SCALE: 36000 / 365, // Segundos por frame para completar un día
    YEAR_DAYS: 365,
    
    // Órbitas realistas (en unidades arbitrarias para visualización)
    ORBITS: {
        EARTH: { distance: 150, speed: 1, eccentricity: 0.017 }, // 365 días
        MOON: { distance: 15, speed: 12.37, eccentricity: 0.055 }, // ~27 días
        MARS: { distance: 228, speed: 0.532, eccentricity: 0.093 }, // 687 días
        VENUS: { distance: 108, speed: 1.626, eccentricity: 0.007 }, // 225 días
        JUPITER: { distance: 520, speed: 0.084, eccentricity: 0.048 }, // 4333 días
    },
    
    // Tamaños para visualización
    SIZES: {
        SUN: 60,
        EARTH: 6,
        MOON: 2,
        MARS: 3,
        VENUS: 6,
        JUPITER: 18,
    }
};

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    day: 1,
    year: 1,
    time: 0, // En días
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
    
    production: {
        lastUpdate: 0
    }
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
let travelProgress = 0;
let travelStart = null;
let travelTarget = null;

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
    
    // Crear nave espacial
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
    
    // Cuerpo principal (cápsula alargada)
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
    
    // Cabina frontal (esfera achatada)
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
    
    // Nariz puntiaguda
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
    
    // Alas (izquierda y derecha)
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
    
    // Motores traseros (izquierdo y derecho)
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
    
    // Luces de motor (efecto glow)
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
    
    // Luces puntuales para los motores
    const leftLight = new THREE.PointLight(0x00ffff, 2, 20);
    leftLight.position.set(-4.5, 0, -2);
    shipGroup.add(leftLight);
    
    const rightLight = new THREE.PointLight(0x00ffff, 2, 20);
    rightLight.position.set(-4.5, 0, 2);
    shipGroup.add(rightLight);
    
    // Detalles azules en el cuerpo
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
    
    // Posicionar la nave inicialmente en la Tierra
    shipGroup.scale.set(0.8, 0.8, 0.8);
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
    
    // Tierra
    const earthOrbit = GAME_CONFIG.ORBITS.EARTH;
    createPlanet('earth', 'planeta1.png', GAME_CONFIG.SIZES.EARTH, 
                 earthOrbit.distance, earthOrbit.speed, 0, earthOrbit.eccentricity);
    
    // Luna (orbita la Tierra)
    const moonOrbit = GAME_CONFIG.ORBITS.MOON;
    createMoon('moon', 'luna1.png', GAME_CONFIG.SIZES.MOON, 
               moonOrbit.distance, moonOrbit.speed, planets.earth, moonOrbit.eccentricity);
    
    // Marte
    const marsOrbit = GAME_CONFIG.ORBITS.MARS;
    createPlanet('mars', 'planeta2.png', GAME_CONFIG.SIZES.MARS, 
                 marsOrbit.distance, marsOrbit.speed, Math.PI / 4, marsOrbit.eccentricity);
    
    // Venus
    const venusOrbit = GAME_CONFIG.ORBITS.VENUS;
    createPlanet('venus', 'luna5.png', GAME_CONFIG.SIZES.VENUS, 
                 venusOrbit.distance, venusOrbit.speed, Math.PI, venusOrbit.eccentricity);
    
    // Júpiter
    const jupiterOrbit = GAME_CONFIG.ORBITS.JUPITER;
    createPlanet('jupiter', 'luna2.png', GAME_CONFIG.SIZES.JUPITER, 
                 jupiterOrbit.distance, jupiterOrbit.speed, Math.PI / 2, jupiterOrbit.eccentricity);
    
    // Europa (luna de Júpiter)
    createMoon('europa', 'luna3.png', 1.2, 25, 0.06, planets.jupiter, 0.009);
    
    // Cinturón de asteroides
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
        speed: speed * 0.001, // Ralentizar
        rotationSpeed: 0.01 // Rotación sobre su eje
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
        tidalLock: true // La luna siempre mira a la Tierra
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
            // Luna orbita su planeta padre
            const parentPos = planet.parent.mesh.position;
            planet.angle += planet.speed;
            
            // Órbita elíptica
            const r = planet.orbit * (1 - planet.eccentricity * planet.eccentricity) / 
                     (1 + planet.eccentricity * Math.cos(planet.angle));
            
            planet.mesh.position.x = parentPos.x + Math.cos(planet.angle) * r;
            planet.mesh.position.z = parentPos.z + Math.sin(planet.angle) * r;
            planet.mesh.position.y = parentPos.y;
            
            // Tidal lock: la luna siempre mira al planeta
            if (planet.tidalLock) {
                planet.mesh.lookAt(parentPos);
            }
        } else if (planet.orbit > 0) {
            // Planeta orbita el sol
            planet.angle += planet.speed;
            
            // Órbita elíptica
            const r = planet.orbit * (1 - planet.eccentricity * planet.eccentricity) / 
                     (1 + planet.eccentricity * Math.cos(planet.angle));
            
            planet.mesh.position.x = Math.cos(planet.angle) * r;
            planet.mesh.position.z = Math.sin(planet.angle) * r;
            
            // Rotación sobre su eje (1 día = 1 rotación completa)
            if (planet.rotationSpeed) {
                planet.mesh.rotation.y += planet.rotationSpeed;
            }
        }
    });
    
    // Actualizar posición de la nave
    updateSpaceship();
    
    // Cámara sigue la nave
    updateCamera();
}

function updateSpaceship() {
    if (!spaceship) return;
    
    if (shipTraveling && travelStart && travelTarget) {
        // Interpolar posición durante el viaje
        travelProgress += 0.005; // Velocidad de viaje
        
        if (travelProgress >= 1) {
            // Viaje completado
            shipTraveling = false;
            travelProgress = 0;
            spaceship.position.copy(travelTarget.mesh.position);
            spaceship.position.y += 5;
        } else {
            // Interpolación suave (ease in-out)
            const easeProgress = travelProgress < 0.5 
                ? 2 * travelProgress * travelProgress 
                : 1 - Math.pow(-2 * travelProgress + 2, 2) / 2;
            
            spaceship.position.lerpVectors(
                travelStart,
                new THREE.Vector3(
                    travelTarget.mesh.position.x,
                    travelTarget.mesh.position.y + 5,
                    travelTarget.mesh.position.z
                ),
                easeProgress
            );
            
            // Orientar la nave hacia el destino
            const direction = new THREE.Vector3()
                .subVectors(travelTarget.mesh.position, spaceship.position)
                .normalize();
            
            const angle = Math.atan2(direction.z, direction.x);
            spaceship.rotation.y = angle - Math.PI / 2;
            
            // Animación de balanceo durante el viaje
            spaceship.rotation.z = Math.sin(travelProgress * Math.PI * 4) * 0.1;
        }
    } else {
        // Nave en órbita del planeta actual
        const currentPlanetData = planets[gameState.currentPlanet];
        if (currentPlanetData) {
            spaceship.position.x = currentPlanetData.mesh.position.x;
            spaceship.position.z = currentPlanetData.mesh.position.z;
            spaceship.position.y = currentPlanetData.mesh.position.y + 5;
            
            // Rotación suave en órbita
            spaceship.rotation.y += 0.002;
            spaceship.rotation.z = 0;
        }
    }
}

function updateCamera() {
    if (!spaceship) return;
    
    const targetPos = spaceship.position;
    
    // Si está viajando, no aplicar rotación automática
    if (!shipTraveling) {
        cameraAngle += 0.0002;
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
    
    // Si fue un tap rápido (no arrastrar), detectar click en planeta
    if (touchStartPos && Date.now() - touchStartPos.time < 200) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartPos.x);
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartPos.y);
        
        if (deltaX < 10 && deltaY < 10) {
            // Fue un tap, no un arrastre
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
    gameState.currentPlanet = name;
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
    const deltaTime = (now - lastFrameTime) / 1000; // En segundos
    lastFrameTime = now;
    
    // Incrementar tiempo del juego (más lento)
    gameState.time += deltaTime * GAME_CONFIG.TIME_SCALE;
    
    const prevDay = gameState.day;
    gameState.day = Math.floor(gameState.time) + 1;
    gameState.year = Math.floor(gameState.day / GAME_CONFIG.YEAR_DAYS) + 1;
    
    // Nuevo día
    if (gameState.day !== prevDay) {
        onNewDay();
    }
    
    // Producción continua cada 10 días del juego
    if (gameState.day - gameState.production.lastUpdate >= 10) {
        produceResources();
        gameState.production.lastUpdate = gameState.day;
    }
    
    // Actualizar mercado cada 5 días
    if (gameState.day % 5 === 0 && gameState.day !== prevDay) {
        updateMarket();
    }
    
    updateUI();
}

function onNewDay() {
    // Consumo de recursos de la nave
    gameState.ship.fuel = Math.max(0, gameState.ship.fuel - 5);
    
    // Generar nuevas misiones
    if (Math.random() < 0.2 && gameState.missions.length < 2) {
        generateMission();
    }
    
    // Eventos aleatorios
    if (Math.random() < 0.05) {
        generateRandomEvent();
    }
}

function produceResources() {
    if (gameState.structures.refinery === 0 && 
        gameState.structures.factory === 0) {
        return; // No hay producción sin estructuras
    }
    
    // Producción por estructuras (x10 días)
    const production = {
        minerals: gameState.structures.refinery * 20,
        electronics: gameState.structures.factory * 10,
        fuel: gameState.structures.refinery * 30
    };
    
    let totalProduced = 0;
    
    Object.keys(production).forEach(res => {
        if (gameState.resources[res] && production[res] > 0) {
            const before = gameState.resources[res].amount;
            const newAmount = Math.min(
                gameState.resources[res].amount + production[res],
                gameState.resources[res].capacity
            );
            gameState.resources[res].amount = newAmount;
            totalProduced += (newAmount - before);
        }
    });
    
    if (totalProduced > 0) {
        showNotification('� Producción', `Tus estructuras han producido recursos`);
    }
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
    
    const mission = missions[type];
    mission.id = Date.now();
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

// ==================== ACCIONES DEL JUGADOR ====================
function mineResources() {
    if (gameState.ship.fuel < 50) {
        showNotification('⚠️ Sin Combustible', 'Necesitas al menos 50 de combustible');
        return;
    }
    
    const planet = gameState.currentPlanet;
    const miningYield = {
        earth: { minerals: 10, water: 5 },
        moon: { minerals: 25, water: 3 },
        mars: { minerals: 18, fuel: 12 },
        europa: { water: 30, minerals: 5 },
        venus: { minerals: 8, fuel: 8 },
        jupiter: { fuel: 15 }
    };
    
    const yield = miningYield[planet];
    if (!yield) {
        showNotification('⚠️ No Disponible', 'No puedes minar aquí');
        return;
    }
    
    gameState.ship.fuel -= 50;
    let mined = [];
    
    Object.keys(yield).forEach(res => {
        if (gameState.resources[res]) {
            const amount = yield[res];
            gameState.resources[res].amount = Math.min(
                gameState.resources[res].amount + amount,
                gameState.resources[res].capacity
            );
            mined.push(`${amount} ${res}`);
        }
    });
    
    showNotification('⛏️ Minería Exitosa', `Extraído: ${mined.join(', ')}`);
}

function travelToPlanet(planet) {
    if (!planets[planet]) return;
    
    if (planet === gameState.currentPlanet) {
        showNotification('ℹ️ Ya estás aquí', `Ya te encuentras en ${planet}`);
        return;
    }
    
    const fuelCost = 100;
    if (gameState.ship.fuel < fuelCost) {
        showNotification('⚠️ Sin Combustible', 'No tienes suficiente combustible');
        return;
    }
    
    // Iniciar viaje
    gameState.ship.fuel -= fuelCost;
    
    travelStart = spaceship.position.clone();
    travelTarget = planets[planet];
    shipTraveling = true;
    travelProgress = 0;
    
    // Actualizar destino
    gameState.currentPlanet = planet;
    
    if (!gameState.discoveredPlanets.includes(planet)) {
        gameState.discoveredPlanets.push(planet);
        gameState.credits += 1000;
        showNotification('🎉 Descubrimiento!', `${planet.toUpperCase()} descubierto! +1000 créditos`);
    } else {
        showNotification('🚀 Viaje Iniciado', `Viajando a ${planet.toUpperCase()}...`);
    }
    
    selectedPlanet = planet;
}

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
    
    // Verificar recursos
    for (let res in cost) {
        if (res !== 'credits' && gameState.resources[res]) {
            if (gameState.resources[res].amount < cost[res]) {
                showNotification('⚠️ Sin Recursos', `Necesitas ${cost[res]} ${res}`);
                return;
            }
        }
    }
    
    // Deducir costos
    gameState.credits -= cost.credits;
    for (let res in cost) {
        if (res !== 'credits' && gameState.resources[res]) {
            gameState.resources[res].amount -= cost[res];
        }
    }
    
    gameState.structures[type]++;
    
    // Beneficios
    if (type === 'storage') {
        Object.keys(gameState.resources).forEach(res => {
            gameState.resources[res].capacity += 200;
        });
    }
    
    const names = {
        refinery: 'Refinería',
        factory: 'Fábrica',
        storage: 'Almacén',
        laboratory: 'Laboratorio'
    };
    
    showNotification('🗏️ Construido!', `${names[type]} Nivel ${gameState.structures[type]}`);
}

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
    gameState.ship.health = 100;
    showNotification('🔧 Reparado', 'Nave al 100%');
}

function refuelShip() {
    const fuelNeeded = gameState.ship.maxFuel - gameState.ship.fuel;
    
    if (fuelNeeded === 0) {
        showNotification('ℹ️ Tanque Lleno', 'Ya tienes combustible completo');
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
    // Recursos
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
    
    // Estructuras
    const structuresDiv = document.createElement('div');
    structuresDiv.innerHTML = `
        <div style="margin-top: 10px; padding: 5px; background: rgba(0,100,200,0.1); border: 1px solid #0ff;">
            <div class="stat-label">🏭 ESTRUCTURAS</div>
            <div style="font-size: 9px; margin-top: 3px;">
                <div>Refinerías: ${gameState.structures.refinery}</div>
                <div>Fábricas: ${gameState.structures.factory}</div>
                <div>Almacenes: ${gameState.structures.storage}</div>
            </div>
        </div>
    `;
    resourceList.appendChild(structuresDiv);
    
    // Panel de misión
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
    
    // Info de la nave
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
        </div>
    `;
    
    // Controles
    const controlButtons = document.getElementById('controlButtons');
    const canMine = gameState.ship.fuel >= 50;
    const canTravel = gameState.ship.fuel >= 100;
    const canRepair = gameState.ship.health < 100 && gameState.credits >= 500;
    const canRefuel = gameState.ship.fuel < gameState.ship.maxFuel && gameState.resources.fuel.amount > 0;
    
    controlButtons.innerHTML = `
        <button onclick="mineResources()" ${!canMine ? 'disabled' : ''}>⛏️ MINAR</button>
        <button onclick="refuelShip()" ${!canRefuel ? 'disabled' : ''}>⛽ CARGAR</button>
        <button onclick="repairShip()" ${!canRepair ? 'disabled' : ''}>🔧 REPARAR</button>
        <button onclick="buildStructure('storage')">📦 Almacén</button>
        <button onclick="buildStructure('refinery')">🏭 Refinería</button>
        <button onclick="buildStructure('factory')">🗏️ Fábrica</button>
        <button onclick="travelToPlanet('moon')" ${!canTravel ? 'disabled' : ''} 
                class="button-full" style="background: ${gameState.currentPlanet === 'moon' ? '#006600' : '#003366'}">
            🚀 ${gameState.currentPlanet === 'moon' ? '📍' : '→'} LUNA
        </button>
        <button onclick="travelToPlanet('mars')" ${!canTravel ? 'disabled' : ''}
                class="button-full" style="background: ${gameState.currentPlanet === 'mars' ? '#006600' : '#003366'}">
            🚀 ${gameState.currentPlanet === 'mars' ? '📍' : '→'} MARTE
        </button>
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
}

// ==================== NOTIFICACIONES ====================
function showNotification(title, text) {
    const notif = document.getElementById('notification');
    document.getElementById('notifTitle').textContent = title;
    document.getElementById('notifText').textContent = text;
    notif.className = 'show';
    
    document.getElementById('notifBtn').onclick = () => {
        notif.className = '';
    };
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        if (notif.className === 'show') {
            notif.className = '';
        }
    }, 4000);
}

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
    
    // Mensaje de bienvenida con tutorial
    setTimeout(() => {
        showNotification(
            '🌟 BIENVENIDO COMANDANTE',
            'Explora el sistema solar, mina recursos, construye estructuras para producción automática y comercia en el mercado. ¡Gestiona tu economía espacial!'
        );
    }, 1000);
    
    // Simular carga
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 10;
        document.getElementById('loadingFill').style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
        }
    }, 200);
    
    // Guardar progreso con el estado correcto
    loadGame();
    
    animate();
}

// ==================== GUARDAR/CARGAR ====================
function saveGame() {
    try {
        const saveData = {
            ...gameState,
            version: '1.0'
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
            // Combinar con valores por defecto para compatibilidad
            gameState = {
                ...gameState,
                ...loadedData
            };
            console.log('Juego cargado');
        }
    } catch (e) {
        console.log('Error al cargar:', e);
    }
}

// Guardar automáticamente cada 30 segundos
setInterval(saveGame, 30000);

// Guardar al cerrar
window.addEventListener('beforeunload', saveGame);

// Iniciar el juego cuando cargue la página
window.addEventListener('load', init);
