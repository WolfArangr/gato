// exploracion.js - versión segura y móvil

let scene, camera, renderer, controls, clock;
let bodies = {};
let spaceship;
let travel = null;
let traveling = false;

const SCALE = {
  AU: 300,         // distancia
  SIZE: 0.02,      // tamaño
  MIN: 1
};

// ---- Datos básicos ----
const DATA = [
  { name: "sun", diameter: 1391000, orbit: 0 },
  { name: "mercury", diameter: 4879, orbit: 0.39 },
  { name: "venus", diameter: 12104, orbit: 0.72 },
  { name: "earth", diameter: 12742, orbit: 1.00 },
  { name: "moon", diameter: 3475, orbit: 0.0026, parent: "earth" },
  { name: "mars", diameter: 6779, orbit: 1.52 },
  { name: "jupiter", diameter: 139820, orbit: 5.20 },
  { name: "saturn", diameter: 116460, orbit: 9.58 },
  { name: "uranus", diameter: 50724, orbit: 19.19 },
  { name: "neptune", diameter: 49244, orbit: 30.07 },
  { name: "pluto", diameter: 2376, orbit: 39.48 }
];

init();
animate();

function init() {
  const canvas = document.getElementById("renderCanvas");
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);

  clock = new THREE.Clock();

  const light = new THREE.PointLight(0xffffff, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // Fondo de estrellas
  const starGeo = new THREE.BufferGeometry();
  const starCount = 3000;
  const pos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) pos[i] = (Math.random() - 0.5) * 20000;
  starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  scene.add(new THREE.Points(starGeo, starMat));

  // Crear cuerpos
  DATA.forEach(d => createBody(d));

  // Nave
  spaceship = new THREE.Mesh(
    new THREE.ConeGeometry(8, 25, 12),
    new THREE.MeshStandardMaterial({ color: 0x99ccff, metalness: 0.7, roughness: 0.3 })
  );
  scene.add(spaceship);
  if (bodies["earth"]) {
    spaceship.position.copy(bodies["earth"].mesh.position).add(new THREE.Vector3(60, 0, 0));
  }

  // Cámara y controles
  camera.position.set(0, 300, 800);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener("resize", onResize);
  buildPanel();
}

function createBody({ name, diameter, orbit, parent }) {
  const size = Math.max(SCALE.SIZE * diameter / 2, SCALE.MIN);
  const tex = new THREE.TextureLoader().load(
    `./constelacion/${name}.png`,
    undefined,
    undefined,
    () => {} // ignora errores
  );
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), mat);
  scene.add(mesh);

  const dist = orbit * SCALE.AU;
  const angle = Math.random() * Math.PI * 2;
  if (parent && bodies[parent]) {
    const p = bodies[parent].mesh.position;
    mesh.position.set(p.x + Math.cos(angle) * dist, 0, p.z + Math.sin(angle) * dist);
  } else {
    mesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  }

  bodies[name] = { mesh, orbit, parent, angle, dist };
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  Object.values(bodies).forEach(b => {
    b.angle += 0.05 * dt / Math.max(0.3, b.orbit);
    if (b.parent && bodies[b.parent]) {
      const p = bodies[b.parent].mesh.position;
      b.mesh.position.set(p.x + Math.cos(b.angle) * b.dist, 0, p.z + Math.sin(b.angle) * b.dist);
    } else {
      b.mesh.position.set(Math.cos(b.angle) * b.dist, 0, Math.sin(b.angle) * b.dist);
    }
    b.mesh.rotation.y += 0.5 * dt;
  });

  // mover nave
  if (traveling && travel) {
    const elapsed = performance.now() - travel.start;
    const t = Math.min(1, elapsed / travel.duration);
    spaceship.position.lerpVectors(travel.startPos, travel.endPos, ease(t));
    if (t >= 1) traveling = false;
  }

  controls.update();
  renderer.render(scene, camera);
}

function buildPanel() {
  const panel = document.getElementById("panel");
  DATA.forEach(d => {
    const div = document.createElement("div");
    div.className = "body-btn";
    div.innerHTML = `<strong>${d.name}</strong><span>wiki</span>`;
    div.onclick = () => {
      document.getElementById("infoBox").innerText = `${d.name.toUpperCase()} — wiki`;
      startTravel(d.name);
    };
    panel.appendChild(div);
  });
}

function startTravel(name) {
  const b = bodies[name];
  if (!b) return;
  travel = {
    startPos: spaceship.position.clone(),
    endPos: b.mesh.position.clone().add(new THREE.Vector3(40, 0, 0)),
    start: performance.now(),
    duration: 4000
  };
  traveling = true;
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
