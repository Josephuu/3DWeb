import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/STLLoader.js';

const canvas = document.getElementById('preview-canvas');
const hint = document.getElementById('preview-hint');
const volumeValue = document.getElementById('volume-value');
const dimensionsValue = document.getElementById('dimensions-value');
const weightValue = document.getElementById('weight-value');
const costValue = document.getElementById('cost-value');
const timeValue = document.getElementById('time-value');
const quoteSummary = document.getElementById('quote-summary');
const mailtoLink = document.getElementById('mailto-link');
const copySummaryBtn = document.getElementById('copy-summary');

const infillInput = document.getElementById('infill-input');
const infillDisplay = document.getElementById('infill-display');
const shellInput = document.getElementById('shell-input');
const densityInput = document.getElementById('density-input');

const stlInput = document.getElementById('stl-input');
const addColorBtn = document.getElementById('add-color');
const colorContainer = document.getElementById('color-rows');
const colorTotal = document.getElementById('color-total');

const stockOverlay = document.getElementById('stock-overlay');
const stockPanel = document.getElementById('stock-panel');
const toggleStockPanel = document.getElementById('toggle-stock-panel');
const closeStockPanel = document.getElementById('close-stock');
const stockTableBody = document.querySelector('#stock-table tbody');
const addStockBtn = document.getElementById('add-stock');
const inventorySummary = document.getElementById('inventory-summary');

const customColorForm = document.getElementById('custom-color-form');
const customColorFeedback = document.getElementById('custom-color-feedback');

let scene, camera, renderer, controls, mesh;
let currentFileName = '';
let rawVolume = 0;
let boundingBox = null;

const DEFAULT_STOCK = [
  { name: 'PLA Blanco', hex: '#f5f5f5', grams: 720, pricePerKg: 22 },
  { name: 'PLA Negro', hex: '#222222', grams: 540, pricePerKg: 22 },
  { name: 'PLA Rojo', hex: '#e53e3e', grams: 320, pricePerKg: 24 },
  { name: 'PETG Transparente', hex: '#d1f5ff', grams: 900, pricePerKg: 28 }
];

const STORAGE_KEYS = {
  stock: 'threeDStock',
  colorRows: 'threeDColorRows'
};

function loadStock() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.stock);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('No se pudo leer el stock desde localStorage', error);
  }
  return DEFAULT_STOCK;
}

let stock = loadStock();

function saveStock() {
  localStorage.setItem(STORAGE_KEYS.stock, JSON.stringify(stock));
  renderStockTable();
  renderInventorySummary();
  updateColorRows();
}

function renderStockTable() {
  stockTableBody.innerHTML = '';
  stock.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><div class="stock-color"><span class="color-swatch" style="background:${item.hex}"></span>${item.name}</div></td>
      <td><input type="number" min="0" value="${item.grams}" data-action="grams" data-index="${index}" /></td>
      <td><input type="number" min="0" step="0.5" value="${item.pricePerKg}" data-action="price" data-index="${index}" /></td>
      <td><input type="text" value="${item.hex}" data-action="hex" data-index="${index}" /></td>
      <td><button class="icon-button" data-action="delete" data-index="${index}">Eliminar</button></td>
    `;
    stockTableBody.appendChild(row);
  });
}

function renderInventorySummary() {
  if (!inventorySummary) return;
  inventorySummary.innerHTML = '';

  if (!stock.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Sin colores disponibles. Administrá tu inventario para mostrar opciones.';
    inventorySummary.appendChild(empty);
    return;
  }

  const topStock = [...stock].sort((a, b) => b.grams - a.grams).slice(0, 4);
  topStock.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="swatch" style="background:${item.hex}"></span>
      <div>
        <strong>${item.name}</strong>
        <span>${item.grams} g disponibles · USD ${(item.pricePerKg / 1000).toFixed(2)}/g</span>
      </div>
    `;
    inventorySummary.appendChild(li);
  });

  if (stock.length > topStock.length) {
    const footer = document.createElement('li');
    footer.className = 'inventory-footer';
    footer.textContent = `+${stock.length - topStock.length} colores adicionales disponibles`;
    inventorySummary.appendChild(footer);
  }
}

