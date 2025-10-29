// exploracion.js - Sistema Solar Simplificado

// ==================== CONFIGURACIÓN GLOBAL ====================
const SOLAR_SYSTEM = {
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

const PLANET_INFO = {
    sun: { name: 'Sol', info: 'wiki' },
    mercury: { name: 'Mercurio', info: 'wiki' },
    venus: { name: 'Venus', info: 'wiki' },
    earth: { name: 'Tierra', info: 'wiki' },
    moon: { name: 'Luna', info: 'wiki' },
    mars: { name: 'Marte', info: 'wiki' },
    phobos: { name: 'Fobos', info: 'wiki' },
    deimos: { name: 'Deimos', info: 'wiki' },
    jupiter: { name: 'Júpiter', info: 'wiki' },
    io: { name: 'Ío', info: 'wiki' },
    europa: { name: 'Europa', info: 'wiki' },
    ganymede: { name: 'Ganimedes', info: 'wiki' },
    callisto: { name: 'Calisto', info: 'wiki' },
    saturn: { name: 'Saturno', info: 'wiki' },
    titan: { name: 'Titán', info: 'wiki' },
    rhea: { name: 'Rea', info: 'wiki' },
    iapetus: { name: 'Jápeto', info: 'wiki' },
    uranus: { name: 'Urano', info: 'wiki' },
    titania: { name: 'Titania', info: 'wiki' },
    oberon: { name: 'Oberón', info: 'wiki' },
    neptune: { name: 'Neptuno', info: 'wiki' },
    triton: { name: 'Tritón', info: 'wiki' }
};

// ==================== ESTADO ====================
let state = {
    currentPlanet: 'earth',
    targetPlanet: null,
    traveling: false,
    travelStartTime: null,
    travelDuration: 0,
    travelOrigin: null
};

// ==================== THREE.JS SETUP ====================
let scene, camera, renderer;
let planets = {};
let spaceship = null;
let touchStartPos = null;
let lastTouchPos = null;
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

    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);

    createStarfield();
    createSpaceship();
    createSolarSystem();

    window.addEventListener('resize', onWindowResize);

    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('click', onMouseClick);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 50000;
        positions[i + 1] = (Math.random() - 0.5) * 50000;
        positions[i + 2] = (Math.random() - 0.5) * 50000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createSpaceship() {
    const shipGroup = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.5, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    shipGroup.add(body);

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

    const leftLight = new THREE.PointLight(0x00ffff, 2, 20);
    leftLight.position.set(-4.5, 0, -2);
    shipGroup.add(leftLight);

    const rightLight = new THREE.PointLight(0x00ffff, 2, 20);
    rightLight.position.set(-4.5, 0, 2);
    shipGroup.add(rightLight);

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

    shipGroup.scale.set(0.08, 0.08, 0.08);
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

    const sunLight = new THREE.PointLight(0xffffee, 2, 50000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Crear planetas y lunas
    Object.keys(SOLAR_SYSTEM).forEach(key => {
        if (key === 'sun') return;
        
        const body = SOLAR_SYSTEM[key];
        
        if (body.parent) {
            // Es una luna
            createMoon(key, body);
        } else {
            // Es un planeta
            createPlanet(key, body);
        }
    });

    // Cinturón de asteroides entre Marte y Júpiter
    createAsteroidBelt();
    
    // Anillos de Saturno
    createSaturnRings();
}

function createPlanet(name, data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`/constelacion/${data.texture}`);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { name, type: 'planet' };
    scene.add(mesh);

    planets[name] = {
        mesh,
        orbit: data.distance,
        angle: Math.random() * Math.PI * 2,
        speed: (data.speed || 0.1) * 0.001,
        rotationSpeed: 0.01
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
        speed: (data.speed || 0.5) * 0.001,
        parent: planets[data.parent],
        tidalLock: true
    };
}

function createAsteroidBelt() {
    for (let i = 0; i < 200; i++) {
        const size = Math.random() * 0.8 + 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const asteroid = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = 3500 + Math.random() * 800;
        asteroid.position.x = Math.cos(angle) * radius;
        asteroid.position.z = Math.sin(angle) * radius;
        asteroid.position.y = (Math.random() - 0.5) * 50;

        asteroid.userData = { name: 'asteroid', type: 'asteroid' };
        scene.add(asteroid);
    }
}

