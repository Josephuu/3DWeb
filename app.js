const densityMap = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
};

const contactLabels = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
};

const defaultFilaments = [
  { name: 'Blanco Mate', hex: '#f4f4f4', stock: 4 },
  { name: 'Negro Profundo', hex: '#101418', stock: 2 },
  { name: 'Rojo Maker', hex: '#d7263d', stock: 1 },
  { name: 'Azul Cobalto', hex: '#2364aa', stock: 3 },
  { name: 'Verde Pasto', hex: '#2ecc71', stock: 0 },
];

const storageKey = 'tuhub3d-filaments';
const filamentData = loadFilamentStock();
const stlInput = document.getElementById('stlInput');
const previewContainer = document.getElementById('previewContainer');
const summaryList = document.getElementById('summaryList');
const materialSelect = document.getElementById('materialSelect');
const infillInput = document.getElementById('infillInput');
const pricePerKg = document.getElementById('pricePerKg');
const printTime = document.getElementById('printTime');
const hourlyRate = document.getElementById('hourlyRate');
const addColorSegmentBtn = document.getElementById('addColorSegment');
const colorSegments = document.getElementById('colorSegments');
const noStockMessage = document.getElementById('noStockMessage');
const toggleAdminBtn = document.getElementById('toggleAdmin');
const adminPanel = document.getElementById('adminPanel');
const filamentList = document.getElementById('filamentList');
const addFilamentForm = document.getElementById('addFilamentForm');
const requestForm = document.getElementById('requestForm');
const requestFeedback = document.getElementById('requestFeedback');

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('previewCanvas'),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(0, 150, 300);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(200, 300, 100);
scene.add(dirLight);

let currentMesh = null;
let currentGeometry = null;
let animationFrame = null;
let currentFileName = '';

function loadFilamentStock() {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('No se pudo leer el stock almacenado, se usará el predeterminado.', error);
    }
  }
  return defaultFilaments.map((filament) => ({ ...filament }));
}

function saveFilamentStock() {
  localStorage.setItem(storageKey, JSON.stringify(filamentData));
}

