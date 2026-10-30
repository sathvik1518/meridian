import bcrypt from "bcryptjs";
import { SCHEMA } from "./schema.js";

// Fills an empty database with believable retail data. A seeded random generator means
// every fresh install gets the same catalogue, so demos and tests are repeatable.
function makeRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES = [
  {
    slug: "laptops",
    name: "Laptops",
    brands: ["Lumen", "Northwind", "Kestrel", "Aerolite"],
    nouns: ["Laptop", "Ultrabook", "Notebook"],
    price: [549, 2199],
    blurbs: ["Thin, fast and built for a full day away from the charger.", "A sharp display and a quiet keyboard for long work sessions."],
  },
  {
    slug: "smartphones",
    name: "Smartphones",
    brands: ["Orbit", "Pixelon", "Vanta", "Solace"],
    nouns: ["Phone", "Smartphone", "Mini Phone"],
    price: [199, 1299],
    blurbs: ["A bright display and a camera that handles low light well.", "Two-day battery life with fast wired and wireless charging."],
  },
  {
    slug: "audio",
    name: "Audio",
    brands: ["Halo", "Resonant", "Tonic", "Cadence"],
    nouns: ["Headphones", "Earbuds", "Speaker", "Soundbar"],
    price: [29, 449],
    blurbs: ["Balanced sound with active noise cancelling.", "Clear vocals, deep bass and a battery that lasts the week."],
  },
  {
    slug: "wearables",
    name: "Wearables",
    brands: ["Pulse", "Stride", "Meridian", "Tempo"],
    nouns: ["Smartwatch", "Fitness Band", "Tracker"],
    price: [49, 599],
    blurbs: ["Tracks sleep, heart rate and workouts without nagging.", "A bright always-on display and seven days of battery."],
  },
  {
    slug: "cameras",
    name: "Cameras",
    brands: ["Aperture", "Fjord", "Vireo", "Lumos"],
    nouns: ["Mirrorless Camera", "Action Cam", "Compact Camera"],
    price: [149, 2499],
    blurbs: ["Sharp stills and smooth 4K video in a body that fits a bag.", "Fast autofocus that keeps up with moving subjects."],
  },
  {
    slug: "gaming",
    name: "Gaming",
    brands: ["Vortex", "Ironclad", "Nexa", "Blitz"],
    nouns: ["Controller", "Gaming Mouse", "Mechanical Keyboard", "Headset"],
    price: [25, 399],
    blurbs: ["Low latency and a comfortable grip for marathon sessions.", "Customisable lighting and tactile, reliable switches."],
  },
  {
    slug: "home-office",
    name: "Home Office",
    brands: ["Deskly", "Ergon", "Plank", "Orchard"],
    nouns: ["Standing Desk", "Monitor", "Office Chair", "Desk Lamp"],
    price: [39, 899],
    blurbs: ["Designed to keep you comfortable through the whole workday.", "Clean lines, solid build and easy assembly."],
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    brands: ["Hearth", "Saffron", "Copperleaf", "Brio"],
    nouns: ["Air Fryer", "Espresso Machine", "Blender", "Kettle"],
    price: [24, 649],
    blurbs: ["Heats quickly, cleans easily and looks good on the counter.", "Consistent results with simple, intuitive controls."],
  },
  {
    slug: "fitness",
    name: "Fitness",
    brands: ["Ascent", "Ironleaf", "Kinetic", "Flexa"],
    nouns: ["Yoga Mat", "Dumbbell Set", "Resistance Bands", "Jump Rope"],
    price: [12, 349],
    blurbs: ["Durable materials that hold up to daily training.", "Compact enough for a small apartment, sturdy enough for heavy use."],
  },
  {
    slug: "accessories",
    name: "Accessories",
    brands: ["Linkr", "Volt", "Carry", "Nimbus"],
    nouns: ["Charger", "Backpack", "USB-C Hub", "Phone Case", "Power Bank"],
    price: [9, 189],
    blurbs: ["Small upgrade, big difference in daily use.", "Tough, tidy and travel-friendly."],
  },
];

const SERIES = ["Aero", "Nova", "Pulse", "Vertex", "Atlas", "Orbit", "Zenith", "Echo", "Drift", "Apex", "Flux", "Ember"];

const MODELS = ["2", "3", "5", "7", "9", "11", "13", "14", "15", "16", "Pro", "Max", "Lite", "Air", "Plus", "SE"];

const FIRST = [
  "Aisha",
  "Daniel",
  "Sofia",
  "Arjun",
  "Hannah",
  "Mateo",
  "Priya",
  "Lucas",
  "Emma",
  "Noah",
  "Zara",
  "Ethan",
  "Mei",
  "Omar",
  "Chloe",
  "Rohan",
  "Isla",
  "Kenji",
  "Amara",
  "Victor",
];

