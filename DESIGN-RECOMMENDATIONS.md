# RISA Multiservicios - Recomendaciones de Diseño UI/UX

**Generado con:** UI/UX Pro Max Skill
**Fecha:** Mayo 23, 2026
**Estado:** Propuesta de Mejoras

---

## 📊 Resumen Ejecutivo

El diseño actual de RISA es **sólido y profesional**, pero tiene oportunidades de mejora en:
- Consistencia visual (grid de servicios)
- Experiencia en calculadora (flujo de usuario)
- Admin panel (usabilidad y seguridad visual)
- Componentes adicionales (testimonios, FAQ, galería)

**Prioridad:** Alta → Media → Baja (detalles)

---

## 1️⃣ LANDING PAGE (index.html)

### ✅ Fortalezas Actuales
- Hero section fuerte con tagline claro
- 9 servicios bien organizados
- Llamadas a acción prominentes
- Footer informativo

### ⚠️ Áreas de Mejora

#### 1.1 Grid de Servicios
**Patrón Recomendado:** Bento Box Grid (Apple-style)

**Cambios Sugeridos:**
```
ACTUAL: Grid uniforme 3 columnas
PROPUESTO: Bento Grid - Tamaños variados
- Servicio destacado (2x2): "Multiservicios Residenciales"
- Servicios comunes (1x1): Los otros 8
```

**CSS/Componentes:**
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.service-card--featured {
  grid-column: span 2;
  grid-row: span 2;
}

/* Hover Effects */
.service-card {
  transition: transform 300ms, box-shadow 300ms;
  border-radius: 24px; /* Aumentar de 14px a 24px */
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(15, 30, 74, 0.15);
}
```

**Checklist:**
- [ ] Cambiar border-radius de servicios a 24px
- [ ] Implementar grid responsivo (4 cols → 2 → 1)
- [ ] Agregar animación de hover mejorada
- [ ] Añadir sombras más suaves en reposo

---

#### 1.2 Testimonios (NUEVO COMPONENTE)
**¿Por qué?** Construye confianza. Especialmente importante para servicios.

**Propuesta:**
```html
<section class="testimonials">
  <div class="testimonials-grid">
    <div class="testimonial-card">
      <div class="stars">★★★★★</div>
      <p>"Excelente servicio. El equipo fue puntual y profesional."</p>
      <div class="author">
        <img src="avatar.jpg" class="avatar" />
        <div>
          <div class="name">María González</div>
          <div class="service">Plomería</div>
        </div>
      </div>
    </div>
    <!-- 3-4 testimonios más -->
  </div>
</section>
```

**Estilo:** Cards minimalistas (borde gris, padding 24px, rounded 16px)

---

#### 1.3 Sección "¿Por qué elegirnos?" - Mejoras Visuales

**Cambios:**
- Aumentar iconografía (agregar emojis o íconos SVG)
- Cards con número más prominent (actualmente tiene opacidad)
- Mejor contraste en fondo (actualmente concreto-50)

```css
.why-card__num {
  font-size: 48px; /* Aumentar de 36px */
  font-weight: 900;
  color: var(--yellow-500);
  -webkit-text-stroke: 2px var(--ink); /* Aumentar de 1.5px */
}
```

---

#### 1.4 Botones - Consistencia Mejorada

**Cambios Propuestos:**
```css
/* Button actual: Muy pequeño (14px font) */
.btn {
  font-size: 14px;
  padding: 16px 28px;
}

/* Propuesto: Más visible, más impactante */
.btn {
  font-size: 15px;
  padding: 18px 32px;
  letter-spacing: 0.05em; /* Aumentar de 0.04em */
  font-weight: 900; /* Ya es 800, mejor 900 */
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(217, 119, 6, 0.25);
}
```

---

## 2️⃣ CALCULADORA (calculadora.html)

### ✅ Fortalezas
- Interfaz clara y organizada
- Cálculos en tiempo real
- Presupuesto visible

### ⚠️ Áreas de Mejora

#### 2.1 Flujo de Usuario - Optimización

**Problema:** El usuario debe:
1. Seleccionar servicio (dropdown)
2. Ingresar área (input)
3. Scroll para ver resultados

**Solución Propuesta:** Sticky panel derecho
```css
.calc-form {
  position: sticky;
  top: 100px; /* Bajo el header */
  height: fit-content;
}

