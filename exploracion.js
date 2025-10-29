// exploracion.js
// Simulación limpia: sistema solar proporcional + nave + viaje + cámara que sigue.
// Texturas: espera archivos en /constelacion/<name>.png (ej: sun.png, earth.png, moon.png, jupiter.png, ...)

// ---------- Configuración de escala (basada en datos reales, escalados para visual) ----------
const REAL = {
  // diámetros en km, semiejes mayores (aprox) en unidades astronómicas (AU)
  bodies: {
    sun:      { type: 'star', diameter: 1391000,  orbitAU: 0 },
    mercury:  { type: 'planet', diameter: 4879,    orbitAU: 0.387 },
    venus:    { type: 'planet', diameter: 12104,   orbitAU: 0.723 },
    earth:    { type: 'planet', diameter: 12742,   orbitAU: 1.000 },
    moon:     { type: 'moon',   diameter: 3475,    orbitAU: 0.00257, parent: 'earth' }, // approximate distance in AU
    mars:     { type: 'planet', diameter: 6779,    orbitAU: 1.524 },
    phobos:   { type: 'moon',   diameter: 22.2,    orbitAU: 0.000062, parent: 'mars' },
    deimos:   { type: 'moon',   diameter: 12.6,    orbitAU: 0.000156, parent: 'mars' },
    jupiter:  { type: 'planet', diameter: 139820,  orbitAU: 5.203 },
    io:       { type: 'moon',   diameter: 3643,    orbitAU: 0.00282, parent: 'jupiter' },
    europa:   { type: 'moon',   diameter: 3122,    orbitAU: 0.00448, parent: 'jupiter' },
    ganymede: { type: 'moon',   diameter: 5268,    orbitAU: 0.00715, parent: 'jupiter' },
    callisto: { type: 'moon',   diameter: 4821,    orbitAU: 0.0126,  parent: 'jupiter' },
    saturn:   { type: 'planet', diameter: 116460,  orbitAU: 9.537 },
    titan:    { type: 'moon',   diameter: 5150,    orbitAU: 0.00817, parent: 'saturn' },
    uranus:   { type: 'planet', diameter: 50724,   orbitAU: 19.191 },
    neptune:  { type: 'planet', diameter: 49244,   orbitAU: 30.07 },
    triton:   { type: 'moon',   diameter: 2706,    orbitAU: 0.00036, parent: 'neptune' },
    pluto:    { type: 'dwarf',  diameter: 2376,    orbitAU: 39.48 },
    charon:   { type: 'moon',   diameter: 1212,    orbitAU: 0.00016, parent: 'pluto' }
  }
};

// Escaladores: ajustar para que todo sea visible
const SCALE = {
  AU_TO_UNITS: 800,    // 1 AU = 800 unidades visuales (distancias)
  DIAMETER_TO_UNITS: 0.02, // 1 km = 0.02 unidades visuales (tamaño)
  MIN_VISIBLE_SIZE: 0.6,   // diámetro mínimo a mostrar
  ORBIT_LINE_OPACITY: 0.07
};

// ---------- Globals ----------
let scene, camera, renderer, clock;
let bodies = {}; // contenedor de objetos (mesh + meta)
let spaceship;
let traveling = false;
let travel = { origin: null, targetName: null, startTime: 0, duration: 0 };
let labels = []; // sprites for labels
const container = document.getElementById('container');
const canvas = document.getElementById('renderCanvas');

// ---------- Inicialización ----------
init();
animate();

function init(){
  // Scene & renderer
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200000);
  camera.position.set(0, 1200, 2000);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 2);
  sunLight.position.set(0,0,0);
  scene.add(sunLight);

  // Star field background
  createStarfield();

  // Crear cuerpos desde REAL
  createSolarSystemFromReal();

  // Create spaceship
  createSpaceship();

  // GUI list
  buildBodiesList();

  window.addEventListener('resize', onResize);
  canvas.addEventListener('click', onClick);
}

// ---------- Starfield ----------
function createStarfield(){
  const stars = new THREE.BufferGeometry();
  const count = 6000;
  const positions = new Float32Array(count * 3);
  for(let i=0;i<count;i++){
    positions[3*i] = (Math.random()-0.5)*20000;
    positions[3*i+1] = (Math.random()-0.5)*20000;
    positions[3*i+2] = (Math.random()-0.5)*20000;
  }
  stars.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 });
  const pts = new THREE.Points(stars, mat);
  scene.add(pts);
}

// ---------- Crear sistema solar ----------
function createSolarSystemFromReal(){
  // Primero: crear el sol
  createBody('sun', { texture: 'sun.png', isStatic: true });

  // Iterar y crear planetas y lunas
  for(const name in REAL.bodies){
    if(name === 'sun') continue;
    const meta = REAL.bodies[name];
    // textura por convención: <name>.png en /constelacion
    createBody(name, { texture: `${name}.png`, meta });
  }

  // Dibujar órbitas principales (líneas)
  drawOrbits();
}

