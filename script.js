const viewer = document.getElementById('viewer');
const stlInput = document.getElementById('stlInput');
const volumeEl = document.getElementById('volume');
const weightEl = document.getElementById('weight');
const priceEl = document.getElementById('price');
const densityInput = document.getElementById('density');
const infillInput = document.getElementById('infill');
const shellFactorInput = document.getElementById('shellFactor');
const costPerGramInput = document.getElementById('costPerGram');
const serviceFeeInput = document.getElementById('serviceFee');
const estimationForm = document.getElementById('estimationForm');
const summaryEl = document.getElementById('summary');
const generateSummaryBtn = document.getElementById('generateSummary');
const copySummaryBtn = document.getElementById('copySummary');
const sendEmailBtn = document.getElementById('sendEmail');
const clientInfoInput = document.getElementById('clientInfo');
const additionalNotesInput = document.getElementById('additionalNotes');
const customColorRequestInput = document.getElementById('customColorRequest');
const colorSelector = document.getElementById('colorSelector');
const colorNoteInput = document.getElementById('colorNote');
const colorForm = document.getElementById('colorForm');
const colorPlanList = document.getElementById('colorPlan');
const stockList = document.getElementById('stockList');
const refreshStockBtn = document.getElementById('refreshStock');
const stockForm = document.getElementById('stockForm');
const stockNameInput = document.getElementById('stockName');
const stockHexInput = document.getElementById('stockHex');
const stockMaterialInput = document.getElementById('stockMaterial');
const stockGramsInput = document.getElementById('stockGrams');
const editingIndexInput = document.getElementById('editingIndex');
const resetStockBtn = document.getElementById('resetStock');

const defaultStock = [
  {
    name: 'Blanco ártico',
    hex: '#f8fafc',
    material: 'PLA',
    grams: 650,
  },
  {
    name: 'Negro mate',
    hex: '#0f172a',
    material: 'PLA+',
    grams: 280,
  },
  {
    name: 'Rojo rubí',
    hex: '#ef4444',
    material: 'PETG',
    grams: 520,
  },
  {
    name: 'Azul eléctrico',
    hex: '#2563eb',
    material: 'PLA',
    grams: 410,
  },
  {
    name: 'Verde esmeralda',
    hex: '#10b981',
    material: 'PLA Silk',
    grams: 180,
  },
  {
    name: 'Transparente',
    hex: '#dbeafe',
    material: 'PETG',
    grams: 340,
  },
];

let renderer, scene, camera, controls;
let currentMesh;
let currentGeometry;
let currentModelName = '';
let colorPlan = [];

function initViewer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120);

  const aspect = viewer.clientWidth / viewer.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(1.5, 1.5, 1.5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.75);
  directional.position.set(1, 1, 1);
  scene.add(directional);

  const floor = new THREE.GridHelper(5, 10, 0x1e293b, 0x1e293b);
  floor.position.y = -0.5;
  scene.add(floor);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function loadStock() {
  const stored = localStorage.getItem('filamentStock');
  const stock = stored ? JSON.parse(stored) : [...defaultStock];
  renderStock(stock);
  updateColorSelector(stock);
}

function saveStock(stock) {
  localStorage.setItem('filamentStock', JSON.stringify(stock));
  renderStock(stock);
  updateColorSelector(stock);
}

function renderStock(stock) {
  stockList.innerHTML = '';
  stock.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'stock-item';

    const header = document.createElement('div');
    header.className = 'stock-item__header';

    const swatch = document.createElement('div');
    swatch.className = 'stock-item__swatch';
    swatch.style.background = item.hex;

    const titleWrapper = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'stock-item__title';
    title.textContent = item.name;

    const meta = document.createElement('div');
    meta.className = 'stock-item__meta';
    meta.textContent = item.material;

    const grams = document.createElement('div');
    grams.className = 'stock-item__grams';
    grams.innerHTML = `<strong>${item.grams} g</strong> disponibles`;

    const actions = document.createElement('div');
    actions.className = 'stock-item__actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => populateStockForm(item, index));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => deleteStockItem(index));

    actions.append(editBtn, deleteBtn);

    titleWrapper.append(title, meta, grams);
    header.append(swatch, titleWrapper);
    card.append(header, actions);
    stockList.appendChild(card);
  });
}