function renderFilamentList() {
  filamentList.innerHTML = '';
  if (filamentData.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Todavía no registraste colores disponibles.';
    filamentList.appendChild(empty);
    refreshColorSegments();
    return;
  }
  filamentData.forEach((filament, index) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <span class="swatch" style="background:${filament.hex}"></span>
      <strong>${filament.name}</strong>
      <span class="badge ${filament.stock > 0 ? 'available' : 'out'}">
        ${filament.stock > 0 ? `${filament.stock} en stock` : 'Sin stock'}
      </span>
      <button data-index="${index}" class="btn-link remove-filament">Eliminar</button>
    `;
    filamentList.appendChild(item);
  });
  filamentList.querySelectorAll('.remove-filament').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const index = Number(event.currentTarget.dataset.index);
      filamentData.splice(index, 1);
      saveFilamentStock();
      renderFilamentList();
      refreshColorSegments();
    });
  });
}

function refreshColorSegments() {
  const available = filamentData.filter((filament) => filament.stock > 0);
  addColorSegmentBtn.disabled = available.length === 0 || !currentGeometry;
  noStockMessage.classList.toggle('hidden', available.length !== 0);

  const selects = colorSegments.querySelectorAll('.segment-color');
  selects.forEach((select) => populateColorSelect(select));
}

function populateColorSelect(select) {
  const previousValue = select.value;
  select.innerHTML = '';
  filamentData.forEach((filament) => {
    const option = document.createElement('option');
    option.value = filament.name;
    option.textContent = `${filament.name}${filament.stock > 0 ? '' : ' (sin stock)'}`;
    option.disabled = filament.stock === 0;
    option.dataset.hex = filament.hex;
    select.appendChild(option);
  });
  if (previousValue) {
    select.value = previousValue;
  }
}

function addColorSegment() {
  if (addColorSegmentBtn.disabled) return;
  const template = document.getElementById('colorSegmentTemplate');
  const fragment = template.content.cloneNode(true);
  const segment = fragment.querySelector('.color-segment');
  const select = fragment.querySelector('.segment-color');
  populateColorSelect(select);
  const removeBtn = fragment.querySelector('.remove-segment');
  removeBtn.addEventListener('click', () => {
    segment.remove();
    updateSummary();
  });
  select.addEventListener('change', updateSummary);
  fragment.querySelector('.segment-name').addEventListener('input', updateSummary);
  colorSegments.appendChild(fragment);
  updateSummary();
}

function cleanScene() {
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    currentMesh = null;
  }
  currentGeometry = null;
  previewContainer.classList.remove('has-model');
  colorSegments.innerHTML = '';
  refreshColorSegments();
  updateSummary();
}

function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    cleanScene();
    return;
  }
  currentFileName = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const loader = new THREE.STLLoader();
    try {
      const geometry = loader.parse(arrayBuffer);
      setupGeometry(geometry);
    } catch (error) {
      console.error('No se pudo cargar el STL', error);
      cleanScene();
      alert('Hubo un problema al leer el archivo STL. Verifica que sea válido.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function setupGeometry(geometry) {
  cleanScene();
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    metalness: 0.1,
    roughness: 0.6,
  });
  currentMesh = new THREE.Mesh(geometry, material);
  currentGeometry = geometry;
  scene.add(currentMesh);

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  currentMesh.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 2.5;
  camera.position.set(cameraZ, cameraZ, cameraZ);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  controls.update();

  previewContainer.classList.add('has-model');
  refreshColorSegments();
  if (colorSegments.childElementCount === 0 && !addColorSegmentBtn.disabled) {
    addColorSegment();
  } else {
    updateSummary();
  }
}

function resizeRenderer() {
  const rect = previewContainer.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (width === 0 || height === 0) {
    return;
  }
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  animationFrame = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function computeVolume(geometry) {
  if (!geometry) return 0;
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = geom.getAttribute('position');
  const array = position.array;
  let volume = 0;
  for (let i = 0; i < array.length; i += 9) {
    const ax = array[i];
    const ay = array[i + 1];
    const az = array[i + 2];
    const bx = array[i + 3];
    const by = array[i + 4];
    const bz = array[i + 5];
    const cx = array[i + 6];
    const cy = array[i + 7];
    const cz = array[i + 8];

    const v321 = cz * by * ax;
    const v231 = cy * bz * ax;
    const v312 = cz * ay * bx;
    const v132 = cy * az * bx;
    const v213 = cx * az * by;
    const v123 = cx * ay * bz;
    volume += -v321 + v231 + v312 - v132 - v213 + v123;
  }
  return Math.abs(volume / 6);
}

function computeEstimation() {
  if (!currentGeometry) {
    return null;
  }
  const solidVolumeMm3 = computeVolume(currentGeometry);
  const density = densityMap[materialSelect.value] ?? densityMap.PLA;
  const infill = Math.min(Math.max(Number(infillInput.value) || 20, 1), 100) / 100;
  const effectiveVolume = solidVolumeMm3 * (0.35 + infill * 0.65);
  const volumeCm3 = effectiveVolume / 1000;
  const weightGrams = volumeCm3 * density;
  const costMaterial = (weightGrams / 1000) * (Number(pricePerKg.value) || 0);
  const costPrintTime = (Number(printTime.value) || 0) * (Number(hourlyRate.value) || 0);
  const subtotal = costMaterial + costPrintTime;
  const margin = subtotal * 0.25;
  const total = subtotal + margin;
  return {
    fileName: currentFileName,
    volumeCm3,
    weightGrams,
    costMaterial,
    costPrintTime,
    total,
    infill: infill * 100,
  };
}

function updateSummary() {
  requestFeedback.classList.add('hidden');
  summaryList.innerHTML = '';
  const estimation = computeEstimation();
  if (!estimation) {
    summaryList.innerHTML = '<li><strong>Estado</strong><span>Carga un STL para comenzar</span></li>';
    return;
  }

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  const segments = Array.from(colorSegments.querySelectorAll('.color-segment')).map((segment) => {
    const name = segment.querySelector('.segment-name').value.trim() || 'Segmento sin nombre';
    const color = segment.querySelector('.segment-color').value;
    return { name, color };
  });

  const summaryItems = [
    ['Archivo', estimation.fileName || '—'],
    ['Material', materialSelect.value],
    ['Infill', `${estimation.infill.toFixed(0)}%`],
    ['Volumen estimado', `${estimation.volumeCm3.toFixed(2)} cm³`],
    ['Peso estimado', `${estimation.weightGrams.toFixed(1)} g`],
    ['Costo material', formatter.format(estimation.costMaterial)],
    ['Costo de tiempo', formatter.format(estimation.costPrintTime)],
    ['Costo sugerido', formatter.format(estimation.total)],
  ];

  summaryItems.forEach(([label, value]) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
    summaryList.appendChild(li);
  });

  if (segments.length) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Colores</strong><span>${segments
      .map((segment) => `${segment.name}: ${segment.color}`)
      .join('<br />')}</span>`;
    summaryList.appendChild(li);
  }
}

