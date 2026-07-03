import mysql from 'mysql2/promise';

async function addCentavos() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✓ Conectado ao banco de dados');

    // Get current After menu
    const [menus] = await connection.execute(
      'SELECT categories FROM menus WHERE id = ?',
      ['after-menu-1']
    );

    if (menus.length === 0) {
      console.log('❌ Cardápio After não encontrado');
      await connection.end();
      return;
    }

    let categories = menus[0].categories;
    if (typeof categories === 'string') {
      categories = JSON.parse(categories);
    }
    
    // Add 100 centavos to each item
    categories.forEach(cat => {
      cat.items.forEach(item => {
        item.price = item.price + 100;
      });
    });

    // Update database
    const [result] = await connection.execute(
      'UPDATE menus SET categories = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(categories), 'after-menu-1']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Cardápio After corrigido!');
      console.log('   - Adicionado 100 centavos a cada item');
      
      // Verify
      const firstItem = categories[0].items[0];
      console.log(`   - Exemplo: ${firstItem.name} = ${firstItem.price} centavos = R$ ${(firstItem.price / 100).toFixed(2)}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addCentavos();
