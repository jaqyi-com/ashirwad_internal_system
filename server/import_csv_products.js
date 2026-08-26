const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (!line.trim()) continue;
    
    const row = [];
    let cur = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

async function run() {
  const csvPath = '/Volumes/akshat/Scraper/tally_data/inventory_master.csv';
  console.log(`Reading CSV from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(content);
  
  console.log(`Parsed ${rows.length} rows (including header).`);
  
  const header = rows[0];
  const dataRows = rows.slice(1);
  
  // 1. Create or get Categories
  console.log('Synchronizing categories...');
  const categoryNames = new Set();
  dataRows.forEach(r => {
    const hsnDesc = r[3];
    if (hsnDesc && hsnDesc.trim()) {
      categoryNames.add(hsnDesc.trim());
    }
  });

  const catMap = new Map();
  for (const catName of categoryNames) {
    let cat = await prisma.category.findUnique({ where: { name: catName } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: catName,
          color: '#6366f1'
        }
      });
    }
    catMap.set(catName.toLowerCase(), cat.id);
  }
  console.log(`Synced ${catMap.size} categories.`);

  // 2. Fetch existing products
  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true }
  });
  const existingNameMap = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p.id]));
  console.log(`Found ${existingNameMap.size} existing products in DB.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Process in chunks of 50 for speed
  const chunkSize = 50;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    
    for (const r of chunk) {
      // Sr_No, Item_Name, HSN_Code, HSN_Desc, GST_Pct, Quantity, Rate, Value
      const [srNo, itemName, hsnCode, hsnDesc, gstPctStr, quantityStr, rateStr] = r;
      if (!itemName || !itemName.trim()) continue;

      const trimmedName = itemName.trim();
      const catId = (hsnDesc && catMap.get(hsnDesc.trim().toLowerCase())) || null;
      const gstPercent = parseFloat((gstPctStr || '18').replace('%', '')) || 18;
      const rawQty = parseFloat(quantityStr) || 0;
      const currentStock = Math.max(0, Math.round(rawQty));
      const price = parseFloat(rateStr) || 0;
      const partNumber = (hsnCode && hsnCode.trim()) ? `HSN-${hsnCode.trim()}` : null;
      const specs = `HSN: ${hsnCode || ''} | ${hsnDesc || ''}`;

      const existingId = existingNameMap.get(trimmedName.toLowerCase());

      if (existingId) {
        await prisma.product.update({
          where: { id: existingId },
          data: {
            categoryId: catId,
            gstPercent,
            price: price > 0 ? price : undefined,
            currentStock: currentStock > 0 ? currentStock : undefined,
            specifications: specs,
            barcode: hsnCode || undefined,
            isActive: true
          }
        });
        updated++;
      } else {
        const newProd = await prisma.product.create({
          data: {
            name: trimmedName,
            partNumber,
            categoryId: catId,
            price,
            gstPercent,
            currentStock,
            unit: 'pcs',
            specifications: specs,
            barcode: hsnCode || null,
            isActive: true
          }
        });
        existingNameMap.set(trimmedName.toLowerCase(), newProd.id);
        created++;
      }
    }
    console.log(`Processed ${Math.min(i + chunkSize, dataRows.length)} / ${dataRows.length} items (Created: ${created}, Updated: ${updated})...`);
  }

  console.log('\n================ IMPORT COMPLETE ================');
  console.log(`Total rows processed: ${dataRows.length}`);
  console.log(`Successfully created: ${created}`);
  console.log(`Successfully updated: ${updated}`);
  console.log('=================================================\n');
}

run()
  .catch(err => {
    console.error('Fatal import error:', err);
  })
  .finally(() => prisma.$disconnect());