/* En móvil: Cambiar a layout vertical */
@media (max-width: 900px) {
  .calc-layout {
    grid-template-columns: 1fr; /* Apilado */
  }
  
  .calc-form {
    position: static; /* No sticky en móvil */
  }
}
```

#### 2.2 Resultados - Mejor Jerarquía Visual

**Cambios:**
```css
/* Hacer más visible el total */
.summary-row:last-child .value {
  font-size: 28px; /* Aumentar de 22px */
  color: var(--yellow-600);
  font-weight: 900;
}

/* Agregar animación de entrada */
.result-card {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 2.3 Materiales - Mejorar Presentación

**Propuesto:** Mostrar cantidad en color más destacado

```css
.material-item__value {
  font-size: 18px; /* Aumentar de 16px */
  font-weight: 900;
  color: var(--navy-900);
  background: rgba(251, 191, 36, 0.1); /* Fondo suave */
  padding: 4px 8px;
  border-radius: 6px;
}
```

#### 2.4 Acción "Descargar JSON" - Mejorar UX

**Problema:** Botón poco visible, flujo no claro

**Solución:**
```html
<!-- ANTES: Está dentro de un card poco visible -->
<div id="actionsContainer">
  <button class="btn-download">📥 JSON</button>
  <button class="btn-print">🖨️ Imprimir</button>
</div>

<!-- DESPUÉS: Sticky bottom con más visibilidad -->
<div class="calc-actions-sticky">
  <button class="btn btn-primary">💾 Guardar presupuesto</button>
  <button class="btn btn-outline">🖨️ Imprimir</button>
  <button class="btn btn-outline">📧 Enviar por email</button>
</div>
```

---

## 3️⃣ ADMIN PANEL (admin.html)

### ✅ Fortalezas
- Seguridad (login requerido)
- Interfaz clara con tabs
- Guardar/Exportar/Importar

### ⚠️ Áreas de Mejora

#### 3.1 Tabla de Materiales - Mejor Usabilidad

**Problema:** Tabla muy amplia, inputs difíciles de editar

**Solución 1: Card Layout para móvil**
```css
@media (max-width: 768px) {
  .material-table {
    display: grid;
    grid-template-columns: 1fr;
  }
  
  .material-table tbody {
    display: contents;
  }
  
  .material-table tr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--concrete-200);
    border-radius: 8px;
    margin-bottom: 12px;
  }
}
```

#### 3.2 Login - Mejor Feedback Visual

**Cambios:**
```css
/* Agregar validación visual */
.login-field input:focus {
  outline: none;
  border-color: var(--yellow-500);
  background: rgba(255,255,255,0.15);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
}

/* Agregar eye icon para mostrar/ocultar contraseña */
.login-field {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--yellow-500);
}
```

#### 3.3 Tabs - Mejor Navegación

**Propuesto:** Scroll horizontal visible en móvil
```css
.admin-tabs {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scroll iOS */
  scroll-behavior: smooth;
  
  /* Mostrar scroll indicator */
  scrollbar-width: thin;
  scrollbar-color: var(--yellow-500) transparent;
}
```

#### 3.4 Restaurar Predeterminados - Agregar Confirmación Visual

**Cambio:** Modal de confirmación con timer
```html
<div class="confirm-modal">
  <h3>¿Restaurar predeterminados?</h3>
  <p>Esta acción no se puede deshacer.</p>
  <p class="timer">La confirmación se cancela en <span id="timer">10</span>s</p>
  <button onclick="confirmReset()">Sí, restaurar</button>
  <button onclick="cancelReset()">Cancelar</button>
</div>
```

---

## 4️⃣ NUEVOS COMPONENTES RECOMENDADOS

### 4.1 FAQ Section (Landing Page)
**¿Por qué?** Reduce fricción de contacto, mejora SEO

```html
<section class="faq-section">
  <h2>Preguntas Frecuentes</h2>
  
  <details class="faq-item">
    <summary>¿Cuál es el horario de atención?</summary>
    <p>Lun-Sáb 8:00-19:00, Emergencias 24h</p>
  </details>
  
  <details class="faq-item">
    <summary>¿Ofrecen garantía?</summary>
    <p>Sí, todos nuestros trabajos están garantizados...</p>
  </details>
</section>
```

### 4.2 Galería de Trabajos (Landing Page)
**¿Por qué?** Demuestra experiencia visualmente

```html
<section class="gallery-section">
  <h2>Trabajos Realizados</h2>
  <div class="gallery-grid">
    <img src="trabajo-1.jpg" alt="Instalación plomería" />
    <img src="trabajo-2.jpg" alt="Pintura residencial" />
    <!-- ... -->
  </div>
</section>
```

### 4.3 Comparador de Servicios (Nuevo)
**¿Por qué?** Ayuda a clientes a elegir servicios

```html
<section class="service-comparison">
  <table>
    <thead>
      <tr>
        <th>Servicio</th>
        <th>Costo Aprox.</th>
        <th>Tiempo</th>
        <th>Garantía</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Plomería</td>
        <td>$500-1500</td>
        <td>2-4h</td>
        <td>1 año</td>
      </tr>
    </tbody>
  </table>
</section>
```

### 4.4 "Antes y Después" Slider (Landing Page)
**¿Por qué?** Impactante, mejora conversiones

```html
<div class="before-after-slider">
  <img src="antes.jpg" alt="Antes" class="before-image" />
  <img src="despues.jpg" alt="Después" class="after-image" />
  <input type="range" class="slider-handle" />
</div>
```

---

## 5️⃣ MEJORAS GENERALES

### 5.1 Paleta de Colores - Propuesta
**Actual:** Navy + Yellow + Concrete (muy bien)
**Propuesta:** Agregar verde para éxito/garantía

```css
:root {
  /* Existentes: mantener */
  --navy-900: #0f1e4a;
  --yellow-500: #fbbf24;
  
  /* NUEVOS para mejor contexto */
  --success: #10b981; /* Verde para garantía */
  --warning: #f59e0b; /* Naranja para urgencia */
  --error: #ef4444;   /* Rojo para alertas */
  
  /* Mejora: Añadir gradientes */
  --gradient-hero: linear-gradient(135deg, #0f1e4a 0%, #1e3a8a 100%);
}
```

### 5.2 Animaciones - Consistencia

Todas las transiciones deben usar:
```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 5.3 Tipografía - Mejoras

Considerar Google Fonts para variedad:
```css
/* Mantener Montserrat, agregar serif para destacados */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');

.section-title {
  font-family: 'Merriweather', serif; /* Para secciones importantes */
}
```

### 5.4 Accesibilidad - Mejoras

Añadir:
```css
/* Skip to main content link */
.skip-to-main {
  position: absolute;
  left: -9999px;
}

.skip-to-main:focus {
  position: static;
  background: var(--yellow-500);
  padding: 8px;
}

/* Focus visible para navegación */
a:focus-visible, button:focus-visible {
  outline: 3px solid var(--yellow-500);
  outline-offset: 2px;
}
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **Fase 1 (URGENTE) - Semana 1**
- [ ] Bento Grid para servicios
- [ ] Mejora de hover effects (botones, cards)
- [ ] Optimizar tabla de admin para móvil

### **Fase 2 (IMPORTANTE) - Semana 2**
- [ ] Agregar testimonios
- [ ] Mejorar calculadora (sticky form)
- [ ] FAQ section

### **Fase 3 (NICE-TO-HAVE) - Semana 3-4**
- [ ] Galería de trabajos
- [ ] Before/After slider
- [ ] Comparador de servicios

---

## 🎯 Métricas de Éxito

Medir después de implementar:
- **CTR (Click-Through Rate):** Objetivo +15% en botones principales
- **Time on Page:** Objetivo +20% en calculadora
- **Mobile Experience:** Score Lighthouse +10 puntos
- **Conversión:** +10% en leads desde calculadora

---

## 📞 Próximos Pasos

1. **Revisar recomendaciones** con cliente
2. **Priorizar cambios** según impacto
3. **Implementar Fase 1** en paralelo
4. **A/B testing** en cambios mayores
5. **Monitorear métricas** post-implementación

---

*Análisis generado con UI/UX Pro Max Skill*
*Contiene: 67 estilos UI, 161 reglas de razonamiento, patrones de UX*
