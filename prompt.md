You are a senior full-stack ERP architect and product engineer.

I am building a hackathon project named “VendorBridge” — Procurement & Vendor Management ERP.

First, deeply understand the SRS/problem statement and attached wireframes before writing code.

Project Vision:
VendorBridge is a centralized ERP platform to digitize procurement operations. It should manage vendors, RFQs, vendor quotations, quotation comparison, approval workflow, purchase orders, invoices, activity logs, and reports.

Core modules from SRS:
1. Login / Signup with role-based authentication
2. Dashboard / Home
3. Vendor Management
4. RFQ Creation
5. Vendor Quotation Submission
6. Quotation Comparison
7. Approval Workflow
8. Purchase Order & Invoice Generation
9. Activity Logs & Notifications
10. Reports & Analytics

User Roles:
1. Admin
2. Procurement Officer
3. Vendor
4. Manager / Approver

Now build and explain the complete application flow role-wise.

====================================================
PART 1: ROLE-BASED ROUTING AND ACCESS CONTROL
====================================================

Implement role-based route protection.

After login:
- Admin redirects to /admin/dashboard
- Procurement Officer redirects to /officer/dashboard
- Vendor redirects to /vendor/dashboard
- Manager / Approver redirects to /manager/dashboard

JWT/auth session should store:
- userId
- name
- email
- role
- organizationId
- vendorId if role is Vendor

Create middleware / route guard:
- If user is not logged in, redirect to /login
- If user tries to access another role’s route, show 403 Unauthorized or redirect to their own dashboard
- Sidebar tabs should change based on role
- UI actions should also be permission-based, not only routes

Role permissions:

Admin:
- Manage users
- Manage vendors
- View all RFQs
- View all quotations
- View approvals
- View purchase orders
- View invoices
- View reports
- View activity logs
- Cannot submit vendor quotation

Procurement Officer:
- Create RFQs
- Assign vendors to RFQ
- View vendors
- Compare quotations
- Select quotation
- Initiate approval workflow
- Generate PO after approval
- Generate invoice
- View reports
- View activity logs

Vendor:
- View assigned RFQs only
- Submit quotations for assigned RFQs
- Edit quotation only before deadline or before final submission
- Track RFQ status
- View generated purchase orders related to their quotations
- View invoice/payment status
- Cannot access approval/comparison of other vendors

Manager / Approver:
- View approval requests assigned to them
- Approve or reject procurement request
- Add approval remarks
- View quotation summary
- View workflow timeline
- Monitor procurement workflow
- Cannot create RFQ
- Cannot submit vendor quotation

====================================================
PART 2: SIDEBAR SHOULD CHANGE ROLE-WISE
====================================================

Create dynamic sidebar configuration.

Admin Sidebar:
- Dashboard
- Users
- Vendors
- RFQs
- Quotations
- Approvals
- Purchase Orders
- Invoices
- Reports
- Activity Logs

Procurement Officer Sidebar:
- Dashboard
- Vendors
- RFQs
- Quotations
- Approvals
- Purchase Orders
- Invoices
- Reports
- Activity

Vendor Sidebar:
- Dashboard
- Assigned RFQs
- Submit Quotations
- My Quotations
- Purchase Orders
- Invoice Status
- Activity

Manager Sidebar:
- Dashboard
- Pending Approvals
- Approved Requests
- Rejected Requests
- Workflow Monitor
- Activity

Make sidebar reusable:
- sidebarItems.ts should export menu config based on role
- Active route should highlight automatically
- Unauthorized tabs should never render

====================================================
PART 3: COMPLETE PROCUREMENT WORKFLOW
====================================================

Implement the real ERP flow:

Step 1: Procurement Officer creates RFQ
Fields:
- RFQ title
- Category
- Product/service details
- Quantity
- Unit
- Description
- Deadline
- Attachments
- Assigned vendors
- Status: Draft / Published / Closed / Under Comparison / Approval Pending / Approved / Rejected / PO Generated