function updateColorSelector(stock) {
  colorSelector.innerHTML = '';
  stock.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${item.name} · ${item.material} · ${item.grams} g`;
    option.dataset.hex = item.hex;
    colorSelector.appendChild(option);
  });
}

function populateStockForm(item, index) {
  stockNameInput.value = item.name;
  stockHexInput.value = item.hex;
  stockMaterialInput.value = item.material;
  stockGramsInput.value = item.grams;
  editingIndexInput.value = index;
  stockNameInput.focus();
}

function deleteStockItem(index) {
  const stored = localStorage.getItem('filamentStock');
  const stock = stored ? JSON.parse(stored) : [...defaultStock];
  stock.splice(index, 1);
  saveStock(stock);
}

function resetStock() {
  localStorage.removeItem('filamentStock');
  loadStock();
  stockForm.reset();
  editingIndexInput.value = '';
}

function handleStockSubmit(event) {
  event.preventDefault();
  const stored = localStorage.getItem('filamentStock');
  const stock = stored ? JSON.parse(stored) : [...defaultStock];
  const newItem = {
    name: stockNameInput.value.trim() || 'Color sin nombre',
    hex: stockHexInput.value.trim() || '#ffffff',
    material: stockMaterialInput.value.trim() || 'PLA',
    grams: Number(stockGramsInput.value) || 0,
  };

  if (editingIndexInput.value !== '') {
    stock[Number(editingIndexInput.value)] = newItem;
  } else {
    stock.push(newItem);
  }

  saveStock(stock);
  stockForm.reset();
  editingIndexInput.value = '';
}

function addColorToPlan(event) {
  event.preventDefault();
  const stored = localStorage.getItem('filamentStock');
  const stock = stored ? JSON.parse(stored) : [...defaultStock];

  if (!stock.length) {
    alert('No hay colores cargados en el stock.');
    return;
  }

  const selectedIndex = Number(colorSelector.value);
  const selectedColor = stock[selectedIndex];
  const note = colorNoteInput.value.trim();

  if (!selectedColor) return;

  colorPlan.push({ color: selectedColor, note });
  colorNoteInput.value = '';
  renderColorPlan();
  updateSummary();
}

function renderColorPlan() {
  colorPlanList.innerHTML = '';
  colorPlan.forEach((item, index) => {
    const li = document.createElement('li');

    const badge = document.createElement('div');
    badge.className = 'color-plan__badge';
    const swatch = document.createElement('span');
    swatch.style.background = item.color.hex;
    badge.append(swatch, document.createTextNode(item.color.name));

    const note = document.createElement('div');
    note.textContent = item.note || 'Sin detalles específicos';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Quitar';
    removeBtn.addEventListener('click', () => {
      colorPlan.splice(index, 1);
      renderColorPlan();
      updateSummary();
    });

    li.append(badge, note, removeBtn);
    colorPlanList.appendChild(li);
  });
}

function setupFileLoader() {
  const loader = new THREE.STLLoader();
  stlInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    currentModelName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result;
      if (!contents) return;
      const geometry = loader.parse(contents);
      updateModel(geometry);
    };
    reader.readAsArrayBuffer(file);
  });
}

function updateModel(geometry) {
  geometry.computeVertexNormals();
  geometry.center();
  currentGeometry = geometry;

  if (currentMesh) {
    scene.remove(currentMesh);
  }

  const material = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    metalness: 0.1,
    roughness: 0.6,
  });

  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);

  const box = new THREE.Box3().setFromObject(currentMesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitDistance = maxDim * 2;
  const center = new THREE.Vector3();
  box.getCenter(center);

  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(fitDistance, fitDistance, fitDistance)));
  camera.lookAt(center);

  updateEstimates();
}

function calculateVolume(geometry) {
  const position = geometry.attributes.position;
  const indices = geometry.index ? geometry.index.array : null;
  let volume = 0;

  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const ai = indices[i] * 3;
      const bi = indices[i + 1] * 3;
      const ci = indices[i + 2] * 3;
      volume += signedVolumeOfTriangle(
        position.getX(indices[i]),
        position.getY(indices[i]),
        position.getZ(indices[i]),
        position.getX(indices[i + 1]),
        position.getY(indices[i + 1]),
        position.getZ(indices[i + 1]),
        position.getX(indices[i + 2]),
        position.getY(indices[i + 2]),
        position.getZ(indices[i + 2])
      );
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      volume += signedVolumeOfTriangle(
        position.getX(i),
        position.getY(i),
        position.getZ(i),
        position.getX(i + 1),
        position.getY(i + 1),
        position.getZ(i + 1),
        position.getX(i + 2),
        position.getY(i + 2),
        position.getZ(i + 2)
      );
    }
  }

  return Math.abs(volume);
}

function signedVolumeOfTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  return (
    (x1 * y2 * z3 + x2 * y3 * z1 + x3 * y1 * z2 -
      x1 * y3 * z2 -
      x2 * y1 * z3 -
      x3 * y2 * z1) /
    6
  );
}

function updateEstimates() {
  if (!currentGeometry) {
    volumeEl.textContent = '—';
    weightEl.textContent = '—';
    priceEl.textContent = '—';
    return;
  }

  const density = Number(densityInput.value) || 1.24;
  const infill = Math.min(Math.max(Number(infillInput.value) || 0, 0), 100) / 100;
  const shellFactor = Math.min(Math.max(Number(shellFactorInput.value) || 0.3, 0), 1);
  const costPerGram = Number(costPerGramInput.value) || 0.18;
  const serviceFee = Number(serviceFeeInput.value) || 0;

  const volumeMm = calculateVolume(currentGeometry); // mm^3
  const volumeCm = volumeMm / 1000; // cm^3
  const effectiveVolume = volumeCm * (shellFactor + (1 - shellFactor) * infill);
  const weight = effectiveVolume * density;
  const price = weight * costPerGram + serviceFee;

  volumeEl.textContent = volumeCm.toFixed(2);
  weightEl.textContent = weight.toFixed(1);
  priceEl.textContent = price.toFixed(2);

  updateSummary();
}

function updateSummary() {
  const density = Number(densityInput.value) || 1.24;
  const infill = Number(infillInput.value) || 20;
  const shellFactor = Number(shellFactorInput.value) || 0.35;
  const costPerGram = Number(costPerGramInput.value) || 0.18;
  const serviceFee = Number(serviceFeeInput.value) || 0;

  const volume = volumeEl.textContent;
  const weight = weightEl.textContent;
  const price = priceEl.textContent;

  const colorsSummary = colorPlan
    .map(
      (item, index) =>
        `${index + 1}. ${item.color.name} (${item.color.material}) - ${item.note || 'Sin observaciones'}`
    )
    .join('\n');

  const summary = `Pedido de impresión 3D
========================
Modelo: ${currentModelName || 'Sin cargar'}

Parámetros de cálculo
- Densidad: ${density.toFixed(2)} g/cm³
- Infill: ${infill}%
- Factor de paredes/soportes: ${shellFactor}
- Costo por gramo: $${costPerGram.toFixed(2)}
- Costo fijo: $${serviceFee.toFixed(2)}

Estimaciones
- Volumen: ${volume} cm³
- Peso: ${weight} g
- Costo estimado: $${price}

Plan de colores
${colorsSummary || 'Sin colores seleccionados'}

Colores fuera de stock: ${customColorRequestInput.value || 'N/A'}
Notas adicionales: ${additionalNotesInput.value || 'N/A'}

Contacto: ${clientInfoInput.value || 'No indicado'}`;

  summaryEl.textContent = summary;
}

function copySummary() {
  navigator.clipboard
    .writeText(summaryEl.textContent)
    .then(() => {
      showToast('Resumen copiado al portapapeles');
    })
    .catch(() => {
      showToast('No se pudo copiar. Seleccioná el texto manualmente.', true);
    });
}

function sendEmail() {
  const body = encodeURIComponent(summaryEl.textContent);
  const subject = encodeURIComponent('Nuevo pedido de impresión 3D');
  window.location.href = `mailto:tuemail@ejemplo.com?subject=${subject}&body=${body}`;
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `toast ${isError ? 'toast--error' : ''}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function setupListeners() {
  estimationForm.addEventListener('input', updateEstimates);
  colorForm.addEventListener('submit', addColorToPlan);
  generateSummaryBtn.addEventListener('click', updateSummary);
  copySummaryBtn.addEventListener('click', copySummary);
  sendEmailBtn.addEventListener('click', sendEmail);
  refreshStockBtn.addEventListener('click', loadStock);
  stockForm.addEventListener('submit', handleStockSubmit);
  resetStockBtn.addEventListener('click', resetStock);
}

function ensureToastStyles() {
  const style = document.createElement('style');
  style.textContent = `.toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: rgba(15, 23, 42, 0.9);
    color: white;
    padding: 0.8rem 1.2rem;
    border-radius: 0.75rem;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.4);
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    z-index: 2000;
  }
  .toast--visible {
    transform: translateY(0);
    opacity: 1;
  }
  .toast--error {
    background: rgba(239, 68, 68, 0.9);
  }`;
  document.head.appendChild(style);
}

initViewer();
setupFileLoader();
setupListeners();
ensureToastStyles();
loadStock();
updateSummary();
