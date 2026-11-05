import bcrypt from 'bcryptjs';
import { db } from './connection.js';

export const DEFAULT_BOUTIQUE_CATEGORIES = [
  {
    id: 'cat_clothing',
    name: 'Clothing & Apparel',
    slug: 'clothing-apparel',
    description: 'Luxury ready-to-wear, evening gowns, tailored suiting, knitwear, and daily essentials',
    subcategories: [
      'Dresses', 'Shirts', 'Blouses', 'T-Shirts', 'Tops', 'Jeans', 'Trousers',
      'Shorts', 'Skirts', 'Jackets', 'Coats', 'Sweaters', 'Hoodies',
      'Leggings', 'Underwear', 'Sleepwear', 'Activewear', 'Traditional Clothing'
    ]
  },
  {
    id: 'cat_shoes',
    name: 'Shoes & Footwear',
    slug: 'shoes-footwear',
    description: 'Designer heels, leather loafers, luxury sneakers, boots, and evening footwear',
    subcategories: [
      'High Heels', 'Sneakers', 'Sandals', 'Slippers', 'Flats', 'Boots', 'Formal Shoes', 'Casual Shoes'
    ]
  },
  {
    id: 'cat_bags',
    name: 'Bags & Handbags',
    slug: 'bags-handbags',
    description: 'Fine leather tote bags, shoulder bags, evening clutches, crossbody, and travel luggage',
    subcategories: [
      'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Backpacks', 'Clutches', 'Wallets', 'Purses', 'Travel Bags'
    ]
  },
  {
    id: 'cat_jewelry',
    name: 'Jewelry & Watches',
    slug: 'jewelry-watches',
    description: 'Fine jewelry, precious metals, diamonds, gemstones, and artisanal timepieces',
    subcategories: [
      'Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Anklets', 'Watches', 'Brooches'
    ]
  },
  {
    id: 'cat_accessories',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    description: 'Silk scarves, designer belts, Italian sunglasses, headwear, and bespoke accessories',
    subcategories: [
      'Belts', 'Sunglasses', 'Scarves', 'Hats', 'Caps', 'Gloves', 'Hair Accessories', 'Hair Clips', 'Headbands', 'Fashion Accessories'
    ]
  },
  {
    id: 'cat_beauty',
    name: 'Beauty & Cosmetics',
    slug: 'beauty-cosmetics',
    description: 'Niche perfumes, luxury skincare, high-pigment cosmetics, and artisanal body care',
    subcategories: [
      'Perfumes', 'Body Sprays', 'Makeup', 'Lipsticks', 'Foundations', 'Skincare', 'Face Creams', 'Body Lotions', 'Soaps', 'Beauty Accessories'
    ]
  },
  {
    id: 'cat_hair',
    name: 'Hair Products',
    slug: 'hair-products',
    description: 'Virgin hair extensions, luxury lace wigs, hairpieces, styling elixirs, and salon care',
    subcategories: [
      'Wigs', 'Hair Extensions', 'Braids', 'Hairpieces', 'Hair Accessories', 'Hair Care Products'
    ]
  },
  {
    id: 'cat_personal_care',
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'Botanical bath & body wash, botanical deodorants, restorative hair oils, and luxury care kits',
    subcategories: [
      'Deodorants', 'Body Wash', 'Shampoos', 'Conditioners', 'Body Oils', 'Personal Care Kits'
    ]
  },
  {
    id: 'cat_lifestyle',
    name: 'Lifestyle & Gift Items',
    slug: 'lifestyle-gift-items',
    description: 'Curated gift hampers, scented boutique candles, travel organizers, and keepsake gift boxes',
    subcategories: [
      'Gift Sets', 'Gift Boxes', 'Cosmetic Bags', 'Travel Accessories', 'Keychains', 'Fashion Gifts', 'Other Lifestyle Products'
    ]
  },
  {
    id: 'cat_other',
    name: 'Other Products',
    slug: 'other-products',
    description: 'General boutique merchandise, limited drops, custom orders, and seasonal items',
    subcategories: [
      'General Merchandise', 'Custom Items', 'Seasonal Miscellaneous'
    ]
  }
];