function createBody(name, opts){
  // opts: texture (ruta relativa a /constelacion), meta (diameter, orbitAU,...)
  const meta = opts.meta || REAL.bodies[name] || {};
  const diameter = meta.diameter || 1000;
  const orbitAU = meta.orbitAU || 0;
  const parentName = meta.parent || null;

  // tamaño y posición escalada
  let radius = Math.max(SCALE.DIAMETER_TO_UNITS * diameter / 2, SCALE.MIN_VISIBLE_SIZE);
  // posición
  let x = 0, y = 0, z = 0;
  if(parentName){
    // posición inicial relativa al padre a una distancia = orbitAU * AU_TO_UNITS
    const parent = REAL.bodies[parentName];
    const dist = (orbitAU || 0.0005) * SCALE.AU_TO_UNITS;
    const angle = Math.random()*Math.PI*2;
    x = Math.cos(angle) * dist;
    z = Math.sin(angle) * dist;
  } else if(orbitAU){
    const dist = orbitAU * SCALE.AU_TO_UNITS;
    const angle = Math.random()*Math.PI*2;
    x = Math.cos(angle) * dist;
    z = Math.sin(angle) * dist;
  }

  // Geometry & material
  const geom = new THREE.SphereGeometry(radius, 32, 32);
  // try load texture; fallback to color material
  let material;
  try {
    const tex = new THREE.TextureLoader().load(`/constelacion/${opts.texture}`);
    material = new THREE.MeshStandardMaterial({ map: tex });
  } catch(e){
    material = new THREE.MeshStandardMaterial({ color: 0x8888ff });
  }
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(x,y,z);
  mesh.userData = { name, meta, parent: parentName || null };

  scene.add(mesh);

  bodies[name] = {
    mesh,
    radius,
    orbitAU,
    parent: parentName,
    angle: Math.random()*Math.PI*2,
    orbitRadiusUnits: (orbitAU || 0) * SCALE.AU_TO_UNITS,
    rotationSpeed: (Math.random()*0.6 + 0.2) * 0.01
  };

  // label
  createLabelForBody(name);
}

function drawOrbits(){
  // Dibujar órbitas de planetas (no para lunas)
  for(const name in bodies){
    const b = bodies[name];
    if(b.parent) continue; // sólo planetas/directo al sol
    const r = b.orbitRadiusUnits;
    if(!r || r <= 1) continue;

    const curve = new THREE.RingGeometry(r-0.5, r+0.5, 256);
    const mat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent:true, opacity: SCALE.ORBIT_LINE_OPACITY, side: THREE.DoubleSide});
    const ring = new THREE.Mesh(curve, mat);
    ring.rotation.x = Math.PI/2;
    ring.position.set(0,0,0);
    scene.add(ring);
  }

  // Dibujar órbitas de lunas alrededor de su padre
  for(const name in bodies){
    const b = bodies[name];
    if(!b.parent) continue;
    const p = bodies[b.parent];
    if(!p) continue;
    const r = b.orbitRadiusUnits || new THREE.Vector3().subVectors(b.mesh.position, p.mesh.position).length();
    const curve = new THREE.RingGeometry(r-0.25, r+0.25, 128);
    const mat = new THREE.MeshBasicMaterial({color: 0x9999ff, transparent:true, opacity: SCALE.ORBIT_LINE_OPACITY/1.5, side: THREE.DoubleSide});
    const ring = new THREE.Mesh(curve, mat);
    ring.rotation.x = Math.PI/2;
    ring.position.copy(p.mesh.position);
    scene.add(ring);
  }
}

// ---------- Labels (sprites) ----------
function createLabelForBody(name){
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '28px Arial';
  ctx.fillStyle = 'rgba(230,248,255,1)';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), canvas.width/2, 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, sizeAttenuation: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(120,30,1);
  sprite.userData = { name };
  scene.add(sprite);
  labels.push(sprite);
}

// ---------- Crear nave ----------
function createSpaceship(){
  const shipGroup = new THREE.Group();

  // cuerpo simple
  const bodyGeom = new THREE.ConeGeometry(20, 60, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xddeeff, metalness:0.6, roughness:0.3 });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.rotation.x = Math.PI/2;
  shipGroup.add(body);

  // cabina
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(12,16,16), new THREE.MeshStandardMaterial({ color:0x88cfff, transparent:true, opacity:0.8 }));
  cockpit.position.set(15,0,0);
  shipGroup.add(cockpit);

  shipGroup.scale.set(0.9,0.9,0.9);

  // posición inicial: en órbita de la Tierra si existe
  const earth = bodies['earth'] && bodies['earth'].mesh;
  if(earth){
    shipGroup.position.copy(earth.position).add(new THREE.Vector3(earth.geometry.parameters.radius + 60, 20, 0));
  } else {
    shipGroup.position.set( (bodies['earth'] ? bodies['earth'].mesh.position.x : 0)+200, 20, 0);
  }

  scene.add(shipGroup);
  spaceship = shipGroup;
}