Actions:
- Save as Draft
- Publish and Send to Vendors

When RFQ is published:
- Only assigned vendors can see it
- Create activity log: “RFQ published and sent to X vendors”
- Notify assigned vendors

Step 2: Vendor submits quotation
Vendor sees only RFQs assigned to them.

Quotation fields:
- RFQ ID
- Vendor ID
- Item-wise unit price
- Quantity
- Total
- Delivery days
- GST/tax %
- Notes/payment terms
- Attachments if needed
- Status: Draft / Submitted / Withdrawn / Selected / Rejected

Rules:
- Vendor can save draft
- Vendor can submit quotation
- Vendor cannot submit after deadline
- Vendor cannot edit after final submission unless allowed
- One vendor can submit one quotation per RFQ

Create activity log:
“Vendor X submitted quotation for RFQ Y”

Step 3: Procurement Officer compares quotations
For each RFQ:
- Show all submitted quotations side-by-side
- Compare grand total
- GST %
- Delivery days
- Vendor rating
- Payment terms
- Highlight lowest price in green
- Allow sorting by price, delivery time, vendor rating
- Procurement Officer selects quotation

When quotation selected:
- Mark selected quotation as Selected
- Mark others as Rejected or Not Selected
- RFQ status becomes Approval Pending
- Create approval workflow
- Create activity log: “Quotation from Vendor X selected for RFQ Y”

Step 4: Approval workflow
Approval request goes to Manager / Approver.

Approval screen shows:
- RFQ summary
- Selected vendor
- Quotation total
- Delivery days
- Vendor rating
- Approval chain
- Current approval level
- Remarks box
- Approve button
- Reject button

Workflow states:
- Submitted
- L1 Review
- L2 Approval
- Approved
- Rejected
- PO Generated

Rules:
- Approver can approve/reject only requests assigned to them
- Every approval/rejection must store remarks
- Status transitions must be strict
- If rejected, RFQ status becomes Rejected or Rework Required
- If approved, RFQ status becomes Approved and PO can be generated

Create activity logs:
- “Manager approved RFQ”
- “Manager rejected RFQ with remarks”

Step 5: Purchase Order generation
After approval:
- Procurement Officer can generate PO
- PO should auto-generate PO number like PO-2025-00068
- PO links to RFQ, selected quotation, vendor, organization
- PO contains item table, quantity, unit price, tax, subtotal, grand total
- PO status: Generated / Sent / Accepted / Completed

Actions:
- Download PDF
- Print
- Email to vendor

Step 6: Invoice generation
Invoice generated from PO.

Invoice fields:
- Invoice number
- PO number
- Vendor details
- Organization details
- Items
- CGST/SGST/IGST
- Subtotal
- Grand total
- Due date
- Payment status: Pending Payment / Paid / Overdue

Actions:
- Download PDF
- Print invoice
- Send invoice through email
- Mark as Paid

Create activity logs:
- “PO generated”
- “Invoice generated”
- “Invoice emailed”
- “Invoice marked as paid”

Step 7: Reports & Analytics
Reports page should show:
- Total spend
- Active vendors
- PO fulfillment %
- Overdue invoices
- Spend by category
- Top vendors by spend
- Monthly procurement trend
- Export report button

Reports data should come from actual DB records, not static hardcoded data.

Step 8: Activity logs
Activity logs must show:
- RFQ published
- Quotation submitted
- Quotation selected
- Approval pending
- Approved/rejected
- PO generated
- Invoice generated
- Vendor added
- Invoice paid

Important rule:
Audit logs must be immutable.
No edit.
No delete.
No soft delete.
Logs should be write-once records.

DB schema must reflect this:
- Do not add deletedAt in activity_logs
- Do not expose update/delete APIs for logs
- Only create and read logs are allowed

