-- ============================================================
-- VendorBridge Demo Seed Data
-- Passwords for all users: Admin@123
-- bcrypt hash for 'Admin@123'
-- ============================================================

-- Users (Role-based passwords e.g., admin123, officer123)
INSERT INTO users (name, email, password_hash, role, phone, country, photo_url)
VALUES
  ('Admin User',          'admin@vendorbridge.com',   '$2a$10$SrqmVLMwQJezy.V.6msTLuq/DqcPtIl5cXdzwecOcR33oz.iSNbFS', 'Admin',   '9876543210', 'India', NULL),
  ('Procurement Officer', 'officer@vendorbridge.com', '$2a$10$5.7.WUGGTsWzZBEd.FdGBe3Wt4S8MIzXbJERGWqOeJlq0hYjBXi76', 'Officer', '9876543211', 'India', NULL),
  ('Vendor User',         'vendor@vendorbridge.com',  '$2a$10$q.SQF2AcAF60L44SFNt2huWgjz1ss5RtWLK0Mk2lvyc32TmXQs06q', 'Vendor',  '9876543212', 'India', NULL),
  ('Manager Approver',    'manager@vendorbridge.com', '$2a$10$mXI13TmF6scf90540ui7aeEaNv6qpoUTXrpjnVVcSytbnU8m7AJmG', 'Manager', '9876543213', 'India', NULL),
  ('Vendor Two',          'vendor2@vendorbridge.com', '$2a$10$q.SQF2AcAF60L44SFNt2huWgjz1ss5RtWLK0Mk2lvyc32TmXQs06q', 'Vendor',  '9876543214', 'India', NULL);

-- Vendors
INSERT INTO vendors (name, category, gst_number, contact_person, phone, email, address, status)
VALUES
  ('Apex Office Supplies',  'Office Supplies', '27AABCA1234A1Z5', 'Ravi Shah',    '9000000001', 'sales@apexsupplies.com',  'Mumbai, Maharashtra',    'Active'),
  ('Bright Tech Systems',   'IT Hardware',     '29AABCB5678B1Z3', 'Neha Rao',     '9000000002', 'contact@brighttech.com',  'Bengaluru, Karnataka',   'Active'),
  ('GreenBuild Materials',  'Construction',    '07AABCG9012C1Z8', 'Amit Verma',   '9000000003', 'orders@greenbuild.com',   'Delhi, India',           'Active'),
  ('SwiftLog Logistics',    'Services',        '09AABCS3456D1Z2', 'Priya Sharma', '9000000004', 'info@swiftlog.in',        'Pune, Maharashtra',      'Active'),
  ('PrimeFurniture Co.',    'Furniture',       '19AABCP7890E1Z7', 'Suresh Nair',  '9000000005', 'sales@primefurniture.com','Chennai, Tamil Nadu',    'Blocked');

-- Link vendor users to vendor records
UPDATE users SET vendor_id = 2 WHERE email = 'vendor@vendorbridge.com';
UPDATE users SET vendor_id = 3 WHERE email = 'vendor2@vendorbridge.com';

-- RFQs
INSERT INTO rfqs (title, category, deadline, description, status, created_by)
VALUES
  ('Laptop Procurement Q1',          'IT Hardware',     CURRENT_DATE + INTERVAL '10 days',  'Need 20 laptops for the operations team.',                   'Published',        2),
  ('Office Chair Purchase',           'Office Supplies', CURRENT_DATE + INTERVAL '7 days',   'Ergonomic chairs for the new office floor.',                  'Approval Pending', 2),
  ('Server Infrastructure Upgrade',   'IT Hardware',     CURRENT_DATE + INTERVAL '15 days',  'Rack servers and networking equipment for data centre.',      'Quotation Received',2),
  ('Annual Stationery Supply',        'Office Supplies', CURRENT_DATE - INTERVAL '2 days',   'Pens, notebooks, folders and miscellaneous stationery.',      'PO Generated',     2),
  ('Canteen Furniture',               'Furniture',       CURRENT_DATE + INTERVAL '20 days',  'Tables and chairs for the company canteen.',                  'Draft',            2);

-- RFQ Items
INSERT INTO rfq_items (rfq_id, item_name, quantity, unit) VALUES
  (1, 'Business Laptop',    20, 'pcs'),
  (2, 'Ergonomic Chair',    35, 'pcs'),
  (3, 'Rack Server 2U',      4, 'pcs'),
  (3, 'Network Switch 48P',  2, 'pcs'),
  (4, 'A4 Notebook',       200, 'pcs'),
  (4, 'Ballpoint Pen',      500,'pcs'),
  (5, 'Canteen Table',      10, 'pcs'),
  (5, 'Canteen Chair',      40, 'pcs');

-- RFQ Vendor Assignments
INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES
  (1, 2), (1, 3),
  (2, 1), (2, 2),
  (3, 2), (3, 3),
  (4, 1), (4, 4),
  (5, 5);