function generateMailTo(estimation, segments, client) {
  const lines = [
    `Cliente: ${client.name}`,
    `Email: ${client.email}`,
    `Contacto preferido: ${client.method}`,
    client.notes ? `Notas: ${client.notes}` : null,
    '',
    `Archivo: ${estimation.fileName}`,
    `Material: ${materialSelect.value}`,
    `Infill: ${estimation.infill.toFixed(0)}%`,
    `Volumen estimado: ${estimation.volumeCm3.toFixed(2)} cm³`,
    `Peso estimado: ${estimation.weightGrams.toFixed(1)} g`,
    `Costo sugerido: ${estimation.total.toFixed(2)} USD`,
  ];
  const sanitized = lines.filter((line) => line !== null);
  if (segments.length) {
    sanitized.push('', 'Segmentos de color:', ...segments.map((segment) => `- ${segment.name}: ${segment.color}`));
  }
  const body = encodeURIComponent(sanitized.join('\n'));
  return `mailto:impresiones@tuhub3d.com?subject=Solicitud%20de%20impresión%203D&body=${body}`;
}

function handleRequestSubmit(event) {
  event.preventDefault();
  const estimation = computeEstimation();
  if (!estimation) {
    alert('Primero carga un archivo STL para poder enviar la solicitud.');
    return;
  }
  const clientName = document.getElementById('clientName').value.trim();
  const clientEmail = document.getElementById('clientEmail').value.trim();
  const contactMethod = document.getElementById('contactMethod').value;
  const additionalNotes = document.getElementById('additionalNotes').value.trim();

  if (!clientName || !clientEmail) {
    alert('Completa tu nombre y correo para continuar.');
    return;
  }

  const segments = Array.from(colorSegments.querySelectorAll('.color-segment')).map((segment) => ({
    name: segment.querySelector('.segment-name').value.trim() || 'Segmento sin nombre',
    color: segment.querySelector('.segment-color').value,
  }));

  const summary = {
    cliente: clientName,
    email: clientEmail,
    contacto: contactMethod,
    notas: additionalNotes,
    estimation,
    segments,
  };

  requestFeedback.classList.remove('hidden');
  requestFeedback.innerHTML = `
    <strong>¡Solicitud preparada!</strong>
    <span>Revisa tu bandeja de salida: abrimos tu cliente de correo con el resumen listo para enviar.</span>
    <span>Si preferís otro medio, copia los datos y contáctanos por WhatsApp o Instagram.</span>
  `;

  window.location.href = generateMailTo(estimation, segments, {
    name: clientName,
    email: clientEmail,
    method: contactLabels[contactMethod] ?? contactMethod,
    notes: additionalNotes,
  });
  console.info('Resumen de solicitud', summary);
  requestForm.reset();
}

function init() {
  resizeRenderer();
  animate();
  renderFilamentList();
  refreshColorSegments();
  window.addEventListener('resize', resizeRenderer);
  stlInput.addEventListener('change', handleFile);
  addColorSegmentBtn.addEventListener('click', addColorSegment);
  materialSelect.addEventListener('change', updateSummary);
  infillInput.addEventListener('input', updateSummary);
  pricePerKg.addEventListener('input', updateSummary);
  printTime.addEventListener('input', updateSummary);
  hourlyRate.addEventListener('input', updateSummary);
  requestForm.addEventListener('submit', handleRequestSubmit);

  toggleAdminBtn.addEventListener('click', () => {
    adminPanel.classList.toggle('hidden');
    toggleAdminBtn.textContent = adminPanel.classList.contains('hidden')
      ? 'Actualizar stock'
      : 'Ocultar panel';
  });

  addFilamentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('filamentName').value.trim();
    const hex = document.getElementById('filamentHex').value;
    const stock = Number(document.getElementById('filamentStock').value);
    if (!name) return;
    const existing = filamentData.find((filament) => filament.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.hex = hex;
      existing.stock = stock;
    } else {
      filamentData.push({ name, hex, stock });
    }
    saveFilamentStock();
    renderFilamentList();
    refreshColorSegments();
    addFilamentForm.reset();
  });
}

init();