====================================================
PART 4: DATABASE DESIGN
====================================================

Design proper relational-style collections/tables.

Required models:
1. User
2. Vendor
3. RFQ
4. RFQItem
5. Quotation
6. QuotationItem
7. ApprovalRequest
8. ApprovalStep
9. PurchaseOrder
10. PurchaseOrderItem
11. Invoice
12. InvoiceItem
13. ActivityLog
14. Notification

Important relationships:
- User belongs to organization
- Vendor belongs to organization
- RFQ created by Procurement Officer
- RFQ has many RFQ items
- RFQ assigned to many vendors
- Vendor submits quotation against RFQ
- Quotation has many quotation items
- Selected quotation creates approval request
- Approved quotation creates PO
- PO creates invoice
- Every major action creates immutable activity log

====================================================
PART 5: STATUS FLOW
====================================================

RFQ Status:
Draft → Published → Quotation Received → Under Comparison → Approval Pending → Approved → PO Generated → Closed

Alternative:
Draft → Published → Rejected
Published → Expired
Approval Pending → Rework Required

Quotation Status:
Draft → Submitted → Selected
Draft → Submitted → Not Selected
Submitted → Withdrawn

Approval Status:
Pending → Approved
Pending → Rejected

PO Status:
Generated → Sent → Accepted → Completed

Invoice Status:
Generated → Sent → Pending Payment → Paid
Generated → Sent → Overdue

====================================================
PART 6: PAGE-WISE FUNCTIONALITY BASED ON WIREFRAMES
====================================================

Screen 1: Login
- Email/username
- Password
- Login button
- On login, redirect based on role

Screen 2: Registration
- First name
- Last name
- Email
- Phone
- Role
- Country
- Additional info
- Photo upload optional
- Admin approval can be required for vendor registration

Screen 3: Dashboard
For Procurement Officer:
- Active RFQs
- Pending approvals
- PO this month
- Overdue invoices
- Recent purchase orders
- Spending trends
- Quick actions: New RFQ, Add Vendor, View Invoices

For Admin:
- Total users
- Total vendors
- Active RFQs
- Total spend
- System-wide activity

For Vendor:
- Assigned RFQs
- Submitted quotations
- Selected quotations
- Pending PO/invoice status

For Manager:
- Pending approvals
- Approved this month
- Rejected requests
- Approval timeline

Screen 4: Vendors Page
- Search vendor by name, GST number, category
- Filters: All, Active, Pending, Blocked
- Vendor table
- View action
- Add Vendor button visible only to Admin and Procurement Officer
- Vendor status tracking

Screen 5: RFQ Page
- Create RFQ form
- RFQ title
- Category
- Deadline
- Description
- Line items
- Assign vendors
- Attachments
- Save Draft
- Save and Send to Vendors

Screen 6: Submit Quotation Page
Vendor panel only:
- Show RFQ summary
- Item-wise quotation table
- Unit price
- Total
- Delivery days
- GST %
- Notes/payment terms
- Submit Quotation
- Save Draft

Screen 7: Quotation Comparison Page
Procurement Officer/Admin:
- Side-by-side vendor comparison
- Lowest price highlighted
- Delivery days comparison
- Vendor rating
- Payment terms
- Select and approve button
- Selecting vendor starts approval workflow

Screen 8: Approval Page
Manager/Admin:
- Approval workflow timeline
- Selected quotation summary
- Approve/Reject actions
- Remarks field
- Approval chain
- Current status indicator

Screen 9: PO & Invoice Page
Procurement Officer/Admin:
- Auto-generated PO
- Vendor and organization details
- Item table
- Tax calculation
- Grand total
- Download PDF
- Print
- Email invoice
- Mark as paid

Screen 10: Activity & Logs Page
- Tabs: All, RFQ, Approvals, Invoices, Vendors
- Timeline list
- Immutable audit logs
- No edit/delete
- Filter by module, user, date