const LAST = [
  "Patel",
  "Okafor",
  "Rossi",
  "Mehta",
  "Lee",
  "Silva",
  "Nair",
  "Novak",
  "Haddad",
  "Kim",
  "Brown",
  "Garcia",
  "Tanaka",
  "Larsen",
  "Singh",
  "Moreau",
  "Diaz",
  "Khan",
  "Ivanov",
  "Reddy",
];

const CITIES = [
  "Hyderabad",
  "Austin",
  "Berlin",
  "Toronto",
  "Singapore",
  "Lisbon",
  "Chicago",
  "Sydney",
  "Nairobi",
  "Seattle",
  "Dublin",
  "Mumbai",
];

const STAFF = [
  { name: "Maya Chen", email: "admin@meridian.dev", role: "admin", title: "Head of Operations", password: "admin123" },
  { name: "Leo Alvarez", email: "viewer@meridian.dev", role: "viewer", title: "Merchandising Analyst", password: "viewer123" },
  { name: "Priya Nair", email: "priya@meridian.dev", role: "admin", title: "Inventory Lead", password: "meridian123" },
  { name: "Daniel Okafor", email: "daniel@meridian.dev", role: "viewer", title: "Customer Support", password: "meridian123" },
  { name: "Sofia Rossi", email: "sofia@meridian.dev", role: "viewer", title: "Finance Analyst", password: "meridian123" },
  { name: "Arjun Mehta", email: "arjun@meridian.dev", role: "viewer", title: "Warehouse Supervisor", password: "meridian123" },
];

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

const money = (n) => Math.round(n * 100) / 100;

// Insert many rows with ONE query (INSERT ... VALUES (...),(...),...). Seeding hundreds of rows one by one
// is slow on a hosted database, because every query is a network round trip.
async function insertMany(q, table, columns, rows, returning = "id") {
  if (!rows.length) return [];
  const params = [];
  const tuples = rows.map((row) => `(${row.map((v) => `$${params.push(v)}`).join(",")})`);
  return q.query(`INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(",")} RETURNING ${returning}`, params);
}