stockTableBody.addEventListener('input', (event) => {
  const { action, index } = event.target.dataset;
  if (typeof action === 'undefined') return;
  const value = event.target.value;
  if (!stock[index]) return;

  if (action === 'grams' || action === 'price') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      stock[index][action === 'grams' ? 'grams' : 'pricePerKg'] = numeric;
      saveStock();
    }
  } else if (action === 'hex') {
    stock[index].hex = value;
    saveStock();
  }
});

stockTableBody.addEventListener('click', (event) => {
  const { action, index } = event.target.dataset;
  if (action === 'delete' && stock[index]) {
    stock.splice(Number(index), 1);
    saveStock();
  }
});

addStockBtn.addEventListener('click', () => {
  stock.push({ name: 'Nuevo color', hex: '#ffffff', grams: 0, pricePerKg: 25 });
  saveStock();
});

toggleStockPanel?.addEventListener('click', () => {
  stockOverlay?.classList.remove('hidden');
  stockPanel?.focus?.();
});

closeStockPanel?.addEventListener('click', () => {
  stockOverlay?.classList.add('hidden');
});

stockOverlay?.addEventListener('click', (event) => {
  if (event.target.dataset.close === 'true') {
    stockOverlay.classList.add('hidden');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    stockOverlay?.classList.add('hidden');
  }
});

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1f33);

  const { width, height } = getCanvasDimensions();
  const aspect = width / height;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(120, 90, 140);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x202020, 1.2);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(100, 120, 80);
  scene.add(dirLight);

  const grid = new THREE.GridHelper(200, 20, 0x334155, 0x1e293b);
  scene.add(grid);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const { width, height } = getCanvasDimensions();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

initThree();

function getCanvasDimensions() {
  const rect = canvas.getBoundingClientRect();
  return {
    width: Math.max(1, rect.width || canvas.clientWidth || 400),
    height: Math.max(1, rect.height || canvas.clientHeight || 300)
  };
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3)) / 6.0;
}

function computeVolume(geometry) {
  const position = geometry.attributes.position;
  const vector = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let volume = 0;

  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    volume += signedVolumeOfTriangle(a, b, c);
  }

  return Math.abs(volume);
}

function updateColorRows() {
  colorContainer.innerHTML = '';
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.colorRows) || '[]');
  const rows = saved.length ? saved : [{ color: stock[0]?.name || '', percent: 100 }];
  rows.forEach(row => addColorRow(row.color, row.percent));
}

function persistColorRows() {
  const rows = [...colorContainer.querySelectorAll('.color-row')].map(row => ({
    color: row.querySelector('select').value,
    percent: Number(row.querySelector('input[type="number"]').value)
  }));
  localStorage.setItem(STORAGE_KEYS.colorRows, JSON.stringify(rows));
}

function addColorRow(selectedColor = '', percent = 0) {
  const row = document.createElement('div');
  row.className = 'color-row';

  const select = document.createElement('select');
  stock.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = `${item.name} (${item.grams} g disponibles)`;
    option.disabled = item.grams <= 0;
    if (item.name === selectedColor) option.selected = true;
    select.appendChild(option);
  });

  const percentInput = document.createElement('input');
  percentInput.type = 'number';
  percentInput.min = '0';
  percentInput.max = '100';
  percentInput.value = percent || 0;

  const swatch = document.createElement('div');
  swatch.className = 'color-swatch';
  updateSwatchColor(swatch, select.value);

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Eliminar';
  removeBtn.className = 'secondary remove-row';

  row.append(select, percentInput, swatch, removeBtn);
  colorContainer.appendChild(row);
  updateColorTotal();

  select.addEventListener('change', () => {
    updateSwatchColor(swatch, select.value);
    persistColorRows();
    updateEstimates();
  });
  percentInput.addEventListener('input', () => {
    updateColorTotal();
    persistColorRows();
    updateEstimates();
  });
  removeBtn.addEventListener('click', () => {
    row.remove();
    updateColorTotal();
    persistColorRows();
    updateEstimates();
  });
}

