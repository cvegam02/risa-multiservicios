let servicios = {};
let materialesCustom = {};

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
    const data = await response.json();
    servicios = data.servicios;
    materialesCustom = JSON.parse(JSON.stringify(data.servicios)); // Copia profunda
  } catch (error) {
    console.error('Error cargando materiales:', error);
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

  // Inicializar sección de configuración
  buildConfigTabs();
}

// Construir tabs de configuración
function buildConfigTabs() {
  const tabsContainer = document.getElementById('configTabs');
  const contentsContainer = document.getElementById('configContents');

  tabsContainer.innerHTML = '';
  contentsContainer.innerHTML = '';

  let isFirst = true;
  Object.entries(materialesCustom).forEach(([serviceKey, servicio]) => {
    // Tab button
    const tabBtn = document.createElement('button');
    tabBtn.className = `config-tab ${isFirst ? 'active' : ''}`;
    tabBtn.textContent = servicio.nombre;
    tabBtn.onclick = () => switchConfigTab(serviceKey);
    tabsContainer.appendChild(tabBtn);

    // Tab content
    const contentDiv = document.createElement('div');
    contentDiv.className = `config-content ${isFirst ? 'active' : ''}`;
    contentDiv.id = `config-${serviceKey}`;

    const tableHTML = `
      <table class="material-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Cantidad/m²</th>
            <th>Unidad</th>
            <th>Precio unitario</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(servicio.materiales).map(([materialKey, material]) => `
            <tr>
              <td>${material.nombre}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value="${material.cantidad_por_m2}"
                  data-service="${serviceKey}"
                  data-material="${materialKey}"
                  data-field="cantidad_por_m2"
                />
              </td>
              <td>${material.unidad}</td>
              <td>
                <input
                  type="number"
                  value="${material.precio_unitario}"
                  data-service="${serviceKey}"
                  data-material="${materialKey}"
                  data-field="precio_unitario"
                />
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    contentDiv.innerHTML = tableHTML;
    contentsContainer.appendChild(contentDiv);

    isFirst = false;
  });
}

// Cambiar tab de configuración
function switchConfigTab(serviceKey) {
  // Desactivar todos los tabs y contenidos
  document.querySelectorAll('.config-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.config-content').forEach(content => content.classList.remove('active'));

  // Activar seleccionado
  event.target.classList.add('active');
  document.getElementById(`config-${serviceKey}`).classList.add('active');
}

// Toggle configuración
function toggleConfig() {
  const body = document.querySelector('.config-body');
  const toggle = document.querySelector('.config-toggle');
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

// Guardar configuración
function saveConfigSettings() {
  const inputs = document.querySelectorAll('.material-table input');

  inputs.forEach(input => {
    const serviceKey = input.dataset.service;
    const materialKey = input.dataset.material;
    const field = input.dataset.field;
    const value = parseFloat(input.value);

    if (materialesCustom[serviceKey] && materialesCustom[serviceKey].materiales[materialKey]) {
      materialesCustom[serviceKey].materiales[materialKey][field] = value;
    }
  });

  localStorage.setItem('risaMateriales', JSON.stringify(materialesCustom));
  calculate();
  alert('✓ Configuración guardada correctamente');
}

// Exportar configuración
function exportConfig() {
  const dataStr = JSON.stringify(materialesCustom, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `risa-config-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Importar configuración
function triggerImport() {
  document.getElementById('importInput').click();
}

function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      materialesCustom = imported;
      localStorage.setItem('risaMateriales', JSON.stringify(materialesCustom));
      buildConfigTabs();
      calculate();
      alert('✓ Configuración cargada correctamente');
    } catch (error) {
      alert('❌ Error al cargar el archivo. Verifica que sea un JSON válido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Restaurar predeterminados
function resetConfigToDefaults() {
  if (confirm('¿Restaurar todos los valores por defecto? Esta acción no se puede deshacer.')) {
    localStorage.removeItem('risaMateriales');
    location.reload();
  }
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
            <div class="material-item__name">${material.nombre}</div>
            <div class="material-item__qty">
              <span class="material-item__value">${material.cantidad.toFixed(2)}</span>
              <span class="material-item__unit">${material.unidad}</span>
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
        <span class="value">${nombreServicio}</span>
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
      console.error('Error cargando configuración guardada:', error);
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

// Descargar como JSON
function downloadJSON() {
  if (!window.currentCalcData) {
    alert('Por favor realiza un cálculo primero');
    return;
  }

  const data = {
    ...window.currentCalcData,
    fecha: new Date().toLocaleString('es-MX'),
    empresa: 'RISA Multiservicios',
    contacto: '662 121 0904'
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `presupuesto-${data.servicio.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
