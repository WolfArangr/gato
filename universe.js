// universe.js actualizado para usar basededatosconstelacion.json
let scene, camera, renderer, stars = [], planets = [], raycaster, mouse, isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let currentPlanetData = null;
let starLabels = [];
let targetCameraPos = null;
let cameraLerpSpeed = 0.05;
let gameMode = false;

// Variables para touch/móvil
let touchStartDistance = 0;
let initialCameraDistance = 0;
let lastTouchTime = 0;
let touchStartPos = { x: 0, y: 0 };

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 150, 300);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createStarField();
    loadData();

    // Eventos
    window.addEventListener('resize', onWindowResize);

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Móvil/táctil
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });

    // Botones del panel
    document.getElementById('close-btn').addEventListener('click', closePlanetPanel);

    // Botón modo juego
    const gameBtn = document.createElement('button');
    gameBtn.textContent = 'Modo Juego 🪐';
    gameBtn.style.position = 'absolute';
    gameBtn.style.bottom = '20px';
    gameBtn.style.right = '20px';
    gameBtn.style.zIndex = 100;
    gameBtn.style.padding = '10px 15px';
    gameBtn.style.borderRadius = '10px';
    gameBtn.style.border = 'none';
    gameBtn.style.background = 'linear-gradient(135deg,#ff9f43,#f368e0)';
    gameBtn.style.color = '#fff';
    gameBtn.style.cursor = 'pointer';
    gameBtn.addEventListener('click', () => {
        gameMode = !gameMode;
        gameBtn.textContent = gameMode ? 'Modo Juego ON' : 'Modo Juego 🪐';
    });
    document.body.appendChild(gameBtn);

    animate();
}

function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 8000;
        const y = (Math.random() - 0.5) * 8000;
        const z = (Math.random() - 0.5) * 8000;
        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0.8
    });

    const starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

async function loadData() {
    try {
        const response = await fetch('basededatosconstelacion.json');
        const data = await response.json();
        createUniverse(data);
        document.getElementById('loading').classList.add('hidden');
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('loading').innerHTML = '<p>Error cargando datos. Verifica basededatosconstelacion.json.</p>';
    }
}

function createUniverse(data) {
    // Crear estrella central
    const sunGroup = new THREE.Group();
    const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const sunCore = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunCore);

    // Llamas animadas como halo
    const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(25, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.3 })
    );
    sunGroup.add(sunHalo);

    sunGroup.userData = { type: 'star', name: 'Sol', url: 'http://www.gato.red/' };
    scene.add(sunGroup);
    stars.push(sunGroup);
    createStarLabel('Sol', sunGroup);

    // Planetas orbitando alrededor del sol (categorías)
    const categories = data.categories;
    const angleStep = (Math.PI * 2) / categories.length;
    const baseRadius = 100;

    categories.forEach((category, i) => {
        const angle = angleStep * i + Math.random() * 0.3;
        const dist = baseRadius + Math.random() * 50;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = (Math.random() - 0.5) * 30;

        const planet = createPlanet(category, x, y, z, sunGroup);
        planets.push(planet);

        // Lunas orbitando alrededor del planeta (links)
        category.links.forEach((link, idx) => {
            const moon = createMoon(link, planet, idx, category.links.length, category.color);
            planets.push(moon);
        });
    });
}

function createStarLabel(name, starGroup) {
    const label = document.createElement('div');
    label.className = 'star-label';
    label.textContent = name;
    document.body.appendChild(label);

    starLabels.push({ element: label, star: starGroup });
}

function updateStarLabels() {
    starLabels.forEach(({ element, star }) => {
        const vector = star.position.clone().project(camera);
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        if (vector.z > 1) element.style.display = 'none';
        else {
            element.style.display = 'block';
            element.style.left = x + 'px';
            element.style.top = (y - 30) + 'px';
        }
    });
}

function createPlanet(category, x, y, z, sun) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const geometry = new THREE.SphereGeometry(8 + Math.random() * 4, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.1
    });
    const planet = new THREE.Mesh(geometry, material);

    // Halo color según categoría
    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(geometry.parameters.radius * 1.2, 16, 16),
        new THREE.MeshBasicMaterial({
            color: category.color || 0xffffff,
            transparent: true,
            opacity: 0.3
        })
    );
    group.add(planet);
    group.add(halo);

    group.userData = {
        type: 'planet',
        name: category.name,
        star: sun,
        orbitRadius: group.position.distanceTo(sun.position),
        orbitTilt: (Math.random() - 0.5) * 0.3,
        angleOffset: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002
    };

    sun.add(group);
    return group;
}