-- Quotations (vendor_id 2 = Bright Tech Systems, vendor_id 1 = Apex, vendor_id 3 = GreenBuild)
INSERT INTO quotations (rfq_id, vendor_id, tax_percent, notes, status, submitted_at) VALUES
  (1, 2, 18, 'Includes 1-year on-site warranty.',          'Submitted',    NOW() - INTERVAL '2 days'),
  (1, 3, 18, 'Delivery within 12 days. No warranty.',      'Submitted',    NOW() - INTERVAL '1 day'),
  (2, 1, 18, 'Delivery in 7 days. Standard quality.',      'Selected',     NOW() - INTERVAL '5 days'),
  (2, 2, 18, 'Premium ergonomic range. 14-day delivery.',  'Not Selected', NOW() - INTERVAL '5 days'),
  (3, 2, 18, 'Enterprise servers with 3-yr support.',      'Submitted',    NOW() - INTERVAL '1 day'),
  (4, 1, 5,  'Bulk discount applied. Immediate delivery.', 'Submitted',    NOW() - INTERVAL '10 days');

-- Quotation Items
INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days) VALUES
  (1, 'Business Laptop',    20, 55000, 12),
  (2, 'Business Laptop',    20, 52000, 12),
  (3, 'Ergonomic Chair',    35,  6500,  7),
  (4, 'Ergonomic Chair',    35,  7200, 14),
  (5, 'Rack Server 2U',      4, 95000, 20),
  (5, 'Network Switch 48P',  2, 32000, 10),
  (6, 'A4 Notebook',       200,    45,  3),
  (6, 'Ballpoint Pen',      500,    12,  3);

-- Approvals
INSERT INTO approvals (quotation_id, approver_id, level, status, remarks, acted_at) VALUES
  (3, 4, 1, 'Approved', 'Good pricing and reliable vendor.',                     NOW() - INTERVAL '4 days'),
  (1, 4, 1, 'Pending',  NULL,                                                    NULL),
  (6, 4, 1, 'Approved', 'Approved. Budget within limits for annual stationery.', NOW() - INTERVAL '9 days');

-- Purchase Orders
INSERT INTO purchase_orders (rfq_id, quotation_id, po_number, status, created_at) VALUES
  (2, 3, 'PO-2026-00001', 'Generated',  NOW() - INTERVAL '3 days'),
  (4, 6, 'PO-2026-00002', 'Completed',  NOW() - INTERVAL '8 days');

-- Update RFQ 4 status to PO Generated
UPDATE rfqs SET status = 'PO Generated' WHERE id = 4;

-- Invoices
INSERT INTO invoices (po_id, invoice_number, invoice_date, due_date, status) VALUES
  (1, 'INV-2026-00001', CURRENT_DATE - INTERVAL '3 days',  CURRENT_DATE + INTERVAL '27 days', 'Pending Payment'),
  (2, 'INV-2026-00002', CURRENT_DATE - INTERVAL '8 days',  CURRENT_DATE - INTERVAL '2 days',  'Overdue');

-- Activity Logs (immutable audit trail)
INSERT INTO activity_logs (action, description, user_id, created_at) VALUES
  ('Vendor created',      'Bright Tech Systems was added.',                                              1, NOW() - INTERVAL '30 days'),
  ('Vendor created',      'Apex Office Supplies was added.',                                             1, NOW() - INTERVAL '29 days'),
  ('Vendor created',      'GreenBuild Materials was added.',                                             1, NOW() - INTERVAL '28 days'),
  ('RFQ created',         'Laptop Procurement Q1 was created.',                                          2, NOW() - INTERVAL '14 days'),
  ('RFQ published',       'Laptop Procurement Q1 published and sent to 2 vendors.',                      2, NOW() - INTERVAL '14 days'),
  ('RFQ created',         'Office Chair Purchase was created.',                                          2, NOW() - INTERVAL '12 days'),
  ('RFQ published',       'Office Chair Purchase published and sent to 2 vendors.',                      2, NOW() - INTERVAL '12 days'),
  ('Quotation submitted', 'Vendor Apex Office Supplies submitted quotation for RFQ Office Chair Purchase.', 3, NOW() - INTERVAL '5 days'),
  ('Quotation selected',  'Quotation #3 selected for RFQ #2; approval #1 created.',                     2, NOW() - INTERVAL '5 days'),
  ('Approval approved',   'Approval #1 was approved.',                                                   4, NOW() - INTERVAL '4 days'),
  ('PO generated',        'Purchase Order PO-2026-00001 created for quotation #3.',                      4, NOW() - INTERVAL '4 days'),
  ('Invoice generated',   'Invoice INV-2026-00001 generated for PO-2026-00001.',                         2, NOW() - INTERVAL '3 days'),
  ('RFQ created',         'Annual Stationery Supply was created.',                                       2, NOW() - INTERVAL '11 days'),
  ('RFQ published',       'Annual Stationery Supply published and sent to 2 vendors.',                   2, NOW() - INTERVAL '11 days'),
  ('Quotation submitted', 'Vendor Apex Office Supplies submitted quotation for Annual Stationery Supply.',3, NOW() - INTERVAL '10 days'),
  ('Approval approved',   'Approval #3 was approved.',                                                   4, NOW() - INTERVAL '9 days'),
  ('PO generated',        'Purchase Order PO-2026-00002 created for quotation #6.',                      4, NOW() - INTERVAL '9 days'),
  ('Invoice generated',   'Invoice INV-2026-00002 generated for PO-2026-00002.',                         2, NOW() - INTERVAL '8 days'),
  ('Seed data created',   'Initial demo records were loaded.',                                            1, NOW() - INTERVAL '1 day');
