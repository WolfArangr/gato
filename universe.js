// Configuración de Three.js
let scene, camera, renderer, stars = [], planets = [], raycaster, mouse, isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let currentPlanetData = null;
let starLabels = [];

// Variables para touch/móvil
let touchStartDistance = 0;
let initialCameraDistance = 0;
let lastTouchTime = 0;
let touchStartPos = { x: 0, y: 0 };

// Inicializar la escena
function init() {
    // Crear escena
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    // Crear cámara
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    camera.position.z = 150;
    camera.position.y = 50;

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Raycaster para detección de clicks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Crear campo de estrellas de fondo
    createStarField();

    // Cargar datos y crear sistema
    loadData();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Desktop
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Móvil/touch
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });

    // Panel de planeta
    document.getElementById('close-btn').addEventListener('click', closePlanetPanel);
    document.getElementById('visit-btn').addEventListener('click', visitPlanet);

    // Iniciar animación
    animate();
}

// Crear campo de estrellas de fondo
function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 4000;
        const y = (Math.random() - 0.5) * 4000;
        const z = (Math.random() - 0.5) * 4000;
        vertices.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

// Cargar datos del JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        createUniverse(data);
        document.getElementById('loading').classList.add('hidden');
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('loading').innerHTML = '<p>Error cargando datos. Verifica que data.json existe.</p>';
    }
}

// Crear el universo con estrellas y planetas
function createUniverse(data) {
    const categories = data.categories;
    const angleStep = (Math.PI * 2) / categories.length;
    const radius = 100;

    categories.forEach((category, index) => {
        const angle = angleStep * index;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 30;

        // Crear estrella (categoría)
        const starGroup = createStar(category, x, y, z);
        scene.add(starGroup);
        stars.push(starGroup);

        // Crear label de estrella
        createStarLabel(category.name, starGroup);

        // Crear planetas (enlaces)
        category.links.forEach((link, planetIndex) => {
            const planet = createPlanet(link, starGroup, planetIndex, category.links.length, category.name);
            planets.push(planet);
        });
    });
}

// Crear label para estrella
function createStarLabel(name, starGroup) {
    const label = document.createElement('div');
    label.className = 'star-label';
    label.textContent = name;
    document.body.appendChild(label);
    
    starLabels.push({
        element: label,
        star: starGroup
    });
}

// Actualizar posición de labels
function updateStarLabels() {
    starLabels.forEach(({ element, star }) => {
        const vector = star.position.clone();
        vector.project(camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        // Ocultar si está detrás de la cámara
        if (vector.z > 1) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
            element.style.left = x + 'px';
            element.style.top = (y - 30) + 'px';
        }
    });
}

// Crear estrella (categoría)
function createStar(category, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Esfera brillante
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: category.color || 0xffd700,
        transparent: true,
        opacity: 0.9
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Resplandor
    const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: category.color || 0xffd700,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Añadir datos
    group.userData = {
        type: 'star',
        name: category.name,
        color: category.color
    };

    return group;
}

// Crear planeta (enlace)
function createPlanet(link, star, index, total, categoryName) {
    const group = new THREE.Group();
    
    // Órbita del planeta
    const orbitRadius = 15 + (index * 8);
    const angleOffset = (Math.PI * 2 * index) / total;
    
    // Crear planeta
    const geometry = new THREE.SphereGeometry(2, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: link.color || 0x4fc3f7,
        transparent: true,
        opacity: 0.8
    });
    const planet = new THREE.Mesh(geometry, material);
    
    // Órbita visual
    const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.2, orbitRadius + 0.2, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    star.add(orbit);

    // Añadir datos
    planet.userData = {
        type: 'planet',
        name: link.name,
        url: link.url,
        category: categoryName,
        star: star,
        orbitRadius: orbitRadius,
        angleOffset: angleOffset,
        speed: 0.001 + Math.random() * 0.002
    };

    star.add(planet);
    
    return planet;
}

// Mostrar panel de planeta
function showPlanetPanel(planetData) {
    currentPlanetData = planetData;
    document.getElementById('planet-name').textContent = planetData.name;
    document.getElementById('planet-category').textContent = `Categoría: ${planetData.category}`;
    document.getElementById('planet-panel').classList.add('show');
}

// Cerrar panel de planeta
function closePlanetPanel() {
    document.getElementById('planet-panel').classList.remove('show');
    currentPlanetData = null;
}

// Visitar planeta
function visitPlanet() {
    if (currentPlanetData && currentPlanetData.url) {
        window.open(currentPlanetData.url, '_blank');
        closePlanetPanel();
    }
}