function createSaturnRings() {
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

function updatePlanets() {
    Object.keys(planets).forEach(key => {
        const planet = planets[key];

        if (planet.parent) {
            // Luna orbitando su planeta
            const parentPos = planet.parent.mesh.position;
            planet.angle += planet.speed;

            planet.mesh.position.x = parentPos.x + Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = parentPos.z + Math.sin(planet.angle) * planet.orbit;
            planet.mesh.position.y = parentPos.y;

            if (planet.tidalLock) {
                planet.mesh.lookAt(parentPos);
            }
        } else if (planet.orbit > 0) {
            // Planeta orbitando el sol
            planet.angle += planet.speed;

            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbit;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbit;

            if (planet.rotationSpeed) {
                planet.mesh.rotation.y += planet.rotationSpeed;
            }
            
            // Actualizar anillos de Saturno
            if (key === 'saturn' && planet.rings) {
                planet.rings.position.copy(planet.mesh.position);
            }
        }
    });

    updateSpaceship();
    updateCamera();
}

function updateSpaceship() {
    if (!spaceship) return;

    if (state.traveling && state.travelStartTime && state.travelDuration) {
        const now = Date.now();
        const elapsed = now - state.travelStartTime;
        const t = Math.min(1, elapsed / state.travelDuration);

        const origin = state.travelOrigin;
        const target = planets[state.targetPlanet].mesh;

        const destVec = new THREE.Vector3(target.position.x, target.position.y + 5, target.position.z);
        spaceship.position.lerpVectors(origin, destVec, easeInOut(t));

        const dir = new THREE.Vector3().subVectors(destVec, spaceship.position).normalize();
        const angle = Math.atan2(dir.z, dir.x);
        spaceship.rotation.y = angle - Math.PI / 2;
        spaceship.rotation.z = Math.sin(t * Math.PI * 4) * 0.05;

        if (t >= 1) {
            state.traveling = false;
            state.travelStartTime = null;
            state.travelDuration = 0;
            state.travelOrigin = null;
            state.currentPlanet = state.targetPlanet;
            state.targetPlanet = null;
            updateUI();
        }
    } else {
        const currentPlanetData = planets[state.currentPlanet];
        if (currentPlanetData) {
            const t = Date.now() * 0.00005;
            const radius = 20 + currentPlanetData.mesh.geometry.parameters.radius;
            spaceship.position.x = currentPlanetData.mesh.position.x + Math.cos(t) * radius;
            spaceship.position.z = currentPlanetData.mesh.position.z + Math.sin(t) * radius;
            spaceship.position.y = currentPlanetData.mesh.position.y + 3;

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

    if (!state.traveling) {
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
            travelToPlanet(obj.userData.name);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    const originVec = spaceship.position.clone();
    const targetPlanet = planets[planetName];
    const dist = originVec.distanceTo(new THREE.Vector3(
        targetPlanet.mesh.position.x,
        targetPlanet.mesh.position.y,
        targetPlanet.mesh.position.z
    ));
    
    let durationMs = dist * 10;
    durationMs = Math.max(durationMs, 3000);
    durationMs = Math.min(durationMs, 30000);

    state.traveling = true;
    state.travelOrigin = originVec;
    state.targetPlanet = planetName;
    state.travelStartTime = Date.now();
    state.travelDuration = durationMs;

    updateUI();
}

function showInfo(bodyName) {
    const info = PLANET_INFO[bodyName];
    if (!info) return;

    const modal = document.getElementById('infoModal');
    document.getElementById('infoTitle').textContent = info.name;
    document.getElementById('infoContent').innerHTML = `<p>${info.info}</p>`;
    modal.classList.add('show');
}

function closeInfo() {
    document.getElementById('infoModal').classList.remove('show');
}

// ==================== UI ====================
function updateUI() {
    const currentLoc = document.getElementById('currentLocation');
    const travelStatus = document.getElementById('travelStatus');

    currentLoc.textContent = PLANET_INFO[state.currentPlanet]?.name || state.currentPlanet;

    if (state.traveling) {
        const remaining = Math.max(0, state.travelDuration - (Date.now() - state.travelStartTime));
        travelStatus.textContent = `Viajando a ${PLANET_INFO[state.targetPlanet]?.name} (${Math.ceil(remaining / 1000)}s)`;
    } else {
        travelStatus.textContent = 'En órbita';
    }

    renderPlanetList();
}

function renderPlanetList() {
    const planetList = document.getElementById('planetList');
    planetList.innerHTML = '';

    // Planetas principales
    const mainPlanets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    mainPlanets.forEach(planetKey => {
        const planetData = SOLAR_SYSTEM[planetKey];
        const planetInfo = PLANET_INFO[planetKey];

        const groupDiv = document.createElement('div');
        groupDiv.className = 'planet-group';

        const isCurrent = state.currentPlanet === planetKey;

        const planetBtn = document.createElement('button');
        planetBtn.className = 'planet-button' + (isCurrent ? ' current' : '');
        planetBtn.innerHTML = `🪐 ${planetInfo.name}`;
        planetBtn.onclick = () => travelToPlanet(planetKey);

        const infoBtn = document.createElement('button');
        infoBtn.className = 'info-button';
        infoBtn.textContent = '?';
        infoBtn.onclick = (e) => {
            e.stopPropagation();
            showInfo(planetKey);
        };

        groupDiv.appendChild(planetBtn);
        groupDiv.appendChild(infoBtn);

        // Lunas
        if (planetData.moons && planetData.moons.length > 0) {
            const moonDiv = document.createElement('div');
            moonDiv.className = 'moon-buttons';

            planetData.moons.forEach(moonKey => {
                const moonInfo = PLANET_INFO[moonKey];
                const moonBtn = document.createElement('button');
                moonBtn.className = 'moon-button planet-button';
                if (state.currentPlanet === moonKey) {
                    moonBtn.classList.add('current');
                }
                moonBtn.innerHTML = `🌙 ${moonInfo.name}`;
                moonBtn.onclick = () => travelToPlanet(moonKey);

                const moonInfoBtn = document.createElement('button');
                moonInfoBtn.className = 'info-button';
                moonInfoBtn.textContent = '?';
                moonInfoBtn.onclick = (e) => {
                    e.stopPropagation();
                    showInfo(moonKey);
                };

                moonDiv.appendChild(moonBtn);
                moonDiv.appendChild(moonInfoBtn);
            });

            groupDiv.appendChild(moonDiv);
        }

        planetList.appendChild(groupDiv);
    });
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
    
    setInterval(updateUI, 100);
}

window.addEventListener('load', init);
