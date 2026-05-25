#!/usr/bin/env node

/**
 * Setup Google Sheets for RISA Admin Panel
 *
 * This script creates a new Google Sheet with 3 sheets:
 * 1. Materiales - List of materials with units and prices
 * 2. Servicios - List of services that can be quoted
 * 3. Servicios-Materiales - Mapping of materials to services with quantities
 *
 * SETUP:
 * 1. Install dependencies: npm install
 * 2. Create Google Cloud Project and enable Sheets API
 * 3. Create service account and download JSON key
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS env var pointing to the key file
 * 5. Run: node setup-google-sheets.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Data for each sheet
const SHEETS_DATA = {
  Materiales: {
    headers: ['ID', 'Nombre', 'Unidad', 'Precio'],
    rows: [
      ['pega_azulejos', 'Pega azulejos', 'sacos (20kg)', 380],
      ['arena_fina', 'Arena fina', 'm³', 180],
      ['arena_gruesa', 'Arena gruesa', 'm³', 180],
      ['cemento_gris', 'Cemento gris', 'sacos (25kg)', 220],
      ['lechada', 'Lechada / Grout', 'sacos (25kg)', 420],
      ['grava', 'Grava o piedra', 'm³', 280],
      ['agua', 'Agua', 'litros', 10],
      ['pintura_latex', 'Pintura látex', 'litros', 800],
      ['thinner', 'Thinner', 'litros', 600],
      ['masilla_pintura', 'Masilla / Resane', 'kg', 200],
      ['lija', 'Lija / Lija adhesiva', 'pliegos', 50],
      ['placa_tablaroca', 'Placa de tablaroca (1.22 x 2.44 m)', 'piezas', 280],
      ['pegamento_tablaroca', 'Pegamento para tablaroca', 'kg', 150],
      ['tornillos_tablaroca', 'Tornillos para tablaroca (1 1/4")', 'piezas', 2],
      ['cinta_papel', 'Cinta de papel para juntas', 'metros', 15],
      ['masilla_juntas', 'Masilla para juntas', 'kg', 180],
      ['impermeabilizante', 'Impermeabilizante líquido', 'litros', 500],
      ['primer', 'Primer / Sellador', 'litros', 400],
      ['aditivo_impermeabilizante', 'Aditivo impermeabilizante', 'sacos (25kg)', 620],
      ['tela_asfaltica', 'Tela asfáltica', 'm2', 600],
    ]
  },
  Servicios: {
    headers: ['ID', 'Nombre', 'Descripción', '¿Medible?'],
    rows: [
      ['vitropiso', 'Vitropiso / Azulejos', 'Colocación de azulejos y vitropiso', 'Sí'],
      ['cementado', 'Cementado / Piso de concreto', 'Preparación e instalación de pisos de cemento', 'Sí'],
      ['pintura', 'Pintura residencial', 'Pintura de interiores y exteriores', 'Sí'],
      ['tablaroca', 'Instalación de Tablaroca', 'Muros, plafones y revestimientos', 'Sí'],
      ['impermeabilizacion', 'Impermeabilización', 'Impermeabilización de azoteas y techos', 'Sí'],
      ['plomeria', 'Plomería', 'Instalación y reparación de tuberías', 'No'],
    ]
  },
  'Servicios-Materiales': {
    headers: ['ID_Servicio', 'ID_Material', 'Cantidad_por_m2'],
    rows: [
      ['vitropiso', 'pega_azulejos', 0.075],
      ['vitropiso', 'arena_fina', 0.0008],
      ['vitropiso', 'cemento_gris', 0.02],
      ['vitropiso', 'lechada', 0.012],
      ['cementado', 'arena_gruesa', 0.04],
      ['cementado', 'grava', 0.06],
      ['cementado', 'cemento_gris', 1.0],
      ['cementado', 'agua', 20],
      ['pintura', 'pintura_latex', 0.12],
      ['pintura', 'thinner', 0.02],
      ['pintura', 'masilla_pintura', 0.1],
      ['pintura', 'lija', 0.02],
      ['tablaroca', 'placa_tablaroca', 0.34],
      ['tablaroca', 'pegamento_tablaroca', 0.5],
      ['tablaroca', 'tornillos_tablaroca', 15],
      ['tablaroca', 'cinta_papel', 1.5],
      ['tablaroca', 'masilla_juntas', 1.2],
      ['impermeabilizacion', 'impermeabilizante', 1.2],
      ['impermeabilizacion', 'primer', 0.3],
      ['impermeabilizacion', 'aditivo_impermeabilizante', 0.008],
      ['impermeabilizacion', 'tela_asfaltica', 1.1],
    ]
  }
};

async function setup() {
  try {
    // Check for credentials
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath || !fs.existsSync(credPath)) {
      console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      console.error('   or file does not exist.');
      console.error('\nSetup steps:');
      console.error('1. Go to https://console.cloud.google.com/');
      console.error('2. Create a new project or select existing');
      console.error('3. Enable Google Sheets API');
      console.error('4. Create a Service Account (IAM > Service Accounts)');
      console.error('5. Create a JSON key for the service account');
      console.error('6. Download the key and save it');
      console.error('7. Run: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node setup-google-sheets.js');
      process.exit(1);
    }

    // Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Creating new Google Sheet...');

    // Create spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'RISA Multiservicios - Admin Data',
          locale: 'es_MX',
        },
        sheets: [
          { properties: { title: 'Materiales', sheetId: 0 } },
          { properties: { title: 'Servicios', sheetId: 1 } },
          { properties: { title: 'Servicios-Materiales', sheetId: 2 } },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log(`✓ Created spreadsheet: ${spreadsheetId}`);

    // Populate sheets
    const sheetNames = Object.keys(SHEETS_DATA);
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      const { headers, rows } = SHEETS_DATA[sheetName];

      console.log(`📝 Populating "${sheetName}" sheet...`);

      // Prepare data with headers
      const data = [headers, ...rows];

      // Update sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: data },
      });

      console.log(`✓ Populated ${rows.length} rows in "${sheetName}"`);
    }

    // Format headers (bold, background color)
    const requests = [];
    for (let sheetId = 0; sheetId < 3; sheetId++) {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              backgroundColor: { red: 0.2, green: 0.3, blue: 0.4 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat',
        },
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    console.log('\n✅ Setup complete!\n');
    console.log(`📌 Your new Sheet ID: ${spreadsheetId}`);
    console.log(`\n📋 Update admin.js with this ID:`);
    console.log(`   const SHEET_ID = '${spreadsheetId}';`);
    console.log(`\n🔗 Open in browser:`);
    console.log(`   https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

    // Save to .env file
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, `GOOGLE_SHEET_ID=${spreadsheetId}\n`);
    console.log(`\n💾 Saved to .env file`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setup();