Screen 11: Reports Page
Admin/Procurement Officer:
- Total spend
- Active vendors
- PO fulfillment
- Overdue invoices
- Spend by category
- Top vendors by spend
- Monthly trend
- Export report

====================================================
PART 7: BACKEND API DESIGN
====================================================

Create secure APIs:

Auth:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

Users:
GET /api/users
POST /api/users
PATCH /api/users/:id/status

Vendors:
GET /api/vendors
POST /api/vendors
GET /api/vendors/:id
PATCH /api/vendors/:id
PATCH /api/vendors/:id/status

RFQs:
GET /api/rfqs
POST /api/rfqs
GET /api/rfqs/:id
PATCH /api/rfqs/:id
POST /api/rfqs/:id/publish
POST /api/rfqs/:id/assign-vendors

Quotations:
GET /api/quotations
POST /api/rfqs/:rfqId/quotations
GET /api/rfqs/:rfqId/quotations
POST /api/quotations/:id/submit
POST /api/quotations/:id/select

Approvals:
GET /api/approvals
GET /api/approvals/:id
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject

Purchase Orders:
GET /api/purchase-orders
POST /api/purchase-orders/generate/:approvalId
GET /api/purchase-orders/:id
POST /api/purchase-orders/:id/email
GET /api/purchase-orders/:id/pdf

Invoices:
GET /api/invoices
POST /api/invoices/generate/:poId
GET /api/invoices/:id
POST /api/invoices/:id/email
GET /api/invoices/:id/pdf
PATCH /api/invoices/:id/mark-paid

Activity Logs:
GET /api/activity-logs
POST internal only: create log
No PATCH
No DELETE

Reports:
GET /api/reports/summary
GET /api/reports/spend-by-category
GET /api/reports/top-vendors
GET /api/reports/monthly-trend
GET /api/reports/export

====================================================
PART 8: FRONTEND IMPLEMENTATION RULES
====================================================

Use reusable components:
- AuthLayout
- DashboardLayout
- RoleBasedSidebar
- ProtectedRoute
- StatCard
- DataTable
- StatusBadge
- FormInput
- SelectField
- RFQForm
- QuotationTable
- ApprovalTimeline
- InvoiceTemplate
- ActivityTimeline
- ReportCards

UI style:
- Clean ERP dashboard
- Odoo-inspired soft colors
- Light green active sidebar highlight
- Simple professional cards
- No unnecessary glassmorphism
- Responsive layout
- Clear status badges

Do not hardcode everything.
Create seed data only if backend is not ready.
Final UI should be connected to APIs.

====================================================
PART 9: WINNING HACKATHON FEATURES
====================================================

Add these small but impressive features:
1. Role-based dashboard summaries
2. Lowest quotation auto-highlight
3. Approval timeline with step status
4. Immutable audit logs
5. PDF invoice download
6. Email invoice action
7. Vendor status: Active/Pending/Blocked
8. Smart filters on vendors/RFQs/logs
9. Real calculated reports
10. Clean status flow for RFQ → Quotation → Approval → PO → Invoice

====================================================
PART 10: OUTPUT EXPECTATION
====================================================

Before coding, explain:
1. SRS understanding
2. User roles and permissions
3. Route structure
4. Sidebar structure
5. End-to-end RFQ flow
6. Database schema
7. API list
8. Folder structure
9. Implementation phases

Then implement phase-wise:
Phase 1: Auth + role-based routing + sidebar
Phase 2: Vendor management
Phase 3: RFQ creation and vendor assignment
Phase 4: Vendor quotation submission
Phase 5: Quotation comparison
Phase 6: Approval workflow
Phase 7: PO and invoice generation
Phase 8: Activity logs and reports
Phase 9: UI polish and validation
Phase 10: Demo seed data and final testing

Make sure every module works according to user role.
Do not create random pages.
Build exactly according to SRS and wireframes.