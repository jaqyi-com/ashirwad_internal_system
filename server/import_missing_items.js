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
  const csvPath = '/Volumes/akshat/Scraper/tally_data/missing_items_from_list.csv';
  console.log(`Reading missing items CSV from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(content);
  
  console.log(`Parsed ${rows.length} rows (including header).`);
  const dataRows = rows.slice(1);
  
  // Header: Sr_No,Sr_No,Item_Name,Category,HSN_Code,HSN_Desc,GST_Pct,Quantity,Rate_INR,Value_INR,Stock_Status,Period
  
  // 1. Map/Create Categories (use HSN_Desc or Category)
  const catMap = new Map();
  const allCats = await prisma.category.findMany();
  for (const c of allCats) {
    catMap.set(c.name.toLowerCase().trim(), c.id);
  }

  for (const r of dataRows) {
    const catName = (r[5] && r[5].trim()) || (r[3] && r[3].trim()); // HSN_Desc or Category
    if (catName && !catMap.has(catName.toLowerCase().trim())) {
      const newCat = await prisma.category.create({
        data: {
          name: catName.trim(),
          color: '#6366f1'
        }
      });
      catMap.set(catName.toLowerCase().trim(), newCat.id);
    }
  }

  let created = 0;
  let updated = 0;

  for (const r of dataRows) {
    const itemName = r[2];
    const categoryCol = r[3];
    const hsnCode = r[4];
    const hsnDesc = r[5];
    const gstPctStr = r[6];
    const rateStr = r[8];

    if (!itemName || !itemName.trim()) continue;
    const trimmedName = itemName.trim();

    const catKey = (hsnDesc && hsnDesc.trim().toLowerCase()) || (categoryCol && categoryCol.trim().toLowerCase());
    const categoryId = (catKey && catMap.get(catKey)) || null;

    let gstPercent = 18;
    if (gstPctStr && gstPctStr.includes('%')) {
      gstPercent = parseFloat(gstPctStr.replace('%', '')) || 18;
    }

    const price = parseFloat(rateStr) || 0;
    const partNumber = (hsnCode && hsnCode.trim()) ? `HSN-${hsnCode.trim()}` : null;
    const specs = `Category: ${categoryCol || ''} | HSN: ${hsnCode || ''} (${hsnDesc || ''})`;

    const existing = await prisma.product.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId: categoryId || existing.categoryId,
          price: price > 0 ? price : existing.price,
          currentStock: 0,
          specifications: specs,
          barcode: hsnCode || existing.barcode,
          isActive: true
        }
      });
      console.log(`[Updated] ${trimmedName}`);
      updated++;
    } else {
      await prisma.product.create({
        data: {
          name: trimmedName,
          partNumber,
          categoryId,
          price,
          gstPercent,
          currentStock: 0,
          unit: 'pcs',
          specifications: specs,
          barcode: hsnCode || null,
          isActive: true
        }
      });
      console.log(`[Created] ${trimmedName}`);
      created++;
    }
  }

  console.log(`\nImport summary: Created: ${created}, Updated: ${updated}`);
  const totalCount = await prisma.product.count();
  console.log(`Total Products in DB: ${totalCount}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
