// Configuración de Three.js mejorada
let scene, camera, renderer, stars = [], planets = [], raycaster, mouse, isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let currentPlanetData = null;
let starLabels = [];
let targetCameraPos = null;
let cameraLerpSpeed = 0.05;

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
    document.getElementById('visit-btn').addEventListener('touchend', visitPlanet);
    document.getElementById('visit-btn').addEventListener('click', visitPlanet);

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
        const response = await fetch('basedatosconstelacion.json');
        const data = await response.json();
        createUniverse(data);
        document.getElementById('loading').classList.add('hidden');
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('loading').innerHTML = '<p>Error cargando datos. Verifica basedatosconstelacion.json.</p>';
    }
}

function createUniverse(data) {
    const categories = data.categories;
    const angleStep = (Math.PI * 2) / categories.length;
    const baseRadius = 200;

    categories.forEach((category, i) => {
        const angle = angleStep * i + Math.random() * 0.3;
        const dist = baseRadius + Math.random() * 100;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = (Math.random() - 0.5) * 100;

        const starGroup = createStar(category, x, y, z);
        scene.add(starGroup);
        stars.push(starGroup);
        createStarLabel(category.name, starGroup);

        category.links.forEach((link, idx) => {
            const planet = createPlanet(link, starGroup, idx, category.links.length, category.name);
            planets.push(planet);
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

function createStar(category, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(6, 32, 32),
        new THREE.MeshBasicMaterial({ color: category.color || 0xffd700 })
    );
    group.add(core);

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 32),
        new THREE.MeshBasicMaterial({ color: category.color || 0xffd700, transparent: true, opacity: 0.3 })
    );
    group.add(glow);

    group.userData = { type: 'star', name: category.name, color: category.color };
    return group;
}

function createPlanet(link, star, index, total, categoryName) {
    const group = new THREE.Group();
    const baseRadius = 15 + Math.random() * 10 + (index * 10);
    const orbitTilt = (Math.random() - 0.5) * 0.5;
    const orbitEccentricity = 1 + Math.random() * 0.3;
    const startAngle = Math.random() * Math.PI * 2;

    const geometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: link.color || 0x4fc3f7,
        transparent: true,
        opacity: 0.85
    });
    const planet = new THREE.Mesh(geometry, material);

    planet.userData = {
        type: 'planet',
        name: link.name,
        url: link.url,
        category: categoryName,
        star: star,
        orbitRadius: baseRadius,
        orbitTilt,
        orbitEccentricity,
        angleOffset: startAngle,
        speed: 0.001 + Math.random() * 0.002
    };

    star.add(planet);
    return planet;
}

function showPlanetPanel(planetData) {
    currentPlanetData = planetData;
    document.getElementById('planet-name').textContent = planetData.name;
    document.getElementById('planet-category').textContent = `Categoría: ${planetData.category}`;
    document.getElementById('planet-panel').classList.add('show');
}

function closePlanetPanel() {
    document.getElementById('planet-panel').classList.remove('show');
    currentPlanetData = null;
}

function visitPlanet() {
    if (currentPlanetData?.url) window.open(currentPlanetData.url, '_blank');
    closePlanetPanel();
}

function animate() {
    requestAnimationFrame(animate);

    // Movimiento planetario
    planets.forEach(p => {
        p.userData.angleOffset += p.userData.speed;
        const a = p.userData.angleOffset;
        const r = p.userData.orbitRadius * p.userData.orbitEccentricity;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * p.userData.orbitRadius;
        const tilt = p.userData.orbitTilt;
        p.position.set(x, Math.sin(a * 2) * tilt * 10, z);
    });

    // Pulsación de estrellas
    stars.forEach(s => {
        const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05;
        s.children[1].scale.set(scale, scale, scale);
    });

    // Interpolación de cámara si hay objetivo
    if (targetCameraPos) {
        camera.position.lerp(targetCameraPos.position, cameraLerpSpeed);
        camera.lookAt(targetCameraPos.lookAt);
        if (camera.position.distanceTo(targetCameraPos.position) < 1) targetCameraPos = null;
    }

    updateStarLabels();
    renderer.render(scene, camera);
}

// Eventos Desktop
function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
}
function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        cameraRotation.y += deltaX * 0.005;
        cameraRotation.x += deltaY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
        const dist = camera.position.length();
        camera.position.x = dist * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = dist * Math.sin(cameraRotation.x);
        camera.position.z = dist * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(scene.position);
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
}
function onMouseUp() { isDragging = false; }

function onClick(event) {
    if (Math.abs(event.clientX - previousMousePosition.x) > 5 ||
        Math.abs(event.clientY - previousMousePosition.y) > 5) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i of intersects) {
        const d = i.object.userData;
        if (d.type === 'planet') { showPlanetPanel(d); return; }
        if (d.type === 'star') { focusOnStar(i.object); return; }
    }
}

// Centrar cámara sobre una estrella
function focusOnStar(starObj) {
    const starPos = new THREE.Vector3();
    starObj.getWorldPosition(starPos);
    const maxOrbit = Math.max(...planets
        .filter(p => p.userData.star === starObj)
        .map(p => p.userData.orbitRadius), 50);

    const pos = new THREE.Vector3(starPos.x, starPos.y + maxOrbit * 1.5, starPos.z + maxOrbit * 2);
    targetCameraPos = { position: pos, lookAt: starPos };
}

// Zoom rueda
function onWheel(e) {
    e.preventDefault();
    const d = e.deltaY * 0.1;
    const dist = camera.position.length();
    const newDist = Math.max(50, Math.min(1000, dist + d));
    camera.position.multiplyScalar(newDist / dist);
}

// Táctil móvil (rotación, zoom, tap)
function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        isDragging = true;
        const t = e.touches[0];
        previousMousePosition = { x: t.clientX, y: t.clientY };
        touchStartPos = { x: t.clientX, y: t.clientY };
        lastTouchTime = Date.now();
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        initialCameraDistance = camera.position.length();
    }
}
function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        const t = e.touches[0];
        const dx = t.clientX - previousMousePosition.x;
        const dy = t.clientY - previousMousePosition.y;
        cameraRotation.y += dx * 0.008;
        cameraRotation.x += dy * 0.008;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
        const dist = camera.position.length();
        camera.position.x = dist * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = dist * Math.sin(cameraRotation.x);
        camera.position.z = dist * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(scene.position);
        previousMousePosition = { x: t.clientX, y: t.clientY };
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchStartDistance > 0) {
            const scale = touchStartDistance / dist;
            const newDist = Math.max(50, Math.min(1000, initialCameraDistance * scale));
            camera.position.normalize().multiplyScalar(newDist);
        }
    }
}
function onTouchEnd(e) {
    e.preventDefault();
    if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const dx = Math.abs(t.clientX - touchStartPos.x);
        const dy = Math.abs(t.clientY - touchStartPos.y);
        const dt = Date.now() - lastTouchTime;
        if (dx < 15 && dy < 15 && dt < 300) {
            mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const ints = raycaster.intersectObjects(scene.children, true);
            for (let i of ints) {
                const d = i.object.userData;
                if (d.type === 'planet') { showPlanetPanel(d); return; }
                if (d.type === 'star') { focusOnStar(i.object); return; }
            }
        }
    }
    isDragging = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('load', init);