// ---------- Animación / actualización ----------
function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Rotación y órbitas
  for(const name in bodies){
    const b = bodies[name];
    // rotation
    b.mesh.rotation.y += (b.rotationSpeed || 0.002) * dt * 30;

    // if it's a moon: orbit parent
    if(b.parent){
      const parentMesh = bodies[b.parent].mesh;
      b.angle += 0.8 * dt * 0.5; // lunar speed (visual)
      const r = b.orbitRadiusUnits || new THREE.Vector3().subVectors(b.mesh.position, parentMesh.position).length();
      b.mesh.position.x = parentMesh.position.x + Math.cos(b.angle) * r;
      b.mesh.position.z = parentMesh.position.z + Math.sin(b.angle) * r;
      b.mesh.position.y = parentMesh.position.y + 0;
    } else {
      // planet orbit around sun (slow)
      b.angle += 0.02 * dt * (1 / Math.max(1, (b.orbitRadiusUnits||1)/100));
      const r = b.orbitRadiusUnits || 0;
      b.mesh.position.x = Math.cos(b.angle) * r;
      b.mesh.position.z = Math.sin(b.angle) * r;
    }
  }

  // labels follow their bodies
  labels.forEach(spr => {
    const name = spr.userData.name;
    const b = bodies[name];
    if(!b) return;
    const pos = b.mesh.position.clone().add(new THREE.Vector3(0, b.radius + 20, 0));
    spr.position.copy(pos);
    // scale label with distance to camera (keep readable)
    const dist = camera.position.distanceTo(spr.position);
    const scale = Math.max(50, 8000 / Math.max(dist,1));
    spr.scale.set(scale, scale*0.25, 1);
  });

  // spaceship behavior: orbit current target or travel
  if(traveling){
    // traveling => lerp along from origin to target pos
    const now = performance.now();
    const t = Math.min(1, (now - travel.startTime) / travel.duration);
    const ease = easeInOut(t);
    const origin = travel.origin;
    const targetMesh = bodies[travel.targetName].mesh;
    const dest = targetMesh.position.clone().add(new THREE.Vector3( bodies[travel.targetName].radius + 30, 0, 0 ));
    const pos = origin.clone().lerp(dest, ease);
    spaceship.position.copy(pos);

    // orient ship toward movement direction
    const dir = dest.clone().sub(spaceship.position).normalize();
    const yaw = Math.atan2(dir.z, dir.x);
    spaceship.rotation.y = -yaw;
    // camera follow smoothly
    smoothCameraFollow(spaceship.position);

    if(t >= 1){
      traveling = false;
      travel = { origin: null, targetName: null, startTime: 0, duration: 0 };
    }
  } else {
    // if not traveling: keep spaceship orbiting selected body or small motion
    // find selected (if any)
    const sel = currentSelected;
    let center = null;
    if(sel && bodies[sel]) center = bodies[sel].mesh.position;
    else if(bodies['earth']) center = bodies['earth'].mesh.position;
    if(center){
      const t = performance.now() * 0.0002;
      const radius = 120 +  (bodies[currentSelected]? bodies[currentSelected].radius : 20);
      spaceship.position.x = center.x + Math.cos(t) * radius;
      spaceship.position.z = center.z + Math.sin(t) * radius;
      spaceship.position.y = center.y + 12;
      spaceship.rotation.y += 0.002;
      smoothCameraFollow(spaceship.position);
    }
  }

  renderer.render(scene, camera);
}

// ---------- Camera smooth follow ----------
function smoothCameraFollow(targetPos){
  // desired camera offset (behind and above)
  const offset = new THREE.Vector3( -300, 180, -420 );
  const desired = targetPos.clone().add(offset);
  // lerp camera position
  camera.position.lerp(desired, 0.06);
  // look at slightly ahead point
  camera.lookAt(targetPos);
}

// ---------- Utilidades ----------
function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function easeInOut(x){
  return x<0.5 ? 2*x*x : 1 - Math.pow(-2*x+2,2)/2;
}

