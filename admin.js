// ============ STATE ============
let materiales = {};
let servicios = {};
let currentServiceKey = null;
let currentCalcData = null;

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

// ============ DATA MANAGEMENT ============

// Google Sheets configuration
const SHEET_ID = '1vtvFaUgcWZpfyzPMAEc3o1KGU5QE_Pz6Uy4M3r4nJ_M';

// Download and parse CSV from Google Sheets
async function queryGoogleSheet(sheetName, sheetGid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${sheetGid}`;
  try {
    const response = await fetch(url);
    const csv = await response.text();

    // Parse CSV - handle quoted values properly
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      console.warn(`Sheet "${sheetName}" is empty or has no data`);
      return [];
    }

    // Parse header row - create mapping of original to normalized names
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const headers = rawHeaders.map(h => {
      return h.toLowerCase()
        .replace(/\?/g, '')  // Remove question marks
        .replace(/¿/g, '')   // Remove inverted question marks
        .replace(/["\s]/g, '') // Remove quotes and spaces
        .replace(/_/g, '_');  // Keep underscores
    });

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};

      headers.forEach((header, idx) => {
        if (header) { // Only add non-empty headers
          row[header] = values[idx] || '';
        }
      });

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }

    console.log(`✓ Loaded ${sheetName}: ${rows.length} rows`);
    if (rows.length > 0) {
      console.log(`  Sample row keys: ${Object.keys(rows[0]).join(', ')}`);
      console.log(`  First row id: "${rows[0].id || 'EMPTY'}"`);
    }
    return rows;
  } catch (error) {
    console.error(`Error loading sheet "${sheetName}":`, error);
    return [];
  }
}

async function loadMateriales() {
  try {
    // Load materials from Google Sheets
    const materialesData = await queryGoogleSheet('Materiales', 0);

    // Build materiales object
    materiales = {};

    // Load from Google Sheets if available
    if (materialesData && materialesData.length > 0) {
      materialesData.forEach(mat => {
        const id = mat.id?.trim();
        if (id) {
          materiales[id] = {
            nombre: mat.nombre?.trim() || '',
            unidad: mat.unidad?.trim() || '',
            precio_unitario: parseFloat(mat.precio) || 0
          };
        }
      });
      console.log('✓ Materiales loaded from Google Sheets');
    } else {
      // Fallback: use default materials
      materiales = {
        pega_azulejos: { nombre: 'Pega azulejos', unidad: 'sacos (20kg)', precio_unitario: 380 },
        arena_fina: { nombre: 'Arena fina', unidad: 'm³', precio_unitario: 180 },
        arena_gruesa: { nombre: 'Arena gruesa', unidad: 'm³', precio_unitario: 180 },
        cemento_gris: { nombre: 'Cemento gris', unidad: 'sacos (25kg)', precio_unitario: 220 },
        lechada: { nombre: 'Lechada / Grout', unidad: 'sacos (25kg)', precio_unitario: 420 },
        grava: { nombre: 'Grava o piedra', unidad: 'm³', precio_unitario: 280 },
        agua: { nombre: 'Agua', unidad: 'litros', precio_unitario: 10 },
        pintura_latex: { nombre: 'Pintura látex', unidad: 'litros', precio_unitario: 800 },
        thinner: { nombre: 'Thinner', unidad: 'litros', precio_unitario: 600 },
        masilla_pintura: { nombre: 'Masilla / Resane', unidad: 'kg', precio_unitario: 200 },
        lija: { nombre: 'Lija / Lija adhesiva', unidad: 'pliegos', precio_unitario: 50 },
        placa_tablaroca: { nombre: 'Placa de tablaroca (1.22 x 2.44 m)', unidad: 'piezas', precio_unitario: 280 },
        pegamento_tablaroca: { nombre: 'Pegamento para tablaroca', unidad: 'kg', precio_unitario: 150 },
        tornillos_tablaroca: { nombre: 'Tornillos para tablaroca (1 1/4")', unidad: 'piezas', precio_unitario: 2 },
        cinta_papel: { nombre: 'Cinta de papel para juntas', unidad: 'metros', precio_unitario: 15 },
        masilla_juntas: { nombre: 'Masilla para juntas', unidad: 'kg', precio_unitario: 180 },
        impermeabilizante: { nombre: 'Impermeabilizante líquido', unidad: 'litros', precio_unitario: 500 },
        primer: { nombre: 'Primer / Sellador', unidad: 'litros', precio_unitario: 400 },
        aditivo_impermeabilizante: { nombre: 'Aditivo impermeabilizante', unidad: 'sacos (25kg)', precio_unitario: 620 },
        tela_asfaltica: { nombre: 'Tela asfáltica', unidad: 'm2', precio_unitario: 600 }
      };
      console.log('✓ Materiales loaded from fallback data');
    }

    // Load servicios data
    // Try to fetch from Google Sheets, fallback to hardcoded data if sheets don't exist
    const serviciosData = await queryGoogleSheet('Servicios', 1);
    const serviciosMaterialesData = await queryGoogleSheet('Servicios-Materiales', 2);

    servicios = {};

    if (serviciosData && serviciosData.length > 0) {
      // Load from Google Sheets
      serviciosData.forEach(srv => {
        const id = srv.id?.trim();
        if (id) {
          servicios[id] = {
            nombre: srv.nombre?.trim() || '',
            descripcion: srv.descripcion?.trim() || '',
            medible: srv.medible?.toLowerCase() === 'sí' || srv.medible?.toLowerCase() === 'true',
            materiales: {}
          };
        }
      });

      serviciosMaterialesData.forEach(sm => {
        const servId = sm.id_servicio?.trim();
        const matId = sm.id_material?.trim();
        const qty = parseFloat(sm.cantidad_por_m2) || 0;

        if (servicios[servId] && matId && qty > 0) {
          servicios[servId].materiales[matId] = {
            cantidad_por_m2: qty
          };
        }
      });
      console.log('✓ Servicios loaded from Google Sheets');
    } else {
      // Fallback to hardcoded servicios (when Google Sheets data not available)
      servicios = {
        vitropiso: {
          nombre: 'Vitropiso / Azulejos',
          descripcion: 'Colocación de azulejos y vitropiso',
          medible: true,
          materiales: {
            pega_azulejos: { cantidad_por_m2: 0.075 },
            arena_fina: { cantidad_por_m2: 0.0008 },
            cemento_gris: { cantidad_por_m2: 0.02 },
            lechada: { cantidad_por_m2: 0.012 }
          }
        },
        cementado: {
          nombre: 'Cementado / Piso de concreto',
          descripcion: 'Preparación e instalación de pisos de cemento',
          medible: true,
          materiales: {
            arena_gruesa: { cantidad_por_m2: 0.04 },
            grava: { cantidad_por_m2: 0.06 },
            cemento_gris: { cantidad_por_m2: 1.0 },
            agua: { cantidad_por_m2: 20 }
          }
        },
        pintura: {
          nombre: 'Pintura residencial',
          descripcion: 'Pintura de interiores y exteriores',
          medible: true,
          materiales: {
            pintura_latex: { cantidad_por_m2: 0.12 },
            thinner: { cantidad_por_m2: 0.02 },
            masilla_pintura: { cantidad_por_m2: 0.1 },
            lija: { cantidad_por_m2: 0.02 }
          }
        },
        tablaroca: {
          nombre: 'Instalación de Tablaroca',
          descripcion: 'Muros, plafones y revestimientos',
          medible: true,
          materiales: {
            placa_tablaroca: { cantidad_por_m2: 0.34 },
            pegamento_tablaroca: { cantidad_por_m2: 0.5 },
            tornillos_tablaroca: { cantidad_por_m2: 15 },
            cinta_papel: { cantidad_por_m2: 1.5 },
            masilla_juntas: { cantidad_por_m2: 1.2 }
          }
        },
        impermeabilizacion: {
          nombre: 'Impermeabilización',
          descripcion: 'Impermeabilización de azoteas y techos',
          medible: true,
          materiales: {
            impermeabilizante: { cantidad_por_m2: 1.2 },
            primer: { cantidad_por_m2: 0.3 },
            aditivo_impermeabilizante: { cantidad_por_m2: 0.008 },
            tela_asfaltica: { cantidad_por_m2: 1.1 }
          }
        },
        plomeria: {
          nombre: 'Plomería',
          descripcion: 'Instalación y reparación de tuberías',
          medible: false,
          materiales: {}
        }
      };
      console.log('✓ Servicios loaded from fallback data');
    }

    console.log('✓ All data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function saveMateriales() {
  // Data comes from Google Sheets, no need to save to localStorage
  // This is here for compatibility with edit functions
}

function loadCustomData() {
  // All data comes from Google Sheets, no localStorage caching
}

// ============ MATERIALS TAB ============

// Store current material being edited
let currentEditingMaterial = null;

function renderMaterialsTab() {
  const container = document.getElementById('materialsTabContent');
  if (!container) return;

  let html = `
    <div class="admin-material-table">
      <div class="admin-material-table-header">
        <div>Nombre</div>
        <div>Unidad</div>
        <div>Precio Unitario</div>
        <div class="admin-material-col-actions">Acciones</div>
      </div>
  `;

  Object.entries(materiales).forEach(([key, mat]) => {
    html += `
      <div class="admin-material-row">
        <div>
          <div class="admin-material-name">${escapeHtml(mat.nombre)}</div>
          <div class="admin-material-meta">${escapeHtml(mat.unidad)} • $${mat.precio_unitario.toFixed(2)}</div>
        </div>
        <div>${escapeHtml(mat.unidad)}</div>
        <div>$${mat.precio_unitario.toFixed(2)}</div>
        <div class="btn-row">
          <button onclick="openEditMaterialModal('${escapeHtml(key)}')" class="admin-btn-primary">Editar</button>
          <button onclick="deleteMaterial('${escapeHtml(key)}')" class="admin-btn-danger">Eliminar</button>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <button onclick="openAddMaterialModal()" class="admin-btn-success w-full" style="margin-top: 20px;">+ Agregar Material</button>
  `;

  container.innerHTML = html;
}

function openEditMaterialModal(key) {
  const mat = materiales[key];
  if (!mat) return;

  currentEditingMaterial = key;

  document.getElementById('modalMaterialName').value = mat.nombre;
  document.getElementById('modalMaterialUnit').value = mat.unidad;
  document.getElementById('modalMaterialPrice').value = mat.precio_unitario;
  document.getElementById('modalMaterialPriceInfo').textContent = `Precio actual: $${mat.precio_unitario.toFixed(2)}`;

  document.getElementById('editMaterialModal').classList.add('active');
  document.getElementById('modalMaterialPrice').focus();
}

function closeMaterialModal() {
  document.getElementById('editMaterialModal').classList.remove('active');
  currentEditingMaterial = null;
}

function saveMaterialModal() {
  if (!currentEditingMaterial) return;

  const newPrice = parseFloat(document.getElementById('modalMaterialPrice').value);

  if (isNaN(newPrice) || newPrice < 0) {
    alert('❌ Ingresa un precio válido');
    return;
  }

  materiales[currentEditingMaterial].precio_unitario = newPrice;
  saveMateriales();
  renderMaterialsTab();
  renderServicesTab();

  closeMaterialModal();
  alert('✓ Precio actualizado');
}

function editMaterialModal(key) {
  openEditMaterialModal(key);
}

function addMaterialModal() {
  const nombre = prompt('Nombre del material:');
  if (!nombre || nombre.trim() === '') return;

  const unidad = prompt('Unidad (ej: kg, litros, metros):');
  if (!unidad || unidad.trim() === '') return;

  const precio = parseFloat(prompt('Precio unitario ($):'));
  if (isNaN(precio) || precio < 0) {
    alert('Error: ingresa un precio válido');
    return;
  }

  const key = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  if (materiales[key]) {
    alert('Este material ya existe');
    return;
  }

  materiales[key] = {
    nombre: nombre.trim(),
    unidad: unidad.trim(),
    precio_unitario: precio
  };

  saveMateriales();
  renderMaterialsTab();
  alert('✓ Material agregado');
}

function deleteMaterial(key) {
  if (!confirm(`¿Eliminar "${materiales[key].nombre}"? Esto afectará todos los servicios que lo usan.`)) return;

  // Remove from all services
  Object.keys(servicios).forEach(sKey => {
    if (servicios[sKey].materiales[key]) {
      delete servicios[sKey].materiales[key];
    }
  });

  delete materiales[key];
  saveMateriales();
  renderMaterialsTab();
  renderServicesTab();
  alert('✓ Material eliminado');
}

// ============ SERVICES TAB ============

function renderServicesTab() {
  const sidebar = document.getElementById('servicesSidebar');
  const details = document.getElementById('servicesDetails');

  if (!sidebar || !details) return;

  // Render sidebar
  let sidebarHtml = `<div class="flex admin-flex-col gap-16">`;
  Object.entries(servicios).forEach(([key, service]) => {
    const isActive = key === currentServiceKey ? 'active' : '';
    sidebarHtml += `
      <div onclick="selectService('${escapeHtml(key)}')" class="admin-service-item ${isActive}">
        ${escapeHtml(service.nombre)}
      </div>
    `;
  });
  sidebarHtml += `</div>
    <button onclick="addServiceModal()" class="admin-btn-success w-full" style="margin-top: 16px;">+ Nuevo Servicio</button>`;
  sidebar.innerHTML = sidebarHtml;

  // Render details
  if (!currentServiceKey || !servicios[currentServiceKey]) {
    details.innerHTML = '<p style="color: var(--concrete-700);">Selecciona un servicio para ver detalles</p>';
    return;
  }

  const service = servicios[currentServiceKey];
  let detailsHtml = `
    <div class="flex admin-flex-col gap-20">
      <h4 style="font-size: 20px; font-weight: 900; margin: 0; color: var(--navy-900);">${escapeHtml(service.nombre)}</h4>
      <p style="color: var(--concrete-700); margin: 0; font-size: 14px;">${escapeHtml(service.descripcion)}</p>

      <div style="margin: 0; padding: 12px; background: var(--concrete-50); border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" ${service.medible ? 'checked' : ''} onchange="toggleMedible('${escapeHtml(currentServiceKey)}')" style="width: 18px; height: 18px;">
          <span style="font-weight: 600;">¿Es medible? (se puede calcular por m²)</span>
        </label>
      </div>

      <div>
        <h5 style="font-weight: 700; margin: 0 0 16px; color: var(--navy-900);">Materiales utilizados:</h5>
  `;

  if (Object.keys(service.materiales).length === 0) {
    detailsHtml += '<p style="color: var(--concrete-700); font-size: 14px;">Sin materiales asignados</p>';
  } else {
    detailsHtml += '<div class="flex admin-flex-col gap-12">';
    Object.entries(service.materiales).forEach(([matKey, matQty]) => {
      const mat = materiales[matKey];
      if (!mat) return;

      const totalPrice = mat.precio_unitario;
      detailsHtml += `
        <div style="padding: 12px; background: var(--concrete-50); border-left: 3px solid var(--yellow-500); border-radius: 6px;">
          <div class="admin-flex-between">
            <div>
              <div style="font-weight: 700; color: var(--navy-900); margin-bottom: 6px;">${escapeHtml(mat.nombre)}</div>
              <div style="font-size: 13px; color: var(--concrete-700);">
                ${matQty.cantidad_por_m2} ${escapeHtml(mat.unidad)}/m² • $${totalPrice.toFixed(2)}/${escapeHtml(mat.unidad)}
              </div>
            </div>
            <button onclick="removeMaterialFromService('${escapeHtml(currentServiceKey)}', '${escapeHtml(matKey)}')" class="admin-btn-danger">Quitar</button>
          </div>
        </div>
      `;
    });
    detailsHtml += '</div>';
  }

  detailsHtml += `
      </div>
      <button onclick="addMaterialToServiceModal('${escapeHtml(currentServiceKey)}')" class="admin-btn-primary w-full">+ Agregar Material</button>
    </div>
  `;

  details.innerHTML = detailsHtml;
}

function selectService(key) {
  currentServiceKey = key;
  renderServicesTab();
}

function toggleMedible(key) {
  servicios[key].medible = !servicios[key].medible;
  saveMateriales();
  renderServicesTab();
}

function addServiceModal() {
  const nombre = prompt('Nombre del nuevo servicio:');
  if (!nombre || nombre.trim() === '') return;

  const key = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  if (servicios[key]) {
    alert('Este servicio ya existe');
    return;
  }

  servicios[key] = {
    nombre: nombre.trim(),
    descripcion: '',
    medible: true,
    materiales: {}
  };

  saveMateriales();
  currentServiceKey = key;
  renderServicesTab();
  alert('✓ Servicio creado');
}

function addMaterialToServiceModal(serviceKey) {
  const service = servicios[serviceKey];

  // Create list of available materials
  let options = Object.entries(materiales)
    .filter(([key]) => !service.materiales[key])
    .map(([key, mat]) => `${key}|${mat.nombre}`)
    .join('\n');

  if (!options) {
    alert('Todos los materiales ya están asignados a este servicio');
    return;
  }

  const selected = prompt(`Selecciona un material para agregar:\n\n${options.split('\n').map(opt => opt.split('|')[1]).join('\n')}`);

  if (!selected || selected.trim() === '') return;

  // Find the selected material key
  let selectedKey = null;
  Object.entries(materiales).forEach(([key, mat]) => {
    if (mat.nombre === selected && !service.materiales[key]) {
      selectedKey = key;
    }
  });

  if (!selectedKey) {
    alert('Material no encontrado');
    return;
  }

  const quantity = parseFloat(prompt(`Cantidad por m² de ${selected}:`));
  if (isNaN(quantity) || quantity <= 0) {
    alert('Error: ingresa una cantidad válida');
    return;
  }

  service.materiales[selectedKey] = { cantidad_por_m2: quantity };
  saveMateriales();
  renderServicesTab();
  alert('✓ Material agregado al servicio');
}

function removeMaterialFromService(serviceKey, materialKey) {
  const mat = materiales[materialKey];
  if (!confirm(`¿Remover "${mat.nombre}" de este servicio?`)) return;

  delete servicios[serviceKey].materiales[materialKey];
  saveMateriales();
  renderServicesTab();
}

// ============ CALCULATOR TAB ============

function renderCalculatorTab() {
  const container = document.getElementById('calculatorTabContent');
  if (!container) return;

  // Build dropdown with medible services only
  let servicesOptions = '<option value="">Selecciona un servicio...</option>';
  Object.entries(servicios).forEach(([key, service]) => {
    if (service.medible) {
      servicesOptions += `<option value="${key}">${escapeHtml(service.nombre)}</option>`;
    }
  });

  let html = `
    <div class="admin-calc-grid">
      <div class="admin-calc-form">
        <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px; height: fit-content;">
          <h3 style="font-size: 20px; font-weight: 900; margin: 0 0 24px; color: var(--navy-900);">Generar Presupuesto</h3>

          <div class="admin-mb-20">
            <label style="display: block; font-weight: 700; font-size: 13px; text-transform: uppercase; color: var(--navy-700); margin-bottom: 8px;">Tipo de servicio</label>
            <select id="calcServiceSelect" onchange="onCalcServiceChange()" style="width: 100%; padding: 12px 14px; border: 1.5px solid var(--concrete-200); border-radius: 8px; font-size: 15px; font-weight: 500; background: var(--concrete-50);">
              ${servicesOptions}
            </select>
          </div>

          <div class="admin-mb-32">
            <label style="display: block; font-weight: 700; font-size: 13px; text-transform: uppercase; color: var(--navy-700); margin-bottom: 8px;">Área (m²)</label>
            <input type="number" id="calcAreaInput" placeholder="30" min="1" step="0.5" onchange="calculateBudget()" style="width: 100%; padding: 12px 14px; border: 1.5px solid var(--concrete-200); border-radius: 8px; font-size: 15px; font-weight: 500; background: var(--concrete-50);">
          </div>

          <div class="admin-btn-row">
            <button onclick="resetCalculator()" class="admin-btn-secondary admin-w-full">Limpiar</button>
          </div>
        </div>
      </div>

      <div id="calcResults" class="admin-calc-results"></div>
    </div>
  `;

  container.innerHTML = html;
}

function onCalcServiceChange() {
  document.getElementById('calcAreaInput').value = '';
  document.getElementById('calcResults').innerHTML = '';
}

function calculateBudget() {
  const serviceKey = document.getElementById('calcServiceSelect').value;
  const area = parseFloat(document.getElementById('calcAreaInput').value) || 0;

  if (!serviceKey || area <= 0) {
    document.getElementById('calcResults').innerHTML = '';
    return;
  }

  const service = servicios[serviceKey];
  const resultados = {};
  let totalCosto = 0;

  Object.entries(service.materiales).forEach(([matKey, matQty]) => {
    const mat = materiales[matKey];
    const cantidad = matQty.cantidad_por_m2 * area;
    const costo = cantidad * mat.precio_unitario;

    resultados[matKey] = {
      nombre: mat.nombre,
      cantidad,
      unidad: mat.unidad,
      precio_unitario: mat.precio_unitario,
      costo
    };

    totalCosto += costo;
  });

  // Save for export
  currentCalcData = {
    servicio: service.nombre,
    area,
    materiales: resultados,
    total: totalCosto
  };

  // Render results
  // TODO: Migrate inline styles in material rows and budget rows to CSS classes
  // (lines 419-426, 436-451) for consistency with rest of refactor
  let html = `
      <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px;">
        <h4 style="font-size: 18px; font-weight: 900; margin: 0 0 20px; color: var(--navy-900);">📋 Materiales necesarios</h4>
        <div class="admin-flex admin-flex-col admin-gap-12">
  `;

  Object.values(resultados).forEach(mat => {
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--concrete-50); border-left: 3px solid var(--yellow-500); border-radius: 6px;">
        <div style="font-weight: 600; font-size: 14px; color: var(--ink);">${escapeHtml(mat.nombre)}</div>
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <span style="font-weight: 900; font-size: 16px; color: var(--navy-900);">${mat.cantidad.toFixed(2)}</span>
          <span style="font-size: 12px; color: var(--concrete-700); font-weight: 600;">${escapeHtml(mat.unidad)}</span>
        </div>
      </div>
    `;
  });

  html += `
        </div>
      </div>

      <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px;">
        <h4 style="font-size: 18px; font-weight: 900; margin: 0 0 20px; color: var(--navy-900);">💰 Presupuesto estimado</h4>
        <div class="admin-flex admin-flex-col admin-gap-12">
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--concrete-100);">
            <span style="color: var(--concrete-700); font-weight: 500;">Servicio</span>
            <span style="font-weight: 700; color: var(--navy-900);">${escapeHtml(service.nombre)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--concrete-100);">
            <span style="color: var(--concrete-700); font-weight: 500;">Área</span>
            <span style="font-weight: 700; color: var(--navy-900);">${area} m²</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0;">
            <span style="color: var(--concrete-700); font-weight: 500;">Costo por m²</span>
            <span style="font-weight: 700; color: var(--navy-900);">$${(totalCosto / area).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid var(--yellow-500); margin-top: 8px;">
            <span style="color: var(--navy-900); font-weight: 700;">Total estimado</span>
            <span style="font-weight: 900; font-size: 20px; color: var(--yellow-600);">$${totalCosto.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px;">
        <h4 style="font-size: 18px; font-weight: 900; margin: 0 0 16px; color: var(--navy-900);">Descargar</h4>
        <div class="admin-btn-row">
          <button onclick="downloadBudgetPDF()" class="admin-btn-primary admin-w-full">📄 Descargar PDF</button>
          <button onclick="shareBudget()" class="admin-btn-primary admin-w-full">🔗 Compartir</button>
        </div>
      </div>
  `;

  document.getElementById('calcResults').innerHTML = html;
}