// Animación
function animate() {
    requestAnimationFrame(animate);

    // Animar planetas en órbita
    planets.forEach(planet => {
        planet.userData.angleOffset += planet.userData.speed;
        const x = Math.cos(planet.userData.angleOffset) * planet.userData.orbitRadius;
        const z = Math.sin(planet.userData.angleOffset) * planet.userData.orbitRadius;
        planet.position.x = x;
        planet.position.z = z;
    });

    // Animar estrellas (pulsación)
    stars.forEach(star => {
        const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
        star.children[1].scale.set(scale, scale, scale);
    });

    // Actualizar labels de estrellas
    updateStarLabels();

    // Aplicar rotación de cámara
    if (!isDragging) {
        camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
}

// Eventos del ratón (desktop)
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseMove(event) {
    // Actualizar posición del mouse para raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Mostrar tooltip solo en desktop
    if (!('ontouchstart' in window)) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        const tooltip = document.getElementById('tooltip');
        let found = false;

        for (let intersect of intersects) {
            if (intersect.object.userData.type === 'planet' || intersect.object.userData.type === 'star') {
                tooltip.innerHTML = intersect.object.userData.type === 'star' 
                    ? `<span class="tooltip-star">⭐ ${intersect.object.userData.name}</span>`
                    : `<span class="tooltip-planet">🌍 ${intersect.object.userData.name}</span>`;
                tooltip.style.left = event.clientX + 15 + 'px';
                tooltip.style.top = event.clientY + 15 + 'px';
                tooltip.classList.add('show');
                document.body.style.cursor = 'pointer';
                found = true;
                break;
            }
        }

        if (!found) {
            tooltip.classList.remove('show');
            document.body.style.cursor = 'default';
        }
    }

    // Rotar cámara al arrastrar
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        cameraRotation.y += deltaX * 0.005;
        cameraRotation.x += deltaY * 0.005;

        // Limitar rotación vertical
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        const distance = camera.position.length();
        camera.position.x = distance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = distance * Math.sin(cameraRotation.x);
        camera.position.z = distance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(scene.position);

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function onMouseUp() {
    isDragging = false;
}

function onClick(event) {
    if (Math.abs(event.clientX - previousMousePosition.x) > 5 || 
        Math.abs(event.clientY - previousMousePosition.y) > 5) {
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let intersect of intersects) {
        if (intersect.object.userData.type === 'planet') {
            showPlanetPanel(intersect.object.userData);
            break;
        }
    }
}

// Eventos táctiles (móvil)
function onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 1) {
        // Un dedo - preparar para rotar o tap
        isDragging = true;
        const touch = event.touches[0];
        previousMousePosition = {
            x: touch.clientX,
            y: touch.clientY
        };
        touchStartPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        lastTouchTime = Date.now();
    } else if (event.touches.length === 2) {
        // Dos dedos - zoom
        isDragging = false;
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        initialCameraDistance = camera.position.length();
    }
}

function onTouchMove(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 1 && isDragging) {
        // Un dedo - rotar
        const touch = event.touches[0];
        const deltaX = touch.clientX - previousMousePosition.x;
        const deltaY = touch.clientY - previousMousePosition.y;

        cameraRotation.y += deltaX * 0.008;
        cameraRotation.x += deltaY * 0.008;

        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        const distance = camera.position.length();
        camera.position.x = distance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = distance * Math.sin(cameraRotation.x);
        camera.position.z = distance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(scene.position);

        previousMousePosition = {
            x: touch.clientX,
            y: touch.clientY
        };
    } else if (event.touches.length === 2) {
        // Dos dedos - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (touchStartDistance > 0) {
            const scale = touchStartDistance / distance;
            const newDistance = Math.max(50, Math.min(300, initialCameraDistance * scale));
            camera.position.normalize().multiplyScalar(newDistance);
        }
    }
}

function onTouchEnd(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        const deltaTime = Date.now() - lastTouchTime;
        
        // Detectar tap (poco movimiento y rápido)
        if (deltaX < 15 && deltaY < 15 && deltaTime < 300) {
            mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            for (let intersect of intersects) {
                if (intersect.object.userData.type === 'planet') {
                    showPlanetPanel(intersect.object.userData);
                    break;
                }
            }
        }
    }
    
    isDragging = false;
    touchStartDistance = 0;
}

function onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY * 0.1;
    const distance = camera.position.length();
    const newDistance = Math.max(50, Math.min(300, distance + delta));
    camera.position.multiplyScalar(newDistance / distance);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Iniciar cuando se carga la página
window.addEventListener('load', init);
