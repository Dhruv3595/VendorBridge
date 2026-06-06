INSERT INTO users (name, email, password_hash, role, phone, country, photo_url)
VALUES
  ('Admin User', 'admin@vendorbridge.com', '$2a$10$Lou8.HPlLdFiGBk21fdvXOuvANGSoI2FHLMwCMbkx/sz39mRTQXku', 'Admin', '9876543210', 'India', NULL),
  ('Procurement Officer', 'officer@vendorbridge.com', '$2a$10$Lou8.HPlLdFiGBk21fdvXOuvANGSoI2FHLMwCMbkx/sz39mRTQXku', 'Officer', '9876543211', 'India', NULL),
  ('Vendor User', 'vendor@vendorbridge.com', '$2a$10$Lou8.HPlLdFiGBk21fdvXOuvANGSoI2FHLMwCMbkx/sz39mRTQXku', 'Vendor', '9876543212', 'India', NULL);

INSERT INTO vendors (name, category, gst_number, contact_person, phone, email, address, status)
VALUES
  ('Apex Office Supplies', 'Office Supplies', '27AABCA1234A1Z5', 'Ravi Shah', '9000000001', 'sales@apexsupplies.com', 'Mumbai, Maharashtra', 'Active'),
  ('Bright Tech Systems', 'IT Hardware', '29AABCB5678B1Z3', 'Neha Rao', '9000000002', 'contact@brighttech.com', 'Bengaluru, Karnataka', 'Active'),
  ('GreenBuild Materials', 'Construction', '07AABCG9012C1Z8', 'Amit Verma', '9000000003', 'orders@greenbuild.com', 'Delhi, India', 'Active');

INSERT INTO rfqs (title, category, deadline, description, status, created_by)
VALUES
  ('Laptop Procurement', 'IT Hardware', CURRENT_DATE + INTERVAL '10 days', 'Need laptops for the operations team.', 'Active', 2),
  ('Office Chair Purchase', 'Office Supplies', CURRENT_DATE + INTERVAL '7 days', 'Ergonomic chairs for new office floor.', 'Active', 2);

INSERT INTO rfq_items (rfq_id, item_name, quantity, unit)
VALUES
  (1, 'Business Laptop', 20, 'pcs'),
  (2, 'Ergonomic Chair', 35, 'pcs');

INSERT INTO rfq_vendors (rfq_id, vendor_id)
VALUES
  (1, 2),
  (2, 1);

INSERT INTO quotations (rfq_id, vendor_id, tax_percent, notes, status)
VALUES
  (1, 2, 18, 'Includes standard warranty.', 'Submitted'),
  (2, 1, 18, 'Delivery in one week.', 'Submitted');

INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days)
VALUES
  (1, 'Business Laptop', 20, 55000, 12),
  (2, 'Ergonomic Chair', 35, 6500, 7);

INSERT INTO approvals (quotation_id, approver_id, level, status, remarks)
VALUES
  (1, 1, 1, 'Pending', NULL),
  (2, 1, 1, 'Approved', 'Good pricing.');

INSERT INTO purchase_orders (rfq_id, quotation_id, po_number, status, created_at)
VALUES
  (2, 2, 'PO-2026-001', 'Issued', CURRENT_TIMESTAMP);

INSERT INTO invoices (po_id, invoice_date, due_date, status)
VALUES
  (1, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', 'Pending');

INSERT INTO activity_logs (action, description, user_id)
VALUES
  ('Seed data created', 'Initial demo records were added.', 1);