export function ensureCategoriesAndSubcategories() {
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, description, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET is_active = 1
  `);

  const insertSubcat = db.prepare(`
    INSERT INTO subcategories (id, category_id, name, slug, description, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT (id) DO NOTHING
  `);

  const existingSubcats = db.prepare('SELECT category_id, slug FROM subcategories').all() as { category_id: string; slug: string }[];
  const existingSubcatSet = new Set(existingSubcats.map(s => `${s.category_id}:${s.slug}`));

  for (const cat of DEFAULT_BOUTIQUE_CATEGORIES) {
    try {
      insertCat.run(cat.id, cat.name, cat.slug, cat.description);
    } catch (e) {
      // Category exists
    }

    // Lookup actual category id by slug
    const actualCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug) as { id: string } | undefined;
    const catId = actualCat?.id || cat.id;

    for (const subName of cat.subcategories) {
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const key = `${catId}:${subSlug}`;
      if (!existingSubcatSet.has(key)) {
        try {
          const subId = `sub_${catId.replace('cat_', '')}_${subSlug.substring(0, 15)}`;
          insertSubcat.run(subId, catId, subName, subSlug, `${subName} within ${cat.name}`);
          existingSubcatSet.add(key);
        } catch (e) {
          // Ignore duplicate
        }
      }
    }
  }

  // Seed sample products across categories if only initial clothing items exist
  seedExpandedBoutiqueProducts();
}

function seedExpandedBoutiqueProducts() {
  const existingProds = db.prepare('SELECT id FROM products').all() as { id: string }[];
  const prodIds = new Set(existingProds.map(p => p.id));

  const insertProd = db.prepare(`
    INSERT INTO products (
      id, name, slug, description, category_id, subcategory_id, brand_id, supplier_id,
      purchase_price, selling_price, wholesale_price, tax_rate, min_stock_level, image_url,
      status, is_simple, season, collection, gender, material, attributes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, sku, barcode, size, color, color_code, variant_name, attributes, purchase_price, selling_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const insertInv = db.prepare(`
    INSERT INTO inventory (id, variant_id, quantity, location, min_threshold)
    VALUES (?, ?, ?, 'Main Flagship Display', ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const insertMove = db.prepare(`
    INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
    VALUES (?, ?, 0, ?, ?, 'received', 'Expanded catalog initial stock', 'INITIAL_CATALOG', 'u_admin')
    ON CONFLICT (id) DO NOTHING
  `);

  // Helper to get subcategory id
  const getSubId = (catId: string, subSlug: string) => {
    const row = db.prepare('SELECT id FROM subcategories WHERE category_id = ? AND slug = ?').get(catId, subSlug) as { id: string } | undefined;
    return row?.id || null;
  };

  // 1. Shoes: Satin Pointed Pumps
  if (!prodIds.has('p_shoes_pumps')) {
    const catId = 'cat_shoes';
    const subId = getSubId(catId, 'high-heels');
    insertProd.run(
      'p_shoes_pumps',
      'Saint-Honoré Satin Pointed-Toe Pumps',
      'saint-honore-satin-pointed-pumps',
      'Handcrafted Italian silk-satin stilettos with 105mm lacquered heel, padded kidskin insole, and brushed leather sole.',
      catId, subId, 'b_honore', 's_florence',
      210.0, 520.0, 390.0, 0.08, 4,
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
      0, 'Autumn/Winter 2026', 'Soirée Collection', 'Women', 'Silk Satin Upper, Kidskin Lining',
      JSON.stringify({ upper_material: 'Silk Satin', heel_height: '105mm Stiletto', sole: 'Brushed Italian Leather', target_gender: 'Women' })
    );

    const sizes = [
      { size: 'EU 37', sku: 'PMP-STN-BLK-37', bar: '784920201037', qty: 5 },
      { size: 'EU 38', sku: 'PMP-STN-BLK-38', bar: '784920201038', qty: 7 },
      { size: 'EU 39', sku: 'PMP-STN-BLK-39', bar: '784920201039', qty: 4 },
      { size: 'EU 40', sku: 'PMP-STN-BLK-40', bar: '784920201040', qty: 2 }
    ];

    for (const s of sizes) {
      const vId = `v_pumps_${s.size.replace(' ', '_').toLowerCase()}`;
      insertVariant.run(vId, 'p_shoes_pumps', s.sku, s.bar, s.size, 'Noir Black', '#111111', `${s.size} · Noir`, JSON.stringify({ shoe_size: s.size }), 210.0, 520.0);
      insertInv.run(`inv_${vId}`, vId, s.qty, 3);
      insertMove.run(`mov_${vId}`, vId, s.qty, s.qty);
    }
  }

  // 2. Beauty & Cosmetics: Niche Perfume
  if (!prodIds.has('p_perfume_rose')) {
    const catId = 'cat_beauty';
    const subId = getSubId(catId, 'perfumes');
    insertProd.run(
      'p_perfume_rose',
      'Rose de Grasse Extrait de Parfum',
      'rose-de-grasse-extrait-de-parfum',
      'Master perfumer formulation centering Centifolia rose petals harvested at dawn in Grasse, anchored with Mysore sandalwood and ambergris.',
      catId, subId, 'b_valmont', 's_lyon',
      95.0, 260.0, 195.0, 0.08, 5,
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
      0, 'Permanent Collection', 'Haute Parfumerie', 'Unisex', 'Alcohol, Fragrance Parfum, Essential Oils',
      JSON.stringify({ fragrance_family: 'Floral Oriental', concentration: 'Extrait de Parfum (30%)', net_volume: '50ml - 100ml', origin: 'Grasse, France' })
    );

    const volumes = [
      { vol: '50ml', sku: 'PRF-ROS-EXT-50', bar: '784920202050', cost: 95.0, price: 260.0, qty: 8 },
      { vol: '100ml', sku: 'PRF-ROS-EXT-100', bar: '784920202100', cost: 145.0, price: 390.0, qty: 6 }
    ];

    for (const v of volumes) {
      const vId = `v_perfume_${v.vol}`;
      insertVariant.run(vId, 'p_perfume_rose', v.sku, v.bar, v.vol, 'Crystal Flacon', '#D4AF37', `${v.vol} Extrait`, JSON.stringify({ volume: v.vol }), v.cost, v.price);
      insertInv.run(`inv_${vId}`, vId, v.qty, 3);
      insertMove.run(`mov_${vId}`, vId, v.qty, v.qty);
    }
  }

  // 3. Jewelry & Watches: 18K Diamond Solitaire Ring
  if (!prodIds.has('p_jewel_ring')) {
    const catId = 'cat_jewelry';
    const subId = getSubId(catId, 'rings');
    insertProd.run(
      'p_jewel_ring',
      'Hirbit 18K Diamond Solitaire Ring',
      'hirbit-18k-diamond-solitaire-ring',
      'GIA-certified 1.2 carat brilliant-cut solitaire diamond set in solid 18-karat recycled yellow gold with micro-pave diamond band gallery.',
      catId, subId, 'b_aurum', 's_milano',
      980.0, 2400.0, 1800.0, 0.08, 2,
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
      0, 'Permanent Haute Joaillerie', 'L’Infini', 'Women', 'Solid 18K Gold, VVS1 Diamond',
      JSON.stringify({ metal_type: '18K Yellow Gold (750)', stone: '1.2ct Diamond (VS1 / F Color)', karat: '18K', certification: 'GIA Certified' })
    );

    const ringSizes = [
      { size: 'US 6 (52mm)', sku: 'RNG-GLD-DIA-6', bar: '784920203006', qty: 3 },
      { size: 'US 7 (54mm)', sku: 'RNG-GLD-DIA-7', bar: '784920203007', qty: 4 },
      { size: 'US 8 (57mm)', sku: 'RNG-GLD-DIA-8', bar: '784920203008', qty: 2 }
    ];

    for (const r of ringSizes) {
      const vId = `v_ring_${r.size.substring(0, 4).replace(' ', '_').toLowerCase()}`;
      insertVariant.run(vId, 'p_jewel_ring', r.sku, r.bar, r.size, '18K Yellow Gold', '#FFD700', `${r.size} · 18K Gold`, JSON.stringify({ ring_size: r.size }), 980.0, 2400.0);
      insertInv.run(`inv_${vId}`, vId, r.qty, 1);
      insertMove.run(`mov_${vId}`, vId, r.qty, r.qty);
    }
  }

  // 4. Hair Products: Raw Virgin Brazilian Body Wave Lace Wig
  if (!prodIds.has('p_hair_wig')) {
    const catId = 'cat_hair';
    const subId = getSubId(catId, 'wigs');
    insertProd.run(
      'p_hair_wig',
      'Raw Virgin Brazilian Body Wave 13x4 Lace Wig',
      'raw-virgin-brazilian-body-wave-lace-wig',
      'Single-donor unprocessed cuticle-aligned raw virgin Brazilian human hair with pre-plucked hairline and ultra-thin HD transparent lace.',
      catId, subId, 'b_aurum', 's_milano',
      160.0, 430.0, 320.0, 0.08, 3,
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      0, 'Salon Luxury Line', 'Crown Collection', 'Women', '100% Raw Virgin Human Hair',
      JSON.stringify({ hair_origin: '100% Raw Virgin Brazilian', texture: 'Body Wave', density: '180% Full Density', lace_type: '13x4 HD Transparent Lace' })
    );

    const hairLengths = [
      { len: '20 inch', sku: 'WIG-BDY-WAV-20', bar: '784920204020', cost: 160.0, price: 430.0, qty: 5 },
      { len: '24 inch', sku: 'WIG-BDY-WAV-24', bar: '784920204024', cost: 190.0, price: 490.0, qty: 6 },
      { len: '28 inch', sku: 'WIG-BDY-WAV-28', bar: '784920204028', cost: 230.0, price: 560.0, qty: 3 }
    ];

    for (const h of hairLengths) {
      const vId = `v_wig_${h.len.replace(' ', '_').toLowerCase()}`;
      insertVariant.run(vId, 'p_hair_wig', h.sku, h.bar, h.len, '#1B Natural Black', '#1B1B1B', `${h.len} · Natural Black`, JSON.stringify({ hair_length: h.len }), h.cost, h.price);
      insertInv.run(`inv_${vId}`, vId, h.qty, 2);
      insertMove.run(`mov_${vId}`, vId, h.qty, h.qty);
    }
  }

  // 5. Fashion Accessories: Venetian Acetate Cat-Eye Sunglasses
  if (!prodIds.has('p_access_sunglasses')) {
    const catId = 'cat_accessories';
    const subId = getSubId(catId, 'sunglasses');
    insertProd.run(
      'p_access_sunglasses',
      'Venetian Acetate Bold Cat-Eye Sunglasses',
      'venetian-acetate-bold-cat-eye-sunglasses',
      'Beveled Italian Mazzucchelli acetate sunglasses featuring gold-foil temple crest and polarized UV400 Carl Zeiss lenses.',
      catId, subId, 'b_aurum', 's_milano',
      75.0, 220.0, 160.0, 0.08, 4,
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
      0, 'Summer Riviera', 'Solaire', 'Unisex', 'Italian Mazzucchelli Acetate, CR-39 Lenses',
      JSON.stringify({ frame_material: 'Mazzucchelli Acetate', lens_filter: 'Polarized UV400 Cat. 3', hardware: 'Gold-Tone Hinges' })
    );

    const colors = [
      { col: 'Tortoiseshell', code: '#593B26', sku: 'SGL-CAT-TOR-OS', bar: '784920205001', qty: 7 },
      { col: 'Gloss Noir', code: '#0A0A0A', sku: 'SGL-CAT-NOI-OS', bar: '784920205002', qty: 8 }
    ];

    for (const c of colors) {
      const vId = `v_sunglasses_${c.col.replace(' ', '_').toLowerCase()}`;
      insertVariant.run(vId, 'p_access_sunglasses', c.sku, c.bar, 'One Size', c.col, c.code, `One Size · ${c.col}`, JSON.stringify({ color: c.col }), 75.0, 220.0);
      insertInv.run(`inv_${vId}`, vId, c.qty, 3);
      insertMove.run(`mov_${vId}`, vId, c.qty, c.qty);
    }
  }

  // 6. Lifestyle & Gift Items: Luxury Velvet Holiday Gift Box (Simple Product)
  if (!prodIds.has('p_gift_hamper')) {
    const catId = 'cat_lifestyle';
    const subId = getSubId(catId, 'gift-sets');
    insertProd.run(
      'p_gift_hamper',
      'Atelier Aurum Holiday Grand Gift Box',
      'atelier-aurum-holiday-grand-gift-box',
      'Handcrafted gold-foil emerald velvet keepsake chest containing scented soy wax candle, silk sleep mask, pure mulberry silk scrunchie, and lavender pillow elixir.',
      catId, subId, 'b_aurum', 's_lyon',
      60.0, 175.0, 125.0, 0.08, 5,
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80',
      1, 'Holiday Exclusive', 'Noël Éternel', 'Unisex', 'Emerald Velvet, Pure Silk, Soy Wax',
      JSON.stringify({ packaging: 'Magnetic Velvet Keepsake Box', contents: '4-Piece Luxury Set', occasion: 'Holiday / VIP Corporate' })
    );

    // Simple product has 1 default variant
    const vId = 'v_gift_hamper_std';
    insertVariant.run(vId, 'p_gift_hamper', 'GFT-HMP-EMR-OS', '784920206001', 'Standard Set', 'Emerald Velvet', '#0F52BA', 'Standard Gift Set', JSON.stringify({ type: 'Standard' }), 60.0, 175.0);
    insertInv.run(`inv_${vId}`, vId, 12, 3);
    insertMove.run(`mov_${vId}`, vId, 12, 12);
  }
}

export function ensureBrandsAndSuppliers() {
  const brands = [
    ['b_aurum', 'Atelier Aurum', 'France'],
    ['b_loro', 'Loro & Co.', 'Italy'],
    ['b_honore', 'Saint-Honoré Collection', 'France'],
    ['b_valmont', 'Valmont Heritage', 'Switzerland'],
  ];
  for (const [id, name, country] of brands) {
    try {
      db.prepare('INSERT INTO brands (id, name, country) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING').run(id, name, country);
    } catch {}
  }

  const suppliers = [
    ['s_milano', 'Milano Tessuti SRL', 'Marco Rossi', '+39 02 8923 110', 'orders@milanotessuti.it', 'Via Monte Napoleone 14, Milan, Italy', 'Cashmere wool, silk blends, tailored fabrics', 0],
    ['s_lyon', 'Lyon Soieries & Atelier', 'Helene Dubois', '+33 4 72 10 99', 'contact@lyonsoieries.fr', 'Rue Royale 28, Lyon, France', 'Pure mulberry silk, evening fabrics', 1200.0],
    ['s_florence', 'Tuscan Leather Guild', 'Matteo Bellini', '+39 055 238 44', 'trade@tuscanleather.it', 'Piazza Santa Croce 8, Florence, Italy', 'Full grain calfskin leather bags and accessories', 0],
  ];
  for (const [id, comp, contact, phone, email, addr, prods, bal] of suppliers) {
    try {
      db.prepare('INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, products_supplied, balance_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING').run(id, comp, contact, phone, email, addr, prods, bal);
    } catch {}
  }
}

export function ensureDefaultCredentials() {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123456', salt);
  const storePersonHash = bcrypt.hashSync('manager123456', salt);
  const salesHash = bcrypt.hashSync('cashier123456', salt);

  const upsertUser = db.prepare(`
    INSERT INTO profiles (id, username, email, password_hash, full_name, role, is_active, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_active = 1,
      phone = EXCLUDED.phone
  `);

  try {
    upsertUser.run('u_admin', 'vivienne_owner', 'admin@hirbitstore.com', adminHash, 'Vivienne Laurent', 'admin', '+251 91 123 4567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    upsertUser.run('u_manager', 'julian_store', 'storeperson@hirbitstore.com', storePersonHash, 'Julian Vance', 'store_person', '+251 91 123 4568', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
    upsertUser.run('u_cashier', 'camille_sales', 'sales@hirbitstore.com', salesHash, 'Camille Moreau', 'sales', '+251 91 123 4569', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80');
    console.log('[Seed] Verified default staff credentials (admin, store manager, sales associate).');
  } catch (err) {
    console.error('[Seed] Error ensuring credentials:', err);
  }
}

export function seedDatabase() {
  // Always guarantee brands, suppliers, categories, subcategories and credentials are loaded
  try {
    ensureBrandsAndSuppliers();
    ensureCategoriesAndSubcategories();
    ensureDefaultCredentials();
  } catch (err) {
    console.error('[Category Seed Error]:', err);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: any };
  const hasUsers = Number(userCount?.count || 0) > 0;

  if (!hasUsers) {
    console.log('[Seed] Seeding Hirbit Store database with retail operational data...');

    const transaction = db.transaction(() => {
      // 1. Roles
      const insertRole = db.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING');
      insertRole.run('admin', 'System Administrator', 'Full business authority, financial visibility, role assignment, and system configuration');
      insertRole.run('store_person', 'Store Manager', 'Daily store & inventory management, stock receiving, catalog adjustments, and sales oversight');
      insertRole.run('sales', 'Sales Associate', 'Point of sale checkout, customer lookup, shift reconciliation, and receipt handling');

      // 2. Permissions
      const insertPerm = db.prepare('INSERT INTO permissions (id, key, description, category) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING');
      const perms = [
        ['p1', 'dashboard.view_full', 'View full financial metrics & profit analytics', 'Dashboard'],
        ['p2', 'dashboard.view_store', 'View store-level daily sales and low-stock indicators', 'Dashboard'],
        ['p3', 'products.view', 'View product catalog and variants', 'Products'],
        ['p4', 'products.create', 'Add new products and variants', 'Products'],
        ['p5', 'products.update', 'Edit product details, images, and prices', 'Products'],
        ['p6', 'products.delete', 'Archive or delete products', 'Products'],
        ['p7', 'inventory.view', 'View inventory quantities across locations', 'Inventory'],
        ['p8', 'inventory.adjust', 'Make manual stock adjustments with mandatory reason', 'Inventory'],
        ['p9', 'inventory.receive', 'Receive incoming purchase orders', 'Inventory'],
        ['p10', 'sales.create', 'Process transactions in POS and apply discounts', 'Sales'],
        ['p11', 'sales.view_all', 'View all historical sales across all staff', 'Sales'],
        ['p12', 'sales.view_own', 'View personal shift sales only', 'Sales'],
        ['p13', 'sales.refund', 'Authorize and process customer returns and refunds', 'Sales'],
        ['p14', 'customers.manage', 'Create and edit customer loyalty profiles', 'Customers'],
        ['p15', 'suppliers.manage', 'Create and manage suppliers and purchase orders', 'Suppliers'],
        ['p16', 'expenses.manage', 'Record and review operational boutique expenses', 'Finance'],
        ['p17', 'reports.view_financial', 'Access revenue, COGS, gross and net profit reports', 'Reports'],
        ['p18', 'reports.view_sales', 'Access sales and volume reports', 'Reports'],
        ['p19', 'users.manage', 'Create employees, assign roles, and alter permissions', 'Users'],
        ['p20', 'settings.manage', 'Configure boutique tax, currency, and business details', 'Settings']
      ];
      for (const [id, key, desc, cat] of perms) {
        insertPerm.run(id, key, desc, cat);
      }

      // Role Permissions mapping
      const insertRolePerm = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT (role_id, permission_id) DO NOTHING');
      for (const [id] of perms) {
        insertRolePerm.run('admin', id);
      }
      const storePersonPermIds = ['p2', 'p3', 'p4', 'p5', 'p7', 'p8', 'p9', 'p10', 'p11', 'p13', 'p14', 'p15', 'p16', 'p18'];
      for (const id of storePersonPermIds) {
        insertRolePerm.run('store_person', id);
      }
      const salesPermIds = ['p3', 'p10', 'p12', 'p14'];
      for (const id of salesPermIds) {
        insertRolePerm.run('sales', id);
      }

      // 3. User Profiles
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123456', salt);
      const storePersonHash = bcrypt.hashSync('manager123456', salt);
      const salesHash = bcrypt.hashSync('cashier123456', salt);

      const insertUser = db.prepare(`
        INSERT INTO profiles (id, username, email, password_hash, full_name, role, is_active, phone, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `);
      insertUser.run('u_admin', 'vivienne_owner', 'admin@hirbitstore.com', adminHash, 'Vivienne Laurent', 'admin', '+251 91 123 4567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      insertUser.run('u_manager', 'julian_store', 'storeperson@hirbitstore.com', storePersonHash, 'Julian Vance', 'store_person', '+251 91 123 4568', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
      insertUser.run('u_cashier', 'camille_sales', 'sales@hirbitstore.com', salesHash, 'Camille Moreau', 'sales', '+251 91 123 4569', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80');

      // 4. Categories
      const insertCat = db.prepare('INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING');
      insertCat.run('c_evening', 'Evening Wear', 'evening-wear', 'Curated silk gowns, cocktail dresses, and formal attire');
      insertCat.run('c_outerwear', 'Outerwear & Coats', 'outerwear', 'Cashmere overcoats, tailored trench coats, and jackets');
      insertCat.run('c_leather', 'Leather Goods', 'leather-goods', 'Handcrafted calfskin totes, clutches, and crossbody bags');
      insertCat.run('c_suiting', 'Tailored Suiting', 'tailored-suiting', 'Relaxed linen blazers, wool trousers, and structured two-piece sets');
      insertCat.run('c_knitwear', 'Silk & Knitwear', 'knitwear', 'Fine-gauge merino sweaters, silk blouses, and ribbed tops');

      // 5. Brands
      const insertBrand = db.prepare('INSERT INTO brands (id, name, country) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING');
      insertBrand.run('b_aurum', 'Hirbit Store Collection', 'Ethiopia');
      insertBrand.run('b_loro', 'Loro & Co.', 'Italy');
      insertBrand.run('b_honore', 'Saint-Honoré Collection', 'France');
      insertBrand.run('b_valmont', 'Valmont Heritage', 'Switzerland');

      // 6. Suppliers
      const insertSup = db.prepare('INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, products_supplied, balance_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING');
      insertSup.run('s_milano', 'Milano Tessuti SRL', 'Marco Rossi', '+39 02 8923 110', 'orders@milanotessuti.it', 'Via Monte Napoleone 14, Milan, Italy', 'Cashmere wool, silk blends, tailored fabrics', 0);
      insertSup.run('s_lyon', 'Hawassa Textile & Apparel Mill', 'Almaz Bekele', '+251 46 220 1199', 'contact@hawassatextile.et', 'Hawassa Industrial Zone, Hawassa, Ethiopia', 'Pure cotton, linen, evening fabrics', 1200.0);
      insertSup.run('s_florence', 'Tuscan Leather Guild', 'Matteo Bellini', '+39 055 238 44', 'trade@tuscanleather.it', 'Piazza Santa Croce 8, Florence, Italy', 'Full grain leather bags and accessories', 0);

      // 7. Products
      const insertProd = db.prepare(`
        INSERT INTO products (id, name, slug, description, category_id, brand_id, supplier_id, purchase_price, selling_price, min_stock_level, image_url, status, season, collection, gender, material)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `);

      insertProd.run(
        'p_dress',
        'The Seraphine Silk Slip Gown',
        'seraphine-silk-slip-gown',
        'Floor-grazing bias-cut evening slip crafted from 28-momme French mulberry silk with delicate rouleau straps and subtle cowl neckline.',
        'c_evening',
        'b_aurum',
        's_lyon',
        190.0,
        480.0,
        4,
        '/src/assets/images/product_silk_dress_1793729959681.jpg',
        'Autumn/Winter 2026',
        'L’Étoile Nocturne',
        'Women',
        '100% Mulberry Silk'
      );

      insertProd.run(
        'p_coat',
        'The Aurelius Camel Cashmere Overcoat',
        'aurelius-camel-cashmere-overcoat',
        'Architectural double-breasted overcoat tailored in Florence from double-faced virgin wool and Mongolian cashmere with horn button closures.',
        'c_outerwear',
        'b_loro',
        's_milano',
        380.0,
        890.0,
        3,
        '/src/assets/images/product_cashmere_coat_1793729960408.jpg',
        'Autumn/Winter 2026',
        'Heritage Tailoring',
        'Men',
        '85% Virgin Wool, 15% Cashmere'
      );

      insertProd.run(
        'p_tote',
        'The Palazzo Structured Leather Tote',
        'palazzo-structured-leather-tote',
        'Rigid architectural tote bag in deep espresso vegetable-tanned Italian calfskin featuring hand-burnished edges and micro-suede interior lining.',
        'c_leather',
        'b_honore',
        's_florence',
        240.0,
        620.0,
        4,
        '/src/assets/images/product_leather_tote_1793729961465.jpg',
        'Permanent Collection',
        'Signature Leatherware',
        'Unisex',
        'Full Grain Italian Calfskin'
      );

      insertProd.run(
        'p_blazer',
        'The Saint-Germain Relaxed Linen Blazer',
        'saint-germain-relaxed-linen-blazer',
        'Unstructured relaxed single-breasted blazer woven from Normandy flax linen, featuring patch pockets and horn buttons.',
        'c_suiting',
        'b_aurum',
        's_milano',
        140.0,
        360.0,
        5,
        '/src/assets/images/product_linen_blazer_1793729960494.jpg',
        'Spring/Summer 2026',
        'Riviera Casual',
        'Men',
        '100% Normandy Flax Linen'
      );

      // 8. Product Variants & Inventory
      const insertVariant = db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, barcode, size, color, color_code, purchase_price, selling_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `);

      const insertInv = db.prepare(`
        INSERT INTO inventory (id, variant_id, quantity, location, min_threshold)
        VALUES (?, ?, ?, 'Main Flagship Display', ?)
        ON CONFLICT (id) DO NOTHING
      `);

      const insertMove = db.prepare(`
        INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `);

      // Silk Dress Variants
      const dressVariants = [
        ['v_dress_xs_champagne', 'p_dress', 'DRS-SLK-CHP-XS', '784920192801', 'XS', 'Champagne', '#E8DFD3', 190.0, 480.0, 5],
        ['v_dress_s_champagne', 'p_dress', 'DRS-SLK-CHP-S', '784920192802', 'S', 'Champagne', '#E8DFD3', 190.0, 480.0, 8],
        ['v_dress_m_champagne', 'p_dress', 'DRS-SLK-CHP-M', '784920192803', 'M', 'Champagne', '#E8DFD3', 190.0, 480.0, 6],
        ['v_dress_l_champagne', 'p_dress', 'DRS-SLK-CHP-L', '784920192804', 'L', 'Champagne', '#E8DFD3', 190.0, 480.0, 2],
        ['v_dress_s_black', 'p_dress', 'DRS-SLK-BLK-S', '784920192805', 'S', 'Onyx Black', '#1A1A1A', 190.0, 480.0, 7],
        ['v_dress_m_black', 'p_dress', 'DRS-SLK-BLK-M', '784920192806', 'M', 'Onyx Black', '#1A1A1A', 190.0, 480.0, 4],
      ];

      // Cashmere Coat Variants
      const coatVariants = [
        ['v_coat_s_camel', 'p_coat', 'COT-CSH-CML-S', '784920193101', 'S', 'Camel', '#C19A6B', 380.0, 890.0, 3],
        ['v_coat_m_camel', 'p_coat', 'COT-CSH-CML-M', '784920193102', 'M', 'Camel', '#C19A6B', 380.0, 890.0, 6],
        ['v_coat_l_camel', 'p_coat', 'COT-CSH-CML-L', '784920193103', 'L', 'Camel', '#C19A6B', 380.0, 890.0, 1],
        ['v_coat_m_charcoal', 'p_coat', 'COT-CSH-CHR-M', '784920193104', 'M', 'Charcoal', '#2B2B2B', 380.0, 890.0, 4],
      ];

      // Leather Tote Variants
      const toteVariants = [
        ['v_tote_espresso', 'p_tote', 'TOT-LTH-ESP-OS', '784920194001', 'One Size', 'Espresso Brown', '#3B2F2F', 240.0, 620.0, 5],
        ['v_tote_cognac', 'p_tote', 'TOT-LTH-COG-OS', '784920194002', 'One Size', 'Warm Cognac', '#9A4620', 240.0, 620.0, 3],
      ];

      // Linen Blazer Variants
      const blazerVariants = [
        ['v_blz_s_ivory', 'p_blazer', 'BLZ-LIN-IVR-S', '784920195001', 'S', 'Warm Ivory', '#F4F1EA', 140.0, 360.0, 4],
        ['v_blz_m_ivory', 'p_blazer', 'BLZ-LIN-IVR-M', '784920195002', 'M', 'Warm Ivory', '#F4F1EA', 140.0, 360.0, 9],
        ['v_blz_l_ivory', 'p_blazer', 'BLZ-LIN-IVR-L', '784920195003', 'L', 'Warm Ivory', '#F4F1EA', 140.0, 360.0, 2],
      ];

      const allVariants = [...dressVariants, ...coatVariants, ...toteVariants, ...blazerVariants];

      for (const v of allVariants) {
        const [id, prodId, sku, barcode, size, color, colorCode, pPrice, sPrice, qty] = v;
        insertVariant.run(id, prodId, sku, barcode, size, color, colorCode, pPrice, sPrice);
        insertInv.run(`inv_${id}`, id, qty, 3);
        insertMove.run(
          `mov_init_${id}`,
          id,
          0,
          qty,
          qty,
          'received',
          'Initial boutique opening stock delivery',
          'PO-INIT-2026',
          'u_admin'
        );
      }
    });

    transaction();
  }

  // Check and seed sample transactions, customers, expenses, shift
  const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: any };
  if (Number(salesCount?.count || 0) === 0) {
    console.log('[Seed] Seeding sample store customers, sales, and operational expenses...');
    seedSampleTransactions();
  }

  console.log('[Seed] Database verified with Hirbit Store retail catalog!');
}

