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

async function loadMateriales() {
  try {
    const response = await fetch('materiales.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    materiales = data.materiales || {};
    servicios = data.servicios || {};
  } catch (error) {
    console.error('Error loading materials:', error);
    materiales = {};
    servicios = {};
  }
}

function saveMateriales() {
  const data = { materiales, servicios };
  localStorage.setItem('risaMateriales', JSON.stringify(data));
}

function loadCustomData() {
  const saved = localStorage.getItem('risaMateriales');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      materiales = data.materiales || materiales;
      servicios = data.servicios || servicios;
    } catch (error) {
      console.error('Error loading custom data:', error);
    }
  }
}

// ============ MATERIALS TAB ============

function renderMaterialsTab() {
  const container = document.getElementById('materialsTabContent');
  if (!container) return;

  let html = `
    <div class="material-table">
  `;

  Object.entries(materiales).forEach(([key, mat]) => {
    html += `
      <div class="material-row">
        <div class="flex-between">
          <div>
            <div class="material-name">${escapeHtml(mat.nombre)}</div>
            <div class="material-meta">${escapeHtml(mat.unidad)} • $${mat.precio_unitario.toFixed(2)}</div>
          </div>
          <div class="btn-row">
            <button onclick="editMaterialModal('${escapeHtml(key)}')" class="btn-primary">Editar</button>
            <button onclick="deleteMaterial('${escapeHtml(key)}')" class="btn-danger">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <button onclick="addMaterialModal()" class="btn-success w-full">+ Agregar Material</button>
  `;

  container.innerHTML = html;
}

function editMaterialModal(key) {
  const mat = materiales[key];
  const newPrice = prompt(`Editar precio de "${mat.nombre}":\n\nPrecio actual: $${mat.precio_unitario}`, mat.precio_unitario);

  if (newPrice !== null && newPrice.trim() !== '') {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      materiales[key].precio_unitario = price;
      saveMateriales();
      renderMaterialsTab();
      renderServicesTab();
      alert('✓ Precio actualizado');
    } else {
      alert('Error: ingresa un precio válido');
    }
  }
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
  let sidebarHtml = `<div class="flex flex-col gap-16">`;
  Object.entries(servicios).forEach(([key, service]) => {
    const isActive = key === currentServiceKey ? 'active' : '';
    sidebarHtml += `
      <div onclick="selectService('${escapeHtml(key)}')" class="service-item ${isActive}">
        ${escapeHtml(service.nombre)}
      </div>
    `;
  });
  sidebarHtml += `</div>
    <button onclick="addServiceModal()" class="btn-success w-full" style="margin-top: 16px;">+ Nuevo Servicio</button>`;
  sidebar.innerHTML = sidebarHtml;

  // Render details
  if (!currentServiceKey || !servicios[currentServiceKey]) {
    details.innerHTML = '<p style="color: var(--concrete-700);">Selecciona un servicio para ver detalles</p>';
    return;
  }

  const service = servicios[currentServiceKey];
  let detailsHtml = `
    <div class="flex flex-col gap-20">
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
    detailsHtml += '<div class="flex flex-col gap-12">';
    Object.entries(service.materiales).forEach(([matKey, matQty]) => {
      const mat = materiales[matKey];
      if (!mat) return;

      const totalPrice = mat.precio_unitario;
      detailsHtml += `
        <div style="padding: 12px; background: var(--concrete-50); border-left: 3px solid var(--yellow-500); border-radius: 6px;">
          <div class="flex-between">
            <div>
              <div style="font-weight: 700; color: var(--navy-900); margin-bottom: 6px;">${escapeHtml(mat.nombre)}</div>
              <div style="font-size: 13px; color: var(--concrete-700);">
                ${matQty.cantidad_por_m2} ${escapeHtml(mat.unidad)}/m² • $${totalPrice.toFixed(2)}/${escapeHtml(mat.unidad)}
              </div>
            </div>
            <button onclick="removeMaterialFromService('${escapeHtml(currentServiceKey)}', '${escapeHtml(matKey)}')" class="btn-danger">Quitar</button>
          </div>
        </div>
      `;
    });
    detailsHtml += '</div>';
  }

  detailsHtml += `
      </div>
      <button onclick="addMaterialToServiceModal('${escapeHtml(currentServiceKey)}')" class="btn-primary w-full">+ Agregar Material</button>
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
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;">
      <div>
        <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px; height: fit-content; position: sticky; top: 120px;">
          <h3 style="font-size: 20px; font-weight: 900; margin: 0 0 24px; color: var(--navy-900);">Generar Presupuesto</h3>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 700; font-size: 13px; text-transform: uppercase; color: var(--navy-700); margin-bottom: 8px;">Tipo de servicio</label>
            <select id="calcServiceSelect" onchange="onCalcServiceChange()" style="width: 100%; padding: 12px 14px; border: 1.5px solid var(--concrete-200); border-radius: 8px; font-size: 15px; font-weight: 500; background: var(--concrete-50);">
              ${servicesOptions}
            </select>
          </div>

          <div style="margin-bottom: 32px;">
            <label style="display: block; font-weight: 700; font-size: 13px; text-transform: uppercase; color: var(--navy-700); margin-bottom: 8px;">Área (m²)</label>
            <input type="number" id="calcAreaInput" placeholder="30" min="1" step="0.5" onchange="calculateBudget()" style="width: 100%; padding: 12px 14px; border: 1.5px solid var(--concrete-200); border-radius: 8px; font-size: 15px; font-weight: 500; background: var(--concrete-50);">
          </div>

          <div style="display: flex; gap: 12px;">
            <button onclick="resetCalculator()" style="flex: 1; padding: 12px; background: var(--concrete-100); color: var(--ink); border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Limpiar</button>
          </div>
        </div>
      </div>

      <div id="calcResults"></div>
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
  let html = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="background: var(--white); border: 1px solid var(--concrete-100); border-radius: 14px; padding: 28px;">
        <h4 style="font-size: 18px; font-weight: 900; margin: 0 0 20px; color: var(--navy-900);">📋 Materiales necesarios</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
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
        <div style="display: flex; flex-direction: column; gap: 12px;">
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
        <div style="display: flex; gap: 12px;">
          <button onclick="downloadBudgetPDF()" style="flex: 1; padding: 12px; background: var(--navy-900); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">📄 Descargar PDF</button>
          <button onclick="shareBudget()" style="flex: 1; padding: 12px; background: var(--navy-700); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">🔗 Compartir</button>
        </div>
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

  // Render all tabs
  renderMaterialsTab();
  renderServicesTab();
  renderCalculatorTab();
});
