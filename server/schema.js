// The whole database design in one place. "IF NOT EXISTS" makes it safe to run on every start.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  title         TEXT NOT NULL DEFAULT '',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id                  SERIAL PRIMARY KEY,
  sku                 TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  brand               TEXT NOT NULL DEFAULT '',
  category            TEXT NOT NULL REFERENCES categories(slug),
  description         TEXT NOT NULL DEFAULT '',
  price               NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 90),
  stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating              NUMERIC(3, 2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_stock_idx ON products (stock);

CREATE TABLE IF NOT EXISTS customers (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL,
  city  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status      TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id                  SERIAL PRIMARY KEY,
  order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          INTEGER REFERENCES products(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  price               NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  quantity            INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS restock_orders (
  id         SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restock_items (
  id         SERIAL PRIMARY KEY,
  restock_id INTEGER NOT NULL REFERENCES restock_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER,
  user_name  TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
