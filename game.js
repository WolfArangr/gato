// ==================== CONFIGURACIÓN GLOBAL ====================
const GAME_CONFIG = {
    // Escalas realistas (reducidas para gameplay)
    DISTANCE_SCALE: 0.00001, // Factor de escala para distancias
    SIZE_SCALE: 0.001, // Factor de escala para tamaños
    TIME_SCALE: 3600, // 1 segundo = 1 hora
    
    // Órbitas realistas (distancias en millones de km)
    ORBITS: {
        EARTH: 150, // 150 millones de km del Sol
        MOON: 0.384, // 384,000 km de la Tierra
        MARS: 228,
        VENUS: 108,
        JUPITER: 778,
    },
    
    // Tamaños realistas (en km)
    SIZES: {
        SUN: 1392700,
        EARTH: 12742,
        MOON: 3474,
        MARS: 6779,
        VENUS: 12104,
        JUPITER: 139820,
    }
};

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    day: 1,
    time: 0,
    credits: 10000,
    
    resources: {
        minerals: { amount: 100, capacity: 500, price: 50 },
        water: { amount: 50, capacity: 300, price: 80 },
        fuel: { amount: 200, capacity: 1000, price: 30 },
        electronics: { amount: 10, capacity: 100, price: 200 },
        alien_artifacts: { amount: 0, capacity: 50, price: 1000 }
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
    
    market: {},
    
    structures: {
        refinery: 0,
        factory: 0,
        storage: 0,
        laboratory: 0
    }
};

// ==================== THREE.JS SETUP ====================
let scene, camera, renderer, composer;
let planets = {};
let selectedPlanet = null;
let mouse = { x: 0, y: 0 };
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraAngle = 0;
let cameraHeight = 50;
let cameraDistance = 100;

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
    
    // Luz ambiental suave
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);
    
    // Estrellas de fondo
    createStarfield();
    
    // Crear sistema solar
    createSolarSystem();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', onMouseClick);
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

function createSolarSystem() {
    // Sol
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
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
    createPlanet('earth', 'planeta1.png', 5, 150, 0.01, 0);
    
    // Luna (orbita la Tierra)
    createMoon('moon', 'luna1.png', 1.5, 15, 0.05, planets.earth);
    
    // Marte
    createPlanet('mars', 'planeta2.png', 3, 228, 0.008, Math.PI / 4);
    
    // Venus
    createPlanet('venus', 'luna5.png', 4.5, 108, 0.012, Math.PI);
    
    // Júpiter
    createPlanet('jupiter', 'luna2.png', 12, 778, 0.004, Math.PI / 2);
    
    // Europa (luna de Júpiter)
    createMoon('europa', 'luna3.png', 1.2, 25, 0.06, planets.jupiter);
    
    // Cinturón de asteroides
    createAsteroidBelt();
}

function createPlanet(name, texture, size, orbitRadius, speed, startAngle) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const planetTexture = textureLoader.load(`/constelacion/${texture}`);
    const material = new THREE.MeshStandardMaterial({ map: planetTexture });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.userData = { name, type: 'planet' };
    scene.add(mesh);
    
    // Órbita visual
    const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.5, orbitRadius + 0.5, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444466, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitMesh.rotation.x = Math.PI / 2;
    scene.add(orbitMesh);
    
    planets[name] = { 
        mesh, 
        orbit: orbitRadius, 
        angle: startAngle, 
        speed,
        orbitMesh
    };
}

function createMoon(name, texture, size, orbitRadius, speed, parentPlanet) {
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
        angle: 0, 
        speed,
        parent: parentPlanet
    };
}

function createAsteroidBelt() {
    for (let i = 0; i < 200; i++) {
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
            planet.mesh.position.x = parentPos.x + Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = parentPos.z + Math.sin(planet.angle) * planet.orbit;
            planet.mesh.position.y = parentPos.y;
        } else if (planet.orbit > 0) {
            // Planeta orbita el sol
            planet.angle += planet.speed;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbit;
        }
        
        // Rotación del planeta
        planet.mesh.rotation.y += 0.001;
    });
    
    // Cámara sigue la Tierra
    updateCamera();
}

function updateCamera() {
    if (!planets.earth) return;
    
    const earthPos = planets.earth.mesh.position;
    cameraAngle += 0.001;
    
    camera.position.x = earthPos.x + Math.cos(cameraAngle) * cameraDistance;
    camera.position.z = earthPos.z + Math.sin(cameraAngle) * cameraDistance;
    camera.position.y = earthPos.y + cameraHeight;
    camera.lookAt(earthPos);
}

// ==================== EVENTOS DE MOUSE ====================
function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        cameraAngle -= deltaX * 0.01;
        cameraHeight += deltaY * 0.3;
        cameraHeight = Math.max(20, Math.min(150, cameraHeight));
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
}