function createMoon(link, planet, idx, total, categoryColor) {
    const group = new THREE.Group();
    const baseRadius = 10 + idx * 6;
    const angle = Math.random() * Math.PI * 2;

    const geometry = new THREE.SphereGeometry(2 + Math.random(), 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.7,
        metalness: 0.1
    });
    const moon = new THREE.Mesh(geometry, material);

    // Halo de color según categoría
    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(geometry.parameters.radius * 1.3, 8, 8),
        new THREE.MeshBasicMaterial({
            color: categoryColor || 0xffffff,
            transparent: true,
            opacity: 0.2
        })
    );

    group.add(moon);
    group.add(halo);

    group.userData = {
        type: 'moon',
        name: link.name,
        url: link.url,
        planet: planet,
        orbitRadius: baseRadius,
        orbitTilt: Math.random() * 0.5,
        angleOffset: angle,
        speed: 0.002 + Math.random() * 0.002
    };

    planet.add(group);
    return group;
}

// Interacción
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        cameraRotation.y += deltaMove.x * 0.005;
        cameraRotation.x += deltaMove.y * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp() {
    isDragging = false;
}

function onWheel(event) {
    event.preventDefault();
    camera.position.z += event.deltaY * 0.2;
    camera.position.z = Math.max(50, Math.min(2000, camera.position.z));
}

function onClick(event) {
    if (isDragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object.parent;
        showPlanetPanel(obj.userData);
    }
}

// Touch/móvil
function onTouchStart(event) {
    if (event.touches.length === 1) {
        isDragging = true;
        touchStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        previousMousePosition = { ...touchStartPos };
    } else if (event.touches.length === 2) {
        touchStartDistance = getTouchDistance(event.touches[0], event.touches[1]);
        initialCameraDistance = camera.position.z;
    }
}

function onTouchMove(event) {
    if (event.touches.length === 1 && isDragging) {
        const deltaMove = {
            x: event.touches[0].clientX - previousMousePosition.x,
            y: event.touches[0].clientY - previousMousePosition.y
        };

        cameraRotation.y += deltaMove.x * 0.005;
        cameraRotation.x += deltaMove.y * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else if (event.touches.length === 2) {
        const newDistance = getTouchDistance(event.touches[0], event.touches[1]);
        const delta = touchStartDistance - newDistance;
        camera.position.z = initialCameraDistance + delta * 1.5;
        camera.position.z = Math.max(50, Math.min(2000, camera.position.z));
    }
}

function onTouchEnd(event) {
    isDragging = false;
}

function getTouchDistance(t1, t2) {
    return Math.sqrt(
        (t1.clientX - t2.clientX) ** 2 +
        (t1.clientY - t2.clientY) ** 2
    );
}

function showPlanetPanel(data) {
    currentPlanetData = data;
    document.getElementById('planet-name').textContent = data.name;
    document.getElementById('planet-category').textContent = data.type === 'planet' ? 'Categoría' : 'Proyecto';

    const panel = document.getElementById('planet-panel');
    panel.classList.add('show');
}

function closePlanetPanel() {
    document.getElementById('planet-panel').classList.remove('show');
}

function animate() {
    requestAnimationFrame(animate);

    // Rotar cámara suavemente
    camera.position.x = Math.sin(cameraRotation.y) * 500;
    camera.position.y = cameraRotation.x * 500;
    camera.position.z = Math.cos(cameraRotation.y) * 500;
    camera.lookAt(0, 0, 0);

    // Actualizar órbitas
    planets.forEach(p => {
        if (p.userData.type === 'planet' || p.userData.type === 'moon') {
            const parent = p.userData.planet || p.userData.star;
            const angle = performance.now() * p.userData.speed + p.userData.angleOffset;
            const radius = p.userData.orbitRadius;
            const tilt = p.userData.orbitTilt || 0;
            p.position.x = Math.cos(angle) * radius;
            p.position.z = Math.sin(angle) * radius;
            p.position.y = Math.sin(angle * 0.5) * 10 + tilt;
        }
    });

    updateStarLabels();

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Inicializar
init();