export async function initDb(db) {
  // One transaction + an advisory lock: if several serverless instances start at once, they take turns
  // instead of creating the tables (or the seed data) twice.
  await db.tx(async (q) => {
    await q.query("SELECT pg_advisory_xact_lock(7342)");
    for (const statement of SCHEMA.split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await q.query(statement);
    const [{ n }] = await q.query("SELECT COUNT(*)::int AS n FROM users");
    // SEED_DEMO=off starts with an EMPTY workspace (just the two logins + categories).
    if (n === 0) await seed(q, process.env.SEED_DEMO !== "off");
  });
}

async function seed(q, demo) {
  const rand = makeRandom(20261030);
  const DAY = 86_400_000;
  const now = Date.now();
  const ago = (ms) => new Date(now - ms).toISOString();
  // Staff accounts
  const hashes = new Map();
  const userIds = [];
  for (const s of demo ? STAFF : STAFF.slice(0, 2)) {
    if (!hashes.has(s.password)) hashes.set(s.password, await bcrypt.hash(s.password, 10));
    const [row] = await q.query(
      "INSERT INTO users (name, email, password_hash, role, title, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [s.name, s.email, hashes.get(s.password), s.role, s.title, ago((60 + Math.floor(rand() * 200)) * DAY)],
    );
    userIds.push(row.id);
  }
  for (const c of CATEGORIES) await q.query("INSERT INTO categories (slug, name) VALUES ($1,$2)", [c.slug, c.name]);
  if (demo) await seedCatalog(q, rand, userIds, ago, DAY);
}

// Sample products, customers, orders and activity (the "demo data").
async function seedCatalog(q, rand, userIds, ago, DAY) {
  // Products: build every row in memory first, then insert them all with one query.
  const titles = new Set();
  const productRows = [];
  let counter = 0;
  for (const [ci, c] of CATEGORIES.entries()) {
    for (let i = 0; i < 12; i++) {
      const brand = c.brands[i % c.brands.length];
      const noun = c.nouns[(i + ci) % c.nouns.length];
      let title = "";
      for (let attempt = 0; !title || titles.has(title); attempt++) {
        title = `${brand} ${pick(rand, SERIES)} ${pick(rand, MODELS)} ${noun}`;
        if (attempt > 20) title += ` ${String.fromCharCode(65 + attempt - 20)}`;
      }
      titles.add(title);
      const [lo, hi] = c.price;
      const price = money(lo + (hi - lo) * rand() ** 1.6);
      const roll = rand();
      const depth = price > 800 ? 45 : price > 300 ? 90 : 220; // pricey items are stocked thinner
      const stock = roll < 0.07 ? 0 : roll < 0.3 ? 1 + Math.floor(rand() * 15) : 16 + Math.floor(rand() * (depth - 15));
      const discount = rand() < 0.4 ? 0 : 3 + Math.floor(rand() * 23);
      const rating = Math.min(4.9, Math.round((3.1 + rand() * 1.8) * 10) / 10);
      const created = ago(Math.floor(rand() * 300) * DAY);
      productRows.push([
        `MRD-${c.slug.slice(0, 3).toUpperCase()}-${1000 + counter++}`,
        title,
        brand,
        c.slug,
        `${noun} from ${brand}. ${pick(rand, c.blurbs)}`,
        price,
        discount,
        stock,
        rating,
        created,
        created,
      ]);
    }
  }
  const products = await insertMany(
    q,
    "products",
    ["sku", "title", "brand", "category", "description", "price", "discount_percentage", "stock", "rating", "created_at", "updated_at"],
    productRows,
    "id, title, price::float8 AS price, discount_percentage::float8 AS discount",
  );
  const productIds = products.map((p) => p.id);

  // Customers
  const customerRows = [];
  for (let i = 0; i < 40; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7 + 3) % LAST.length];
    customerRows.push([`${first} ${last}`, `${first}.${last}${i}@example.com`.toLowerCase(), pick(rand, CITIES)]);
  }
  const customerIds = (await insertMany(q, "customers", ["name", "email", "city"], customerRows)).map((c) => c.id);

  // Orders from the last 120 days (more recent days are busier), each with 1-4 line items
  const orderRows = [];
  const lineSpecs = []; // lineSpecs[i] = the lines of orderRows[i]
  for (let i = 0; i < 180; i++) {
    const ageDays = 120 * rand() ** 1.5;
    const status =
      ageDays > 14
        ? rand() < 0.88
          ? "delivered"
          : "cancelled"
        : ageDays > 4
          ? rand() < 0.6
            ? "delivered"
            : "shipped"
          : pick(rand, ["pending", "processing", "processing", "shipped"]);
    orderRows.push([pick(rand, customerIds), status, ago(ageDays * DAY)]);
    const lines = [];
    for (let l = 0, n = 1 + Math.floor(rand() * 4); l < n; l++) {
      const p = pick(rand, products);
      const maxQty = p.price < 60 ? 5 : p.price < 400 ? 3 : 2;
      lines.push([p.id, p.title, p.price, p.discount, 1 + Math.floor(rand() * maxQty)]);
    }
    lineSpecs.push(lines);
  }
  const orders = await insertMany(q, "orders", ["customer_id", "status", "created_at"], orderRows);
  const itemRows = orders.flatMap((o, i) => lineSpecs[i].map(([pid, title, price, disc, qty]) => [o.id, pid, title, price, disc, qty]));
  await insertMany(q, "order_items", ["order_id", "product_id", "title", "price", "discount_percentage", "quantity"], itemRows);

  // A little history for the dashboard's activity feed
  const names = (await q.query("SELECT id, name FROM users WHERE id = ANY($1) ORDER BY id", [userIds])).map((u) => u.name);
  const history = [
    [0, "restocked", "product", String(productIds[3]), "Added 60 units"],
    [1, "updated", "product", String(productIds[17]), "Changed price"],
    [0, "created", "product", String(productIds[41]), "New listing"],
    [1, "restocked", "product", String(productIds[26]), "Added 120 units"],
    [0, "updated", "order", String(orders[11].id), "Marked as shipped"],
  ];
  await insertMany(
    q,
    "audit_log",
    ["user_id", "user_name", "action", "entity", "entity_id", "detail", "created_at"],
    history.map(([who, action, entity, entityId, detail], h) => [
      userIds[who],
      names[who],
      action,
      entity,
      entityId,
      detail,
      ago((h + 1) * 3.5 * 3_600_000 * 6),
    ]),
  );
}

// ---- Admin tools: start empty / bring the samples back ----

export async function clearData(q) {
  for (const table of ["order_items", "orders", "restock_items", "restock_orders", "customers", "audit_log", "products"])
    await q.query(`DELETE FROM ${table}`);
}

export async function loadDemoData(q) {
  const users = await q.query("SELECT id FROM users ORDER BY id LIMIT 2");
  const ago = (ms) => new Date(Date.now() - ms).toISOString();
  await seedCatalog(
    q,
    makeRandom(20261030),
    users.map((u) => u.id),
    ago,
    86_400_000,
  );
}