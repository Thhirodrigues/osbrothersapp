import mysql from 'mysql2/promise';

// VALORES EXATOS DO ARQUIVO DO USUÁRIO EM CENTAVOS
const afterMenuData = {
  categories: [
    {
      id: 'cat-after-cerveja-350ml',
      name: 'CERVEJA 350ML',
      items: [
        { id: 'item-after-itaipava', name: 'Itaipava', price: 450 },
        { id: 'item-after-skol', name: 'Skol', price: 500 },
        { id: 'item-after-amstel', name: 'Amstel', price: 600 },
        { id: 'item-after-duplo-malte', name: 'Duplo Malte', price: 600 },
        { id: 'item-after-heineken', name: 'Heineken', price: 700 },
        { id: 'item-after-budweiser-zero', name: 'Budweiser ZERO', price: 700 }
      ]
    },
    {
      id: 'cat-after-cerveja-269',
      name: 'CERVEJA 269',
      items: [
        { id: 'item-after-imperio', name: 'Império', price: 400 },
        { id: 'item-after-budweiser', name: 'Budweiser', price: 500 },
        { id: 'item-after-original', name: 'Original', price: 550 },
        { id: 'item-after-spaten', name: 'Spaten', price: 600 },
        { id: 'item-after-heineken-269', name: 'Heineken', price: 600 },
        { id: 'item-after-heineken-zero', name: 'Heineken ZERO', price: 600 }
      ]
    },
    {
      id: 'cat-after-longneck',
      name: 'LONGNECK',
      items: [
        { id: 'item-after-heineken-long', name: 'Heineken long', price: 900 },
        { id: 'item-after-corona', name: 'Corona', price: 1000 }
      ]
    },
    {
      id: 'cat-after-ipa',
      name: 'IPA',
      items: [
        { id: 'item-after-patagonia', name: 'Patagônia', price: 1000 },
        { id: 'item-after-baden', name: 'Baden', price: 1000 }
      ]
    },
    {
      id: 'cat-after-drinks',
      name: 'DRINKS',
      items: [
        { id: 'item-after-gin-flowers', name: 'Gin Flowers', price: 800 },
        { id: 'item-after-skol-beats', name: 'Skol BEATS', price: 800 },
        { id: 'item-after-51-ice', name: '51 Ice', price: 900 },
        { id: 'item-after-smirnoff-ice', name: 'Smirnoff Ice', price: 1000 },
        { id: 'item-after-batida', name: 'Batida cx 400ml', price: 1200 },
        { id: 'item-after-xeque-mate', name: 'Xeque Mate', price: 1500 }
      ]
    },
    {
      id: 'cat-after-energeticos',
      name: 'ENERGÉTICOS',
      items: [
        { id: 'item-after-baly-2l', name: 'Baly 2L', price: 1800 },
        { id: 'item-after-vibe-2l', name: 'Vibe 2L', price: 1500 },
        { id: 'item-after-baly-lata', name: 'Baly lata', price: 1000 },
        { id: 'item-after-mister-hemp', name: 'Mister Hemp', price: 1000 },
        { id: 'item-after-redbull', name: 'Redbull', price: 1300 },
        { id: 'item-after-monster', name: 'Monster', price: 1400 }
      ]
    },
    {
      id: 'cat-after-agua-sucos',
      name: 'AGUA/SUCOS/ISOTÔNICOS',
      items: [
        { id: 'item-after-agua', name: 'Água', price: 500 },
        { id: 'item-after-natural-one', name: 'Natural One', price: 2500 },
        { id: 'item-after-del-valle', name: 'Del Valle lata', price: 800 },
        { id: 'item-after-power-ade', name: 'Power ADE', price: 800 },
        { id: 'item-after-guaraviton', name: 'Guaraviton', price: 600 }
      ]
    },
    {
      id: 'cat-after-refrigerantes',
      name: 'REFRIGERANTES',
      items: [
        { id: 'item-after-refrigerante-lata', name: 'LATA', price: 600 },
        { id: 'item-after-coca-cola', name: 'Coca Cola 2L', price: 1500 },
        { id: 'item-after-guarana', name: 'Guaraná 2L', price: 1300 },
        { id: 'item-after-fanta', name: 'Fanta 2L', price: 1300 },
        { id: 'item-after-sprite', name: 'Sprite 2L', price: 1300 }
      ]
    },
    {
      id: 'cat-after-cachacas',
      name: 'CACHAÇAS',
      items: [
        { id: 'item-after-corote', name: 'Corote', price: 600 },
        { id: 'item-after-kariri', name: 'Kariri com Mel', price: 600 }
      ]
    },
    {
      id: 'cat-after-salgadinhos',
      name: 'SALGADINHOS',
      items: [
        { id: 'item-after-torcida', name: 'Torcida', price: 500 },
        { id: 'item-after-fofura', name: 'Fofura', price: 500 },
        { id: 'item-after-amendoim', name: 'Amendoim', price: 500 }
      ]
    },
    {
      id: 'cat-after-gelo',
      name: 'GELO',
      items: [
        { id: 'item-after-gelo-coco', name: 'Coco', price: 400 },
        { id: 'item-after-gelo-saco', name: 'Saco 5kg', price: 1000 }
      ]
    },
    {
      id: 'cat-after-garrafas',
      name: 'GARRAFAS',
      items: [
        { id: 'item-after-cabare', name: 'Cabaré', price: 3500 },
        { id: 'item-after-sao-joao', name: 'São João', price: 2000 },
        { id: 'item-after-chanceler', name: 'Chanceler', price: 3500 },
        { id: 'item-after-white-horse', name: 'White Horse', price: 9000 },
        { id: 'item-after-jim-beam', name: 'Jim Beam', price: 10000 },
        { id: 'item-after-jack-daniels', name: 'Jack Daniels', price: 15000 },
        { id: 'item-after-grey-goose', name: 'Grey Goose', price: 16000 },
        { id: 'item-after-smirnoff', name: 'Smirnoff', price: 5000 },
        { id: 'item-after-eternity', name: 'ETERNITY', price: 3200 },
        { id: 'item-after-tangerina', name: 'Tangerina', price: 2000 }
      ]
    },
    {
      id: 'cat-after-doses',
      name: 'DOSES',
      items: [
        { id: 'item-after-dose-eternity', name: 'ETERNITY', price: 1500 },
        { id: 'item-after-dose-eternity-redbull', name: 'ETERNITY REDBULL', price: 2000 },
        { id: 'item-after-dose-beefeather', name: 'BEEFEATHER REDBULL', price: 3500 },
        { id: 'item-after-dose-smirnoff-baly', name: 'SMIRNOFF BALY / SUCO', price: 2500 },
        { id: 'item-after-dose-smirnoff-redbull', name: 'SMIRNOFF REDBULL', price: 3000 },
        { id: 'item-after-dose-chanceler', name: 'CHANCELER', price: 1500 },
        { id: 'item-after-dose-white-horse-baly', name: 'WHITER HORSE BALY', price: 2500 },
        { id: 'item-after-dose-white-horse-redbull', name: 'WHITER HORSE REDBULL', price: 3000 },
        { id: 'item-after-dose-jim-beam-baly', name: 'JIM BEAM BALY', price: 3500 },
        { id: 'item-after-dose-jim-beam-redbull', name: 'JIM BEAM REDBULL', price: 4000 },
        { id: 'item-after-dose-jack-daniels', name: 'JACK DANIELS REDBULL', price: 4500 }
      ]
    }
  ]
};

async function finalFix() {
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

    // Delete old After menu
    await connection.execute('DELETE FROM menus WHERE id = ?', ['after-menu-1']);
    console.log('✓ Cardápio After anterior deletado');

    // Insert new After menu with correct prices
    const [result] = await connection.execute(
      'INSERT INTO menus (id, name, description, categories, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NOW(), NOW())',
      ['after-menu-1', 'Cardápio After', 'Cardápio After Hours', JSON.stringify(afterMenuData.categories)]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Cardápio After recriado com valores corretos!');
      console.log(`   - ${afterMenuData.categories.length} categorias`);
      const totalItems = afterMenuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);
      console.log(`   - ${totalItems} itens`);
      
      const firstItem = afterMenuData.categories[0].items[0];
      console.log(`\n   Exemplo: ${firstItem.name} = ${firstItem.price} centavos = R$ ${(firstItem.price / 100).toFixed(2)}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

finalFix();