export function seedSampleTransactions() {
  try {
    // 9. Customers
    const insertCust = db.prepare(`
      INSERT INTO customers (id, full_name, phone, email, address, birthday, loyalty_points, total_spent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO NOTHING
    `);
    insertCust.run('c_1', 'Lady Genevieve Sterling', '+1 (555) 912-3049', 'g.sterling@mayfair.co.uk', '744 Park Avenue, Penthouse B, New York', '1988-06-14', 450, 4280.0, 'Prefers private salon viewings. Likes Champagne tones.');
    insertCust.run('c_2', 'Dr. Sebastian Vance', '+1 (555) 843-1190', 'sebastian.vance@chicago.edu', '120 E Delaware Pl, Chicago, IL', '1982-11-20', 180, 1540.0, 'Tailored size 40R / Medium fits.');
    insertCust.run('c_3', 'Elena Rostova', '+1 (555) 438-7261', 'elena.rostova@designstudio.com', '45 Mercer Street, SoHo, NY', '1992-03-05', 320, 2980.0, 'Regular client for seasonal outerwear and leatherware.');
    insertCust.run('c_4', 'Marcus Aurelius Thorne', '+1 (555) 231-8840', 'm.thorne@capitalholdings.com', '100 Worth Avenue, Palm Beach, FL', '1975-09-12', 590, 5600.0, 'VIP Platinum Tier member.');

    // 10. Sample Sales Transactions with realistic audit trail
    const insertSale = db.prepare(`
      INSERT INTO sales (id, receipt_number, cashier_id, customer_id, subtotal, discount_amount, discount_type, tax_rate, tax_amount, total_amount, payment_status, payment_method, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW() + (?::interval))
      ON CONFLICT (id) DO NOTHING
    `);

    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (id, sale_id, variant_id, product_name, variant_details, quantity, unit_price, cost_price, discount, total, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() + (?::interval))
      ON CONFLICT (id) DO NOTHING
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (id, sale_id, payment_method, amount, status, transaction_ref, created_at)
      VALUES (?, ?, ?, ?, 'completed', ?, NOW() + (?::interval))
      ON CONFLICT (id) DO NOTHING
    `);

    // Sale 1 (Yesterday)
    insertSale.run('sale_001', 'REC-2026-0081', 'u_cashier', 'c_1', 860.0, 50.0, 'fixed', 0.08, 64.8, 874.8, 'card', 'VIP client salon purchase', '-1 day');
    insertSaleItem.run('si_001_1', 'sale_001', 'v_pumps_eu_38', 'Saint-Honoré Satin Pointed-Toe Pumps', 'Size EU 38 · Champagne Satin', 1, 540.0, 210.0, 0, 540.0, '-1 day');
    insertSaleItem.run('si_001_2', 'sale_001', 'v_perfume_100ml', 'Rose de Grasse Extrait de Parfum', 'Volume 100ml · French Rose', 1, 320.0, 110.0, 50.0, 270.0, '-1 day');
    insertPayment.run('pay_001', 'sale_001', 'card', 874.8, 'TXN_CH_994821', '-1 day');

    // Sale 2 (2 days ago)
    insertSale.run('sale_002', 'REC-2026-0082', 'u_cashier', 'c_2', 2400.0, 0.0, 'fixed', 0.08, 192.0, 2592.0, 'cash', 'Private salon fitting', '-2 days');
    insertSaleItem.run('si_002_1', 'sale_002', 'v_ring_us_7', 'Aurum 18K Diamond Solitaire Ring', 'Size US 7 · 18K Yellow Gold', 1, 2400.0, 1100.0, 0, 2400.0, '-2 days');
    insertPayment.run('pay_002', 'sale_002', 'cash', 2592.0, 'CASH_REG_01', '-2 days');

    // Sale 3 (3 days ago)
    insertSale.run('sale_003', 'REC-2026-0083', 'u_manager', 'c_3', 780.0, 0.0, 'fixed', 0.08, 62.4, 842.4, 'mobile', 'Apple Pay contactless', '-3 days');
    insertSaleItem.run('si_003_1', 'sale_003', 'v_sunglasses_gloss_noir', 'Venetian Acetate Bold Cat-Eye Sunglasses', 'Standard · Gloss Noir', 2, 390.0, 130.0, 0, 780.0, '-3 days');
    insertPayment.run('pay_003', 'sale_003', 'mobile', 842.4, 'APAY_REF_44120', '-3 days');

    // 11. Expense Categories & Expenses
    const insertExpCat = db.prepare('INSERT INTO expense_categories (id, name, description) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING');
    insertExpCat.run('ec_merch', 'Visual Merchandising & Florals', 'Boutique floral arrangements, scents, and window displays');
    insertExpCat.run('ec_packaging', 'Luxury Packaging & Ribbons', 'Custom embossed gift boxes, dust bags, and grosgrain ribbons');
    insertExpCat.run('ec_tailoring', 'Master Tailoring & Alterations', 'In-house alterations and fitting supplies');
    insertExpCat.run('ec_utilities', 'Boutique Operations & Utilities', 'Showroom power, high-speed fiber, salon refreshments');

    const insertExp = db.prepare(`
      INSERT INTO expenses (id, category_id, title, description, amount, payment_method, expense_date, recorded_by_id)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE + (?::interval), ?)
      ON CONFLICT (id) DO NOTHING
    `);
    insertExp.run('exp_1', 'ec_merch', 'Weekly Salon White Lilies & Orchid Arrangements', 'Fresh seasonal floral display for boutique entry table and dressing salons', 320.0, 'card', '-1 day', 'u_manager');
    insertExp.run('exp_2', 'ec_packaging', 'Custom Gold Foil Embossed Magnetic Boxes (500 units)', 'Order of luxury gift boxes from Florentine cartonnerie', 850.0, 'bank_transfer', '-4 days', 'u_admin');
    insertExp.run('exp_3', 'ec_utilities', 'Chilled Vintage Champagne & Artisan Mineral Water', 'Hospitality refreshments for private VIP fitting sessions', 180.0, 'card', '-6 days', 'u_manager');

    // 12. Active Shift for Camille
    const insertShift = db.prepare(`
      INSERT INTO shifts (id, user_id, start_time, starting_cash, cash_sales, card_sales, total_sales, status, notes)
      VALUES (?, ?, NOW() - INTERVAL '3 hours', 250.0, 961.2, 1134.0, 2095.2, 'active', 'Morning shift on POS Terminal 01')
      ON CONFLICT (id) DO NOTHING
    `);
    insertShift.run('shift_current_01', 'u_cashier');

    // 13. Business Settings
    const insertSettings = db.prepare(`
      INSERT INTO business_settings (id, business_name, tagline, phone, email, address, currency_code, currency_symbol, tax_rate, low_stock_threshold, receipt_header, receipt_footer, allow_negative_inventory, return_policy_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 14)
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        address = EXCLUDED.address,
        currency_code = EXCLUDED.currency_code,
        currency_symbol = EXCLUDED.currency_symbol,
        receipt_header = EXCLUDED.receipt_header,
        receipt_footer = EXCLUDED.receipt_footer
    `);
    insertSettings.run(
      'cfg_default',
      'Hirbit Store',
      'Retail Inventory & Quality Goods',
      '+251 91 123 4567',
      'contact@hirbitstore.com',
      'Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa',
      'ETB',
      'ETB',
      0.15,
      5,
      'HIRBIT STORE · HAWASSA PIYASSA MALL',
      'Thank you for shopping at Hirbit Store! Merchandise with receipt may be exchanged within 14 days.'
    );

    // 14. Notifications
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, type, title, message, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW() + (?::interval))
      ON CONFLICT (id) DO NOTHING
    `);
    insertNotif.run('notif_1', 'low_stock', 'Low Stock Alert: The Aurelius Camel Coat', 'Only 1 unit remaining for Camel / Size L (Threshold: 3 units).', '/inventory', '-2 hours');
    insertNotif.run('notif_2', 'low_stock', 'Low Stock Alert: Seraphine Silk Slip Gown', 'Size L Champagne has 2 units remaining in stock.', '/inventory', '-5 hours');
    insertNotif.run('notif_3', 'new_sale', 'VIP Sale Completed #REC-2026-0081', 'Lady Genevieve Sterling completed purchase of $1,134.00.', '/sales', '-1 day');

    // 15. Initial Audit Log
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1')
      ON CONFLICT (id) DO NOTHING
    `);
    insertAudit.run('aud_1', 'u_admin', 'SYSTEM_INIT', 'SYSTEM', 'SYSTEM', '{"event": "Boutique database initialized with full RBAC roles and luxury catalog"}');
    insertAudit.run('aud_2', 'u_admin', 'STOCK_SEEDED', 'INVENTORY', 'MULTIPLE', '{"total_variants_seeded": 14, "opening_valuation": 41200.00}');
    console.log('[Seed] Sample transactions, customers, and expenses successfully seeded!');
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
}