function updateSwatchColor(el, colorName) {
  const item = stock.find(entry => entry.name === colorName);
  el.style.background = item?.hex || '#cbd5f5';
}

addColorBtn.addEventListener('click', () => {
  addColorRow(stock[0]?.name || '', 0);
  persistColorRows();
});

function updateColorTotal() {
  const inputs = Array.from(colorContainer.querySelectorAll('input[type="number"]'));
  const total = inputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
  colorTotal.textContent = `Total: ${total}%`;
  colorTotal.style.color = total === 100 ? 'var(--success)' : total > 100 ? 'var(--danger)' : 'var(--secondary)';
}

updateColorRows();
renderStockTable();
renderInventorySummary();
updateColorTotal();

function handleFile(file) {
  currentFileName = file.name;
  const reader = new FileReader();
  reader.onload = (event) => {
    const loader = new STLLoader();
    const geometry = loader.parse(event.target.result);
    geometry.computeVertexNormals();
    geometry.center();

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.1, roughness: 0.8 });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    boundingBox = box;
    const size = new THREE.Vector3();
    box.getSize(size);
    const diagonal = size.length();
    controls.target.copy(mesh.position);
    camera.position.copy(new THREE.Vector3(diagonal * 0.8, diagonal * 0.6, diagonal * 1.1));
    controls.update();

    rawVolume = computeVolume(geometry);
    updateGeometryInfo(size);
    updateEstimates();

    hint.classList.add('hidden');
  };
  reader.readAsArrayBuffer(file);
}

function updateGeometryInfo(sizeVector) {
  const volumeCm3 = rawVolume / 1000;
  volumeValue.textContent = `${rawVolume.toFixed(0)} mm³ (${volumeCm3.toFixed(2)} cm³)`;
  dimensionsValue.textContent = `${sizeVector.x.toFixed(1)} × ${sizeVector.y.toFixed(1)} × ${sizeVector.z.toFixed(1)} mm`;
}

stlInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) handleFile(file);
});

['dragenter', 'dragover'].forEach(eventName => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

['dragleave', 'drop'].forEach(eventName => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (eventName === 'drop') {
      const file = event.dataTransfer?.files?.[0];
      if (file && file.name.endsWith('.stl')) {
        handleFile(file);
      }
    }
  });
});

infillInput.addEventListener('input', () => {
  infillDisplay.textContent = infillInput.value;
  updateEstimates();
});

[shellInput, densityInput].forEach(input => {
  input.addEventListener('input', updateEstimates);
});

function estimateWeight() {
  if (!rawVolume) return 0;
  const infill = Number(infillInput.value) / 100;
  const shells = Number(shellInput.value);
  const density = Number(densityInput.value);

  const shellFactor = Math.min(shells * 0.05, 0.4);
  const effectiveRatio = shellFactor + (1 - shellFactor) * infill;
  const volumeCm3 = rawVolume / 1000;
  const grams = volumeCm3 * density * effectiveRatio;
  return grams;
}

function estimatePrintTime(weight) {
  if (!rawVolume) return 0;
  const base = rawVolume / 5000; // base minutes roughly proportional to volume
  const speedFactor = Math.max(0.4, 1 - Number(shellInput.value) * 0.05);
  const infillFactor = 0.6 + Number(infillInput.value) / 100;
  const minutes = base * infillFactor / speedFactor;
  return minutes;
}