// ---------- Interacción: lista de cuerpos y selección ----------
const bodiesListEl = document.getElementById('bodiesList');
let currentSelected = 'earth'; // default
function buildBodiesList(){
  // Agrupar planetas mayormente (padre -> hijos)
  // construir estructura: parent -> [children]
  const tree = {};
  for(const name in bodies){
    const parent = bodies[name].parent || 'sun';
    if(!tree[parent]) tree[parent] = [];
    tree[parent].push(name);
  }

  // List bodies orbiting sun first by distance
  const planets = (tree['sun'] || []).slice().sort((a,b)=> (bodies[a].orbitRadiusUnits||0) - (bodies[b].orbitRadiusUnits||0)).reverse();

  // Clear
  bodiesListEl.innerHTML = '';

  // Add sun
  const sunItem = createBodyListRow('sun', true);
  bodiesListEl.appendChild(sunItem);

  // For each planet, create row + expandable satellites
  planets.forEach(p => {
    const row = createBodyListRow(p);
    bodiesListEl.appendChild(row);

    // satellites
    const sats = (tree[p] || []);
    if(sats.length){
      const sub = document.createElement('div');
      sub.style.paddingLeft = '12px';
      sub.style.marginBottom = '6px';
      sats.forEach(s => {
        const srow = createBodyListRow(s, false, true);
        sub.appendChild(srow);
      });
      bodiesListEl.appendChild(sub);
    }
  });
}

function createBodyListRow(name, compact=false, isMoon=false){
  const wrap = document.createElement('div');
  wrap.className = 'body-item';

  const left = document.createElement('div'); left.className='body-left';
  const dot = document.createElement('div'); dot.className='body-dot';
  dot.style.width = compact ? '22px' : '18px';
  dot.style.height = compact ? '22px' : '18px';
  left.appendChild(dot);
  const title = document.createElement('div'); title.className='body-name';
  title.textContent = name.toUpperCase();
  left.appendChild(title);

  const right = document.createElement('div'); right.className='body-actions';

  const wiki = document.createElement('div'); wiki.className='wiki'; wiki.textContent = ' ? '; wiki.title = 'Información (wiki)';
  wiki.onclick = (e)=>{
    e.stopPropagation();
    // show placeholder
    document.getElementById('infoText').innerHTML = `<strong>${name.toUpperCase()}</strong><div style="margin-top:6px;color:#9fe">wiki</div>`;
  };

  const btnGo = document.createElement('button'); btnGo.className='btn btn-primary'; btnGo.textContent='IR';
  btnGo.onclick = (e)=>{
    e.stopPropagation();
    startTravelTo(name);
  };

  const btnSelect = document.createElement('button'); btnSelect.className='btn'; btnSelect.textContent='VER';
  btnSelect.onclick = (e)=>{
    e.stopPropagation();
    currentSelected = name;
    // center camera smoothly
    const center = bodies[name].mesh.position.clone();
    camera.position.lerp(center.clone().add(new THREE.Vector3(-800,400,800)), 0.2);
    camera.lookAt(center);
  };

  right.appendChild(wiki);
  right.appendChild(btnSelect);
  right.appendChild(btnGo);

  wrap.appendChild(left);
  wrap.appendChild(right);

  // clicking the row selects
  wrap.onclick = ()=>{
    currentSelected = name;
    document.getElementById('infoText').innerHTML = `<strong>${name.toUpperCase()}</strong><div style="margin-top:6px;color:#9fe">wiki</div>`;
  };

  return wrap;
}

// ---------- Travel logic ----------
function startTravelTo(targetName){
  if(!bodies[targetName]) return;
  if(traveling) {
    // already traveling: ignore or could queue; we keep simple
    return;
  }
  // origin is current ship position
  const origin = spaceship.position.clone();
  const targetMesh = bodies[targetName].mesh;
  const dist = origin.distanceTo(targetMesh.position);
  // duration proportional to distance (clamped)
  const duration = Math.max(2000, dist * 2.8); // ms

  traveling = true;
  travel = { origin, targetName, startTime: performance.now(), duration };
}

// ---------- Click in canvas: select nearest body if clicked ----------
function onClick(evt){
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
  const mouse = new THREE.Vector2(mx,my);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(mouse, camera);

  const meshes = Object.values(bodies).map(b=>b.mesh);
  const intersects = ray.intersectObjects(meshes);
  if(intersects.length){
    const mesh = intersects[0].object;
    const name = mesh.userData && mesh.userData.name ? mesh.userData.name : getBodyNameFromMesh(mesh);
    if(name){
      currentSelected = name;
      document.getElementById('infoText').innerHTML = `<strong>${name.toUpperCase()}</strong><div style="margin-top:6px;color:#9fe">wiki</div>`;
    }
  }
}

function getBodyNameFromMesh(mesh){
  for(const n in bodies) if(bodies[n].mesh === mesh) return n;
  return null;
}
