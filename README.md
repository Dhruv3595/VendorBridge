# VendorBridge

Hey there! Welcome to **VendorBridge**, a procurement and vendor management ERP. It's built to help you easily manage vendors, RFQs, quotations, approvals, purchase orders, and invoices all in one place, complete with activity logs.

## What you need
- Node 18+
- PostgreSQL running locally

## How to get it running

1. Open up pgAdmin (or your favorite Postgres tool) and create a database named `vendorbridge`.
2. Run `server/db/schema.sql` to set up the tables.
3. Run `server/db/seed.sql` to populate some starting data.
4. Go into the `/server` folder and run `npm install`.
5. If your Postgres username/password isn't the default, create a `.env` file in the `/server` directory:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=vendorbridge
   DB_USER=postgres
   DB_PASSWORD=postgres
   SESSION_SECRET=vendorbridge-secret
   CLIENT_URL=http://localhost:5173
   ```
6. Start the backend by running `npm start` in the `/server` folder.
7. Now go to the `/client` folder and run `npm install`.
8. Start up the frontend by running `npm run dev` in the `/client` folder.

## Demo Accounts

We've set up some demo accounts so you can test out different roles. The password for all of them is just their role name + `123` (e.g., `admin123`).

- **Admin panel:** `admin@vendorbridge.com` / `admin123`
- **Officer panel:** `officer@vendorbridge.com` / `officer123`
- **Manager panel:** `manager@vendorbridge.com` / `manager123`
- **Vendor portal:** `vendor@vendorbridge.com` / `vendor123`

Feel free to log in and look around!