function buildSummary(weight, cost, minutes) {
  const lines = [];
  lines.push(`Archivo: ${currentFileName || 'No cargado'}`);
  lines.push(`Volumen bruto: ${rawVolume ? rawVolume.toFixed(0) + ' mm³' : '-'}`);
  lines.push(`Peso estimado: ${weight.toFixed(1)} g`);
  lines.push(`Costo estimado: USD ${cost.toFixed(2)}`);
  lines.push(`Tiempo estimado de impresión: ${formatDuration(minutes)}`);
  lines.push('');
  lines.push('Configuración:');
  lines.push(`- Relleno: ${infillInput.value}%`);
  lines.push(`- Capas exteriores: ${shellInput.value}`);
  lines.push(`- Densidad material: ${densityInput.value} g/cm³`);
  lines.push('');
  lines.push('Distribución de colores:');
  getColorRows().forEach(({ color, percent }) => {
    lines.push(`- ${color}: ${percent}%`);
  });
  return lines.join('\n');
}

function getColorRows() {
  return [...colorContainer.querySelectorAll('.color-row')].map(row => ({
    color: row.querySelector('select').value,
    percent: Number(row.querySelector('input[type="number"]').value)
  }));
}

function updateEstimates() {
  if (!rawVolume) {
    weightValue.textContent = '-';
    costValue.textContent = '-';
    timeValue.textContent = '-';
    quoteSummary.value = '';
    mailtoLink.href = '#';
    return;
  }

  const weight = estimateWeight();
  const colorRows = getColorRows();
  const totalPercent = colorRows.reduce((sum, row) => sum + row.percent, 0);
  const density = Number(densityInput.value);

  let totalCost = 0;
  colorRows.forEach(row => {
    const item = stock.find(entry => entry.name === row.color);
    if (!item) return;
    const fraction = totalPercent ? row.percent / totalPercent : 0;
    const gramsForColor = weight * fraction;
    const pricePerGram = item.pricePerKg / 1000;
    totalCost += gramsForColor * pricePerGram;
  });

  const minutes = estimatePrintTime(weight);

  weightValue.textContent = `${weight.toFixed(1)} g`;
  costValue.textContent = `USD ${totalCost.toFixed(2)}`;
  timeValue.textContent = formatDuration(minutes);

  const summary = buildSummary(weight, totalCost, minutes);
  quoteSummary.value = summary;
  updateMailtoLink(summary);
}

function updateMailtoLink(summary) {
  const subject = encodeURIComponent('Solicitud de impresión 3D');
  const body = encodeURIComponent(`${summary}\n\nDatos de contacto:\n`);
  mailtoLink.href = `mailto:tuemail@ejemplo.com?subject=${subject}&body=${body}`;
}

function formatDuration(minutes) {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours <= 0) return `${mins} min`;
  return `${hours} h ${mins} min`;
}

copySummaryBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(quoteSummary.value);
    copySummaryBtn.textContent = 'Copiado!';
    setTimeout(() => (copySummaryBtn.textContent = 'Copiar resumen'), 2000);
  } catch (error) {
    copySummaryBtn.textContent = 'Error';
    console.error('No se pudo copiar', error);
  }
});

customColorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const desired = document.getElementById('desired-color').value.trim();
  const method = document.getElementById('contact-method').value;
  const contactValue = document.getElementById('contact-value').value.trim();
  const notes = document.getElementById('contact-notes').value.trim();

  const summary = `Consulta de color especial%0AColor: ${desired}%0AMétodo: ${method}%0ADatos: ${contactValue}%0AComentarios: ${notes || 'Sin comentarios'}`;
  const target = method === 'whatsapp'
    ? `https://wa.me/?text=${summary}`
    : method === 'instagram'
      ? `https://www.instagram.com/direct/t/` // se abre DM, el usuario completará manualmente
      : `mailto:tuemail@ejemplo.com?subject=${encodeURIComponent('Consulta por color especial')}&body=${summary}`;

  window.open(target, '_blank');
  customColorFeedback.textContent = '¡Gracias! Abrimos una nueva pestaña con tu mensaje.';
  customColorForm.reset();
});

updateEstimates();
