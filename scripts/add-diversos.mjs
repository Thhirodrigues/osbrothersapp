import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
} catch(e) {}

const pool = mysql.createPool(process.env.DATABASE_URL);

async function main() {
  const conn = await pool.getConnection();

  // Check if Diversos category already exists in adega-menu-1
  const [existingAdega] = await conn.execute(
    "SELECT id FROM menu_categories WHERE menu_id = 'adega-menu-1' AND name = 'DIVERSOS'"
  );
  
  if (existingAdega.length > 0) {
    console.log('Categoria DIVERSOS já existe no Cardápio Adega. Pulando...');
  } else {
    // Get max order for adega-menu-1
    const [maxOrderAdega] = await conn.execute(
      "SELECT MAX(`order`) as maxOrder FROM menu_categories WHERE menu_id = 'adega-menu-1'"
    );
    const nextOrderAdega = (maxOrderAdega[0].maxOrder ?? -1) + 1;

    // Insert DIVERSOS category in adega-menu-1
    await conn.execute(
      "INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)",
      ['adega-cat-diversos', 'adega-menu-1', 'DIVERSOS', nextOrderAdega, Date.now()]
    );
    console.log(`✅ Categoria DIVERSOS adicionada ao Cardápio Adega (order: ${nextOrderAdega})`);

    // Insert items @ and K in adega DIVERSOS
    await conn.execute(
      "INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ['adega-item-diversos-arroba', 'adega-cat-diversos', '@', 4000, 0, Date.now()]
    );
    console.log('✅ Item @ (R$40,00) adicionado ao Cardápio Adega - DIVERSOS');

    await conn.execute(
      "INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ['adega-item-diversos-k', 'adega-cat-diversos', 'K', 8000, 1, Date.now()]
    );
    console.log('✅ Item K (R$80,00) adicionado ao Cardápio Adega - DIVERSOS');
  }

  // Check if Diversos category already exists in after-menu-1
  const [existingAfter] = await conn.execute(
    "SELECT id FROM menu_categories WHERE menu_id = 'after-menu-1' AND name = 'DIVERSOS'"
  );

  if (existingAfter.length > 0) {
    console.log('Categoria DIVERSOS já existe no Cardápio After. Pulando...');
  } else {
    // Get max order for after-menu-1
    const [maxOrderAfter] = await conn.execute(
      "SELECT MAX(`order`) as maxOrder FROM menu_categories WHERE menu_id = 'after-menu-1'"
    );
    const nextOrderAfter = (maxOrderAfter[0].maxOrder ?? -1) + 1;

    // Insert DIVERSOS category in after-menu-1
    await conn.execute(
      "INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)",
      ['cat-after-diversos', 'after-menu-1', 'DIVERSOS', nextOrderAfter, Date.now()]
    );
    console.log(`✅ Categoria DIVERSOS adicionada ao Cardápio After (order: ${nextOrderAfter})`);

    // Insert items @ and K in after DIVERSOS
    await conn.execute(
      "INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ['item-after-diversos-arroba', 'cat-after-diversos', '@', 4000, 0, Date.now()]
    );
    console.log('✅ Item @ (R$40,00) adicionado ao Cardápio After - DIVERSOS');

    await conn.execute(
      "INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ['item-after-diversos-k', 'cat-after-diversos', 'K', 8000, 1, Date.now()]
    );
    console.log('✅ Item K (R$80,00) adicionado ao Cardápio After - DIVERSOS');
  }

  conn.release();
  await pool.end();
  console.log('\n✅ Concluído!');
}

main().catch(console.error);