function resetCalculator() {
  document.getElementById('calcServiceSelect').value = '';
  document.getElementById('calcAreaInput').value = '';
  document.getElementById('calcResults').innerHTML = '';
  currentCalcData = null;
}

async function downloadBudgetPDF() {
  if (!currentCalcData) {
    alert('Por favor realiza un cálculo primero');
    return;
  }

  if (!window.jspdf) {
    try {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
      });
    } catch (e) {
      alert('Error al cargar la librería PDF');
      return;
    }
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = {
    ...currentCalcData,
    fecha: new Date().toLocaleString('es-MX'),
    empresa: 'RISA Multiservicios',
    contacto: '662 121 0904'
  };

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('RISA Multiservicios', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Presupuesto de Materiales', margin, yPosition);
  yPosition += 8;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Info section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Información del Presupuesto:', margin, yPosition);
  yPosition += 6;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const info = [
    `Fecha: ${data.fecha}`,
    `Servicio: ${data.servicio}`,
    `Área: ${data.area} m²`,
    `Contacto: ${data.contacto}`
  ];

  info.forEach(line => {
    doc.text(line, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 4;

  // Materials section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Materiales Necesarios:', margin, yPosition);
  yPosition += 6;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  doc.setFont(undefined, 'bold');
  doc.text('Material', margin + 5, yPosition);
  doc.text('Cantidad', margin + 90, yPosition);
  doc.text('Unidad', margin + 130, yPosition);
  doc.text('P. Unitario', margin + 160, yPosition);
  yPosition += 5;

  doc.setFont(undefined, 'normal');
  Object.entries(data.materiales).forEach(([key, material]) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.text(material.nombre, margin + 5, yPosition);
    doc.text(material.cantidad.toFixed(2), margin + 90, yPosition);
    doc.text(material.unidad, margin + 130, yPosition);
    doc.text(`$${material.precio_unitario.toFixed(2)}`, margin + 160, yPosition);
    yPosition += 5;
  });

  yPosition += 6;

  // Summary section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Resumen:', margin, yPosition);
  yPosition += 6;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const total = data.total;
  const costPerM2 = total / data.area;

  doc.text(`Costo total de materiales: $${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`Costo por m²: $${costPerM2.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, margin + 5, yPosition);

  // Footer
  doc.setFontSize(7);
  doc.setFont(undefined, 'italic');
  doc.text('Este presupuesto está basado en estándares de construcción mexicana.', margin, pageHeight - 10);

  const filename = `presupuesto-${data.servicio.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}

function shareBudget() {
  if (!currentCalcData) {
    alert('Por favor realiza un cálculo primero');
    return;
  }

  const data = currentCalcData;
  const text = `Presupuesto RISA - ${data.servicio}\nÁrea: ${data.area} m²\nTotal: $${data.total.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;

  if (navigator.share) {
    navigator.share({
      title: 'Presupuesto RISA Multiservicios',
      text: text,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    alert('Opción de compartir no disponible en tu dispositivo. Usa descargar PDF en su lugar.');
  }
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', async () => {
  await loadMateriales();
  loadCustomData();

  // Set first service as current
  const firstService = Object.keys(servicios)[0];
  if (firstService) {
    currentServiceKey = firstService;
  }

  // Modal handlers
  const modal = document.getElementById('editMaterialModal');
  if (modal) {
    // Close modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeMaterialModal();
      }
    });

    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeMaterialModal();
      }
    });
  }

  // Render all tabs
  renderMaterialsTab();
  renderServicesTab();
  renderCalculatorTab();
});
