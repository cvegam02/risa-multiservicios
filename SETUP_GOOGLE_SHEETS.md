# Setup Google Sheets para RISA Admin Panel

Este script crea automáticamente una Google Sheet con 3 hojas (sheets) y todas las columnas y datos necesarios.

## Requisitos

- Node.js instalado
- Cuenta de Google Cloud (gratis)
- Google Sheets API habilitada

## Pasos

### 1. Crear Google Cloud Project

1. Ir a https://console.cloud.google.com/
2. Crear un nuevo proyecto (nombre: "RISA" o lo que prefieras)
3. Esperar a que se cree

### 2. Habilitar Google Sheets API

1. En la consola, ir a "APIs y servicios" → "Biblioteca"
2. Buscar "Google Sheets API"
3. Hacer clic y habilitar

### 3. Crear Credenciales (Service Account)

1. Ir a "APIs y servicios" → "Credenciales"
2. Hacer clic en "Crear credenciales" → "Cuenta de servicio"
3. Llenar:
   - Nombre de la cuenta de servicio: `risa-admin`
   - Descripción: `Service account for RISA admin panel`
   - Hacer clic en "Crear y continuar"
4. Hacer clic en "Continuar" en los siguientes pasos (no es necesario configurar permisos)
5. Hacer clic en "Listo"

### 4. Crear JSON Key

1. En "Credenciales", bajo "Cuentas de servicio", hacer clic en el email de la cuenta que creaste
2. Ir a la pestaña "Claves"
3. Hacer clic en "Agregar clave" → "Crear nueva clave"
4. Seleccionar JSON y descargar
5. Guardar el archivo (ej: `google-credentials.json`) en la carpeta del proyecto

### 5. Instalar Google API Library

```bash
npm install googleapis
```

### 6. Ejecutar el Script

```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json node setup-google-sheets.js
```

El script:
- ✓ Crea una nueva Google Sheet
- ✓ Crea 3 hojas: Materiales, Servicios, Servicios-Materiales
- ✓ Llena todos los datos
- ✓ Formatea los encabezados (negrita, fondo oscuro)
- ✓ Te da el Sheet ID para actualizar admin.js

### 7. Actualizar admin.js

Después de ejecutar el script, actualiza la línea en `admin.js`:

```javascript
const SHEET_ID = 'TU_NUEVO_SHEET_ID_AQUI';
```

Con el ID que el script te proporciona.

## Resultado

El script mostrará algo como:

```
✅ Setup complete!

📌 Your new Sheet ID: 1vtvFaUgcWZpfyzPMAEc3o1KGU5QE_Pz6Uy4M3r4nJ_M

📋 Update admin.js with this ID:
   const SHEET_ID = '1vtvFaUgcWZpfyzPMAEc3o1KGU5QE_Pz6Uy4M3r4nJ_M';

🔗 Open in browser:
   https://docs.google.com/spreadsheets/d/1vtvFaUgcWZpfyzPMAEc3o1KGU5QE_Pz6Uy4M3r4nJ_M/edit
```

## Notas de Seguridad

- ⚠️ NO compartir el archivo `google-credentials.json`
- ✓ El archivo se puede agregar a `.gitignore`
- ✓ Las credenciales son solo para crear/editar la sheet
- ✓ Si alguien obtiene el archivo, puedes revocar la clave en Google Cloud

## Si Prefieres Hacerlo Manual

Si no quieres usar Google Cloud, puedes:
1. Crear una nueva Google Sheet manualmente
2. Crear 3 hojas: Materiales, Servicios, Servicios-Materiales
3. Copiar y pegar los datos de la hoja anterior
4. Compartir la sheet (público)
5. Actualizar SHEET_ID en admin.js
