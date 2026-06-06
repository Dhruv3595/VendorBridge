const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const vendorRoutes = require('./routes/vendors');
const rfqRoutes = require('./routes/rfqs');
const quotationRoutes = require('./routes/quotations');
const approvalRoutes = require('./routes/approvals');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const invoiceRoutes = require('./routes/invoices');
const activityRoutes = require('./routes/activity');
const reportRoutes = require('./routes/reports');
const { isLoggedIn } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'vendorbridge-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.get('/', (req, res) => {
  res.send('VendorBridge API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', isLoggedIn, userRoutes);
app.use('/api/dashboard', isLoggedIn, dashboardRoutes);
app.use('/api/vendors', isLoggedIn, vendorRoutes);
app.use('/api/rfqs', isLoggedIn, rfqRoutes);
app.use('/api/quotations', isLoggedIn, quotationRoutes);
app.use('/api/approvals', isLoggedIn, approvalRoutes);
app.use('/api/purchase-orders', isLoggedIn, purchaseOrderRoutes);
app.use('/api/invoices', isLoggedIn, invoiceRoutes);
app.use('/api/activity', isLoggedIn, activityRoutes);
app.use('/api/reports', isLoggedIn, reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
