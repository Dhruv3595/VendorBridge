VendorBridge

VendorBridge is a Procurement and Vendor Management ERP for managing vendors, RFQs, quotations, approvals, purchase orders, invoices, and activity logs.

Requirements

- Node 18+
- PostgreSQL running locally

Setup

1. Open pgAdmin and create a database named vendorbridge.
2. Run server/db/schema.sql in the vendorbridge database.
3. Run server/db/seed.sql in the vendorbridge database.
4. In /server, run npm install.
5. Create /server/.env if your PostgreSQL username or password is different:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendorbridge
DB_USER=postgres
DB_PASSWORD=postgres
SESSION_SECRET=vendorbridge-secret
CLIENT_URL=http://localhost:5173

6. In /server, run npm start.
7. In /client, run npm install.
8. In /client, run npm start.

Demo login credentials

- admin@vendorbridge.com / password123
- officer@vendorbridge.com / password123
- vendor@vendorbridge.com / password123

Suggested commit messages

- init project structure
- add postgres schema
- add auth backend
- add login signup pages
- add dashboard
