const https = require('https');
const bcrypt = require('bcryptjs');
const { neon, neonConfig } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_oI4rayADz6PF@ep-little-river-becpm4wi-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Defensive IPv4 fetch handler
function ipv4Fetch(url, options = {}) {
  const urlObj = new URL(url.toString());
  return new Promise((resolve, reject) => {
    const req = https.request(urlObj, {
      method: options.method || 'POST',
      headers: options.headers || {},
      family: 4,
      timeout: 15000
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const bodyText = Buffer.concat(chunks).toString('utf8');
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: new Headers(res.headers),
          text: async () => bodyText,
          json: async () => JSON.parse(bodyText)
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Neon HTTPS request timed out'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

neonConfig.fetchFunction = ipv4Fetch;

async function run() {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123456', salt);
  const storePersonHash = bcrypt.hashSync('manager123456', salt);
  const salesHash = bcrypt.hashSync('cashier123456', salt);

  console.log('Admin Hash:', adminHash);
  console.log('Manager Hash:', storePersonHash);
  console.log('Sales Hash:', salesHash);

  const sql = neon(connectionString);

  console.log('Connecting to Neon PostgreSQL over HTTPS...');

  // 1. Upsert profiles
  await sql`
    INSERT INTO profiles (id, username, email, password_hash, full_name, role, is_active, phone, avatar_url)
    VALUES 
      ('u_admin', 'vivienne_owner', 'admin@hirbitstore.com', ${adminHash}, 'Vivienne Laurent', 'admin', 1, '+251 91 123 4567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
      ('u_manager', 'julian_store', 'storeperson@hirbitstore.com', ${storePersonHash}, 'Julian Vance', 'store_person', 1, '+251 91 123 4568', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
      ('u_cashier', 'camille_sales', 'sales@hirbitstore.com', ${salesHash}, 'Camille Moreau', 'sales', 1, '+251 91 123 4569', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = 1,
      phone = EXCLUDED.phone;
  `;
  console.log('Upsert successful!');

  // 2. Query and display the verified profiles
  const profiles = await sql`
    SELECT id, username, email, full_name, role, is_active, LEFT(password_hash, 15) as hash_preview
    FROM profiles
    WHERE id IN ('u_admin', 'u_manager', 'u_cashier')
    ORDER BY role;
  `;

  console.log('Verified database profiles:');
  console.table(profiles);

  // 3. Test bcrypt compare
  const adminMatch = bcrypt.compareSync('admin123456', adminHash);
  const managerMatch = bcrypt.compareSync('manager123456', storePersonHash);
  const cashierMatch = bcrypt.compareSync('cashier123456', salesHash);
  console.log('Password verification check:');
  console.log('Admin password valid:', adminMatch);
  console.log('Manager password valid:', managerMatch);
  console.log('Cashier password valid:', cashierMatch);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