function onMouseUp() {
    isDragging = false;
}

function onMouseClick(e) {
    if (isDragging) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
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
function updateGameState() {
    gameState.time += 1;
    
    if (gameState.time % 60 === 0) {
        gameState.day++;
        onNewDay();
    }
    
    // Actualizar recursos pasivos
    if (gameState.time % 10 === 0) {
        produceResources();
    }
    
    // Actualizar mercado
    if (gameState.time % 30 === 0) {
        updateMarket();
    }
    
    updateUI();
}

function onNewDay() {
    // Consumo de recursos de la nave
    gameState.ship.fuel = Math.max(0, gameState.ship.fuel - 10);
    
    // Generar nuevas misiones
    if (Math.random() < 0.3 && gameState.missions.length < 3) {
        generateMission();
    }
    
    // Eventos aleatorios
    if (Math.random() < 0.1) {
        generateRandomEvent();
    }
}

function produceResources() {
    // Producción por estructuras
    const production = {
        minerals: gameState.structures.refinery * 2,
        electronics: gameState.structures.factory * 1,
        fuel: gameState.structures.refinery * 3
    };
    
    Object.keys(production).forEach(res => {
        if (gameState.resources[res]) {
            const newAmount = Math.min(
                gameState.resources[res].amount + production[res],
                gameState.resources[res].capacity
            );
            gameState.resources[res].amount = newAmount;
        }
    });
}

function generateMission() {
    const types = ['mining', 'exploration', 'trade', 'rescue'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const missions = {
        mining: {
            title: '⛏️ Extracción de Minerales',
            desc: `Extrae 50 unidades de minerales`,
            reward: 500,
            requirement: { type: 'resource', resource: 'minerals', amount: 50 }
        },
        exploration: {
            title: '🔭 Exploración',
            desc: 'Descubre un nuevo planeta',
            reward: 1000,
            requirement: { type: 'discover' }
        },
        trade: {
            title: '💰 Contrato Comercial',
            desc: 'Vende 20 componentes electrónicos',
            reward: 800,
            requirement: { type: 'sell', resource: 'electronics', amount: 20 }
        },
        rescue: {
            title: '🚨 Misión de Rescate',
            desc: 'Rescata tripulación perdida',
            reward: 1200,
            requirement: { type: 'event' }
        }
    };
    
    const mission = missions[type];
    mission.id = Date.now();
    gameState.missions.push(mission);
}

function generateRandomEvent() {
    const events = [
        { title: '☄️ Lluvia de Meteoritos', desc: 'Daño a la nave: -10 HP', effect: () => { gameState.ship.health = Math.max(0, gameState.ship.health - 10); }},
        { title: '🎁 Descubrimiento', desc: '+5 artefactos alienígenas', effect: () => { gameState.resources.alien_artifacts.amount += 5; }},
        { title: '⚡ Tormenta Solar', desc: 'Los sistemas fallan temporalmente', effect: () => {}},
        { title: '👽 Señal Misteriosa', desc: 'Has detectado algo extraño...', effect: () => {}}
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    showNotification(event.title, event.desc);
}

function updateMarket() {
    Object.keys(gameState.resources).forEach(res => {
        const resource = gameState.resources[res];
        const volatility = 0.1;
        const change = (Math.random() - 0.5) * 2 * volatility;
        resource.price = Math.max(10, Math.round(resource.price * (1 + change)));
    });
}

// ==================== ACCIONES DEL JUGADOR ====================
function mineResources() {
    if (gameState.ship.fuel < 50) {
        showNotification('⚠️ Sin Combustible', 'Necesitas al menos 50 unidades de combustible');
        return;
    }
    
    const planet = selectedPlanet || 'earth';
    const miningYield = {
        earth: { minerals: 10, water: 5 },
        moon: { minerals: 20, water: 3 },
        mars: { minerals: 15, fuel: 10 },
        europa: { water: 25, minerals: 5 }
    };
    
    const yield = miningYield[planet];
    if (!yield) {
        showNotification('⚠️ No Disponible', 'No puedes minar en esta ubicación');
        return;
    }
    
    gameState.ship.fuel -= 50;
    
    Object.keys(yield).forEach(res => {
        if (gameState.resources[res]) {
            gameState.resources[res].amount = Math.min(
                gameState.resources[res].amount + yield[res],
                gameState.resources[res].capacity
            );
        }
    });
    
    showNotification('⛏️ Minería Exitosa', `Has extraído recursos en ${planet}`);
}

function travelToPlanet(planet) {
    if (!planets[planet]) return;
    
    const fuelCost = 100;
    if (gameState.ship.fuel < fuelCost) {
        showNotification('⚠️ Sin Combustible', 'No tienes suficiente combustible para viajar');
        return;
    }
    
    gameState.ship.fuel -= fuelCost;
    gameState.currentPlanet = planet;
    
    if (!gameState.discoveredPlanets.includes(planet)) {
        gameState.discoveredPlanets.push(planet);
        gameState.credits += 500;
        showNotification('🎉 Nuevo Descubrimiento!', `Has descubierto ${planet}. +500 créditos`);
    } else {
        showNotification('🚀 Viaje Completado', `Has viajado a ${planet}`);
    }
    
    selectedPlanet = planet;
}

function buyResource(resource) {
    const res = gameState.resources[resource];
    if (!res) return;
    
    const cost = res.price * 10;
    if (gameState.credits < cost) {
        showNotification('⚠️ Fondos Insuficientes', `Necesitas ${cost} créditos`);
        return;
    }
    
    if (res.amount + 10 > res.capacity) {
        showNotification('⚠️ Capacidad Llena', 'Necesitas más almacenamiento');
        return;
    }
    
    gameState.credits -= cost;
    res.amount += 10;
    showNotification('💰 Compra Realizada', `Has comprado 10 ${resource}`);
}

function sellResource(resource) {
    const res = gameState.resources[resource];
    if (!res || res.amount < 10) {
        showNotification('⚠️ Recursos Insuficientes', 'Necesitas al menos 10 unidades');
        return;
    }
    
    const earnings = res.price * 10;
    gameState.credits += earnings;
    res.amount -= 10;
    showNotification('💰 Venta Realizada', `Has vendido 10 ${resource} por ${earnings} créditos`);
}

function buildStructure(type) {
    const costs = {
        refinery: { credits: 2000, minerals: 50 },
        factory: { credits: 3000, minerals: 80, electronics: 20 },
        storage: { credits: 1500, minerals: 40 },
        laboratory: { credits: 5000, electronics: 50 }
    };
    
    const cost = costs[type];
    if (!cost) return;
    
    if (gameState.credits < cost.credits) {
        showNotification('⚠️ Fondos Insuficientes', `Necesitas ${cost.credits} créditos`);
        return;
    }
    
    // Verificar recursos
    for (let res in cost) {
        if (res !== 'credits' && gameState.resources[res]) {
            if (gameState.resources[res].amount < cost[res]) {
                showNotification('⚠️ Recursos Insuficientes', `Necesitas ${cost[res]} ${res}`);
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
    
    // Aumentar capacidades
    if (type === 'storage') {
        Object.keys(gameState.resources).forEach(res => {
            gameState.resources[res].capacity += 200;
        });
    }
    
    showNotification('🏗️ Construcción Completada', `Has construido: ${type}. Nivel ${gameState.structures[type]}`);
}

function repairShip() {
    const cost = 500;
    if (gameState.credits < cost) {
        showNotification('⚠️ Fondos Insuficientes', `Necesitas ${cost} créditos`);
        return;
    }
    
    if (gameState.ship.health >= 100) {
        showNotification('ℹ️ No Necesario', 'La nave está en perfecto estado');
        return;
    }
    
    gameState.credits -= cost;
    gameState.ship.health = 100;
    showNotification('🔧 Reparación Completada', 'La nave ha sido reparada al 100%');
}

function refuelShip() {
    const fuelNeeded = gameState.ship.maxFuel - gameState.ship.fuel;
    const cost = Math.ceil(fuelNeeded * 0.5);
    
    if (gameState.credits < cost) {
        showNotification('⚠️ Fondos Insuficientes', `Necesitas ${cost} créditos`);
        return;
    }
    
    if (gameState.resources.fuel.amount < fuelNeeded / 2) {
        showNotification('⚠️ Sin Combustible', 'No tienes suficientes recursos de combustible');
        return;
    }
    
    gameState.credits -= cost;
    gameState.resources.fuel.amount -= Math.ceil(fuelNeeded / 2);
    gameState.ship.fuel = gameState.ship.maxFuel;
    showNotification('⛽ Reabastecimiento', 'Combustible de la nave al 100%');
}

// ==================== UI UPDATES ====================
function updateUI() {
    // Actualizar panel de recursos
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = '';
    
    Object.keys(gameState.resources).forEach(key => {
        const res = gameState.resources[key];
        const percentage = (res.amount / res.capacity) * 100;
        
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span class="stat-label">${key.toUpperCase()}</span>
                <span class="stat-value">${Math.floor(res.amount)}/${res.capacity}</span>
            </div>
            <div class="resource-bar">
                <div class="resource-fill" style="width: ${percentage}%"></div>
            </div>
            <div style="font-size: 10px; color: #0ff; margin-top: 3px;">
                Precio: ${res.price} cr/unidad
            </div>
        `;
        resourceList.appendChild(div);
    });
    
    // Créditos
    const creditsDiv = document.createElement('div');
    creditsDiv.innerHTML = `
        <div style="margin-top: 15px; padding: 10px; background: rgba(0,255,0,0.1); border: 2px solid #0f0;">
            <div class="stat-label">💰 CRÉDITOS</div>
            <div class="stat-value" style="font-size: 20px;">${gameState.credits}</div>
        </div>
    `;
    resourceList.appendChild(creditsDiv);
    
    // Actualizar panel de misión
    const missionInfo = document.getElementById('missionInfo');
    if (gameState.missions.length > 0) {
        const mission = gameState.missions[0];
        missionInfo.innerHTML = `
            <div class="mission-item">
                <div style="font-weight: bold; color: #0ff;">${mission.title}</div>
                <div style="margin: 5px 0;">${mission.desc}</div>
                <div style="color: #0f0;">Recompensa: ${mission.reward} créditos</div>
            </div>
        `;
    } else {
        missionInfo.innerHTML = '<div style="color: #888;">No hay misiones activas</div>';
    }
    
    // Info de la nave
    const shipInfo = document.getElementById('shipInfo');
    shipInfo.innerHTML = `
        <div style="font-size: 11px;">
            <div>⛽ Combustible: <span class="stat-value">${Math.floor(gameState.ship.fuel)}/${gameState.ship.maxFuel}</span></div>
            <div>❤️ Salud: <span class="stat-value">${gameState.ship.health}%</span></div>
            <div>👥 Tripulación: <span class="stat-value">${gameState.ship.crew}/${gameState.ship.maxCrew}</span></div>
            <div>📦 Ubicación: <span class="stat-value">${gameState.currentPlanet.toUpperCase()}</span></div>
        </div>
    `;
    
    // Actualizar controles
    const controlButtons = document.getElementById('controlButtons');
    controlButtons.innerHTML = `
        <button onclick="mineResources()">⛏️ MINAR</button>
        <button onclick="refuelShip()">⛽ REABASTECER</button>
        <button onclick="repairShip()">🔧 REPARAR</button>
        <br>
        <button onclick="buildStructure('refinery')">🏭 Refinería (2000cr)</button>
        <button onclick="buildStructure('factory')">🏗️ Fábrica (3000cr)</button>
        <button onclick="buildStructure('storage')">📦 Almacén (1500cr)</button>
        <br>
        <button onclick="travelToPlanet('mars')" ${!gameState.discoveredPlanets.includes('mars') ? '' : 'style="background: #006600;"'}>
            🚀 Viajar a Marte
        </button>
        <button onclick="travelToPlanet('venus')" ${!gameState.discoveredPlanets.includes('venus') ? '' : 'style="background: #006600;"'}>
            🚀 Viajar a Venus
        </button>
    `;
    
    // Actualizar mercado
    const marketList = document.getElementById('marketList');
    marketList.innerHTML = '';
    
    Object.keys(gameState.resources).forEach(key => {
        const res = gameState.resources[key];
        const div = document.createElement('div');
        div.className = 'market-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold;">${key.toUpperCase()}</span>
                <span class="stat-value">${res.price} cr</span>
            </div>
            <button onclick="buyResource('${key}')" style="font-size: 10px; padding: 5px 10px;">
                Comprar 10 (${res.price * 10}cr)
            </button>
            <button onclick="sellResource('${key}')" style="font-size: 10px; padding: 5px 10px;">
                Vender 10 (+${res.price * 10}cr)
            </button>
        `;
        marketList.appendChild(div);
    });
    
    // Actualizar día
    document.getElementById('dayCounter').textContent = gameState.day;
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
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (notif.className === 'show') {
            notif.className = '';
        }
    }, 5000);
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
    
    // Simular carga
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 10;
        document.getElementById('loadingFill').style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                showNotification(
                    '🌟 Bienvenido, Comandante',
                    'Tu misión: explorar el sistema solar, extraer recursos y construir un imperio espacial. ¡Buena suerte!'
                );
            }, 500);
        }
    }, 200);
    
    animate();
}

// Iniciar el juego cuando cargue la página
window.addEventListener('load', init);

// ==================== FUNCIONES AUXILIARES ====================
function saveGame() {
    try {
        localStorage.setItem('spaceGameSave', JSON.stringify(gameState));
        showNotification('💾 Guardado', 'Progreso guardado exitosamente');
    } catch (e) {
        console.log('No se pudo guardar');
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('spaceGameSave');
        if (saved) {
            gameState = JSON.parse(saved);
            showNotification('📂 Carga Completada', 'Progreso restaurado');
        }
    } catch (e) {
        console.log('No se pudo cargar');
    }
}

// Guardar automáticamente cada minuto
setInterval(saveGame, 60000);
