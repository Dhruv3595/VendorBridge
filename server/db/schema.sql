DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS rfq_vendors;
DROP TABLE IF EXISTS rfq_items;
DROP TABLE IF EXISTS rfqs;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Officer', 'Vendor', 'Manager')),
  organization_id INTEGER DEFAULT 1,
  vendor_id INTEGER,
  phone VARCHAR(30),
  country VARCHAR(80),
  photo_url TEXT,
  status VARCHAR(30) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER DEFAULT 1,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  gst_number VARCHAR(50),
  contact_person VARCHAR(120),
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  status VARCHAR(30) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfqs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER DEFAULT 1,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(100),
  deadline DATE,
  description TEXT,
  status VARCHAR(30) DEFAULT 'Draft',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_items (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit VARCHAR(30)
);

CREATE TABLE rfq_vendors (
  rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  PRIMARY KEY (rfq_id, vendor_id)
);

CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  tax_percent NUMERIC(5, 2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(30) DEFAULT 'Submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX quotations_one_vendor_per_rfq
ON quotations (rfq_id, vendor_id);

CREATE TABLE quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  delivery_days INTEGER
);

CREATE TABLE approvals (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  level INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'Pending',
  remarks TEXT,
  acted_at TIMESTAMP
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER DEFAULT 1,
  rfq_id INTEGER REFERENCES rfqs(id) ON DELETE SET NULL,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'Generated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER DEFAULT 1,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date DATE,
  due_date DATE,
  status VARCHAR(30) DEFAULT 'Pending Payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX invoices_one_per_purchase_order
ON invoices (po_id);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER DEFAULT 1,
  action VARCHAR(120) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
