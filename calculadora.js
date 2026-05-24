let servicios = {};
let materialesCustom = {};

// Escape HTML special characters to prevent XSS
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

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', async () => {
  await loadMateriales();
  initializeCalculator();
  loadCustomSettings();
});

// Cargar datos de materiales.json
async function loadMateriales() {
  try {
    const response = await fetch('materiales.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    servicios = data.servicios;
    materialesCustom = JSON.parse(JSON.stringify(data.servicios)); // Copia profunda
  } catch (error) {
    servicios = {};
    materialesCustom = {};
  }
}

// Inicializar calculadora
function initializeCalculator() {
  const select = document.getElementById('serviceSelect');

  // Llenar dropdown de servicios
  Object.entries(servicios).forEach(([key, servicio]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = servicio.nombre;
    select.appendChild(option);
  });

  select.addEventListener('change', onServiceChange);
  document.getElementById('areaInput').addEventListener('input', calculate);
}

// Cambiar servicio
function onServiceChange() {
  const serviceKey = document.getElementById('serviceSelect').value;
  document.getElementById('extraParams').innerHTML = '';

  if (serviceKey) {
    calculate();
  } else {
    document.getElementById('resultsContainer').innerHTML = `
      <div style="text-align: center; color: var(--concrete-700);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 64px; height: 64px; margin: 0 auto 16px; opacity: 0.3;">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path>
        </svg>
        <p>Selecciona un servicio y área para calcular materiales</p>
      </div>
    `;
    document.getElementById('budgetContainer').style.display = 'none';
    document.getElementById('actionsContainer').style.display = 'none';
  }
}

// Calcular materiales
function calculate() {
  const serviceKey = document.getElementById('serviceSelect').value;
  const area = parseFloat(document.getElementById('areaInput').value) || 0;

  if (!serviceKey || area <= 0) {
    return;
  }

  // Usar materiales personalizados si existen, sino usar por defecto
  const materialsToUse = materialesCustom[serviceKey] || servicios[serviceKey];
  const servicioActual = materialsToUse;

  // Calcular materiales
  const resultados = {};
  let totalCosto = 0;

  Object.entries(servicioActual.materiales).forEach(([materialKey, material]) => {
    const cantidad = material.cantidad_por_m2 * area;
    const costo = cantidad * material.precio_unitario;

    resultados[materialKey] = {
      nombre: material.nombre,
      cantidad: cantidad,
      unidad: material.unidad,
      precio_unitario: material.precio_unitario,
      costo: costo
    };

    totalCosto += costo;
  });

  // Mostrar resultados
  displayResults(servicioActual.nombre, resultados, totalCosto, area);
}

// Mostrar resultados
function displayResults(nombreServicio, resultados, totalCosto, area) {
  const resultsHTML = `
    <div class="result-card">
      <h4>📋 Materiales necesarios</h4>
      <div class="materiales-list">
        ${Object.entries(resultados).map(([key, material]) => `
          <div class="material-item">
            <div class="material-item__name">${escapeHtml(material.nombre)}</div>
            <div class="material-item__qty">
              <span class="material-item__value">${material.cantidad.toFixed(2)}</span>
              <span class="material-item__unit">${escapeHtml(material.unidad)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const budgetHTML = `
    <div class="result-card">
      <h4>💰 Presupuesto estimado</h4>
      <div class="summary-row">
        <span class="label">Servicio</span>
        <span class="value">${escapeHtml(nombreServicio)}</span>
      </div>
      <div class="summary-row">
        <span class="label">Área</span>
        <span class="value">${area} m²</span>
      </div>
      <div class="summary-row">
        <span class="label">Costo de materiales</span>
        <span class="value">$${totalCosto.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="summary-row">
        <span class="label">Costo por m²</span>
        <span class="value">$${(totalCosto / area).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="summary-row">
        <span class="label">Total estimado</span>
        <span class="value">$${totalCosto.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </div>
    </div>
  `;

  document.getElementById('resultsContainer').innerHTML = resultsHTML;
  document.getElementById('budgetContainer').innerHTML = budgetHTML;
  document.getElementById('budgetContainer').style.display = 'block';
  document.getElementById('actionsContainer').style.display = 'block';

  // Guardar en sessionStorage para descargar
  window.currentCalcData = {
    servicio: nombreServicio,
    area: area,
    materiales: resultados,
    total: totalCosto
  };
}

// Abrir modal de configuración
function openSettings() {
  const modal = document.getElementById('settingsModal');
  const content = document.getElementById('settingsContent');

  content.innerHTML = '';

  Object.entries(materialesCustom).forEach(([serviceKey, servicio]) => {
    const groupHTML = document.createElement('div');
    groupHTML.className = 'settings-group';
    groupHTML.innerHTML = `<h4>${servicio.nombre}</h4>`;

    Object.entries(servicio.materiales).forEach(([materialKey, material]) => {
      const paramRow = document.createElement('div');
      paramRow.className = 'param-row';
      paramRow.innerHTML = `
        <label>${material.nombre}</label>
        <div style="display: flex; gap: 8px;">
          <input
            type="number"
            step="0.01"
            value="${material.cantidad_por_m2}"
            data-service="${serviceKey}"
            data-material="${materialKey}"
            data-field="cantidad_por_m2"
            style="flex: 1;"
          />
          <input
            type="number"
            value="${material.precio_unitario}"
            data-service="${serviceKey}"
            data-material="${materialKey}"
            data-field="precio_unitario"
            style="flex: 1;"
          />
        </div>
      `;
      groupHTML.appendChild(paramRow);
    });

    content.appendChild(groupHTML);
  });

  modal.classList.add('active');
}

// Cerrar modal
function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

// Guardar configuración personalizada en localStorage
function saveSettings() {
  const inputs = document.querySelectorAll('#settingsContent input');

  inputs.forEach(input => {
    const serviceKey = input.dataset.service;
    const materialKey = input.dataset.material;
    const field = input.dataset.field;
    const value = parseFloat(input.value);

    if (materialesCustom[serviceKey] && materialesCustom[serviceKey].materiales[materialKey]) {
      materialesCustom[serviceKey].materiales[materialKey][field] = value;
    }
  });

  // Guardar en localStorage
  localStorage.setItem('risaMateriales', JSON.stringify(materialesCustom));

  closeSettings();
  calculate(); // Recalcular con nuevos valores

  // Mostrar notificación
  alert('✓ Configuración guardada correctamente');
}

// Cargar configuración personalizada
function loadCustomSettings() {
  const saved = localStorage.getItem('risaMateriales');
  if (saved) {
    try {
      materialesCustom = JSON.parse(saved);
    } catch (error) {
      localStorage.removeItem('risaMateriales');
    }
  }
}

// Restaurar valores por defecto
function resetToDefaults() {
  if (confirm('¿Restaurar todos los valores por defecto?')) {
    localStorage.removeItem('risaMateriales');
    location.reload();
  }
}

// Descargar como PDF
async function downloadPDF() {
  if (!window.currentCalcData) {
    alert('Por favor realiza un cálculo primero');
    return;
  }

  // Cargar jsPDF si no está disponible
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

  if (!window.jspdf) {
    alert('Error: no se puede cargar la librería PDF. Intenta de nuevo.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = {
    ...window.currentCalcData,
    fecha: new Date().toLocaleString('es-MX'),
    empresa: 'RISA Multiservicios',
    contacto: '662 121 0904'
  };

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

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

  // Table headers
  doc.setFont(undefined, 'bold');
  doc.text('Material', margin + 5, yPosition);
  doc.text('Cantidad', margin + 90, yPosition);
  doc.text('Unidad', margin + 130, yPosition);
  doc.text('P. Unitario', margin + 160, yPosition);
  yPosition += 5;

  // Table content
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

  // Download
  const filename = `presupuesto-${data.servicio.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}

// Limpiar calculadora
function resetCalculator() {
  document.getElementById('serviceSelect').value = '';
  document.getElementById('areaInput').value = '';
  document.getElementById('extraParams').innerHTML = '';
  document.getElementById('resultsContainer').innerHTML = `
    <div style="text-align: center; color: var(--concrete-700);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 64px; height: 64px; margin: 0 auto 16px; opacity: 0.3;">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path>
      </svg>
      <p>Selecciona un servicio y área para calcular materiales</p>
    </div>
  `;
  document.getElementById('budgetContainer').style.display = 'none';
  document.getElementById('actionsContainer').style.display = 'none';
}

// Cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSettings();
  }
});
