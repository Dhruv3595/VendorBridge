export const rolePaths = {
  Admin: 'admin',
  Officer: 'officer',
  Vendor: 'vendor',
  Manager: 'manager'
};

export function dashboardPathForRole(role) {
  return `/${rolePaths[role] || 'officer'}/dashboard`;
}

export const sidebarItemsByRole = {
  Admin: [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/users', label: 'Users' },
    { path: '/vendors', label: 'Vendors' },
    { path: '/rfqs', label: 'RFQs' },
    { path: '/quotations', label: 'Quotations' },
    { path: '/approvals', label: 'Approvals' },
    { path: '/purchase-orders', label: 'Purchase Orders' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/reports', label: 'Reports' },
    { path: '/activity', label: 'Activity Logs' }
  ],
  Officer: [
    { path: '/officer/dashboard', label: 'Dashboard' },
    { path: '/vendors', label: 'Vendors' },
    { path: '/rfqs', label: 'RFQs' },
    { path: '/quotations', label: 'Quotations' },
    { path: '/approvals', label: 'Approvals' },
    { path: '/purchase-orders', label: 'Purchase Orders' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/reports', label: 'Reports' },
    { path: '/activity', label: 'Activity' }
  ],
  Vendor: [
    { path: '/vendor/dashboard', label: 'Dashboard' },
    { path: '/rfqs', label: 'Assigned RFQs' },
    { path: '/quotations', label: 'My Quotations' },
    { path: '/purchase-orders', label: 'Purchase Orders' },
    { path: '/invoices', label: 'Invoice Status' },
    { path: '/activity', label: 'Activity' }
  ],
  Manager: [
    { path: '/manager/dashboard', label: 'Dashboard' },
    { path: '/approvals', label: 'Pending Approvals' },
    { path: '/approvals?status=Approved', label: 'Approved Requests' },
    { path: '/approvals?status=Rejected', label: 'Rejected Requests' },
    { path: '/activity', label: 'Workflow Monitor' }
  ]
};

export function sidebarItemsForRole(role) {
  return sidebarItemsByRole[role] || sidebarItemsByRole.Officer;
}

export function canAccessPath(role, path) {
  const roleDashboard = Object.entries(rolePaths).find(([, prefix]) => path.startsWith(`/${prefix}/`));

  if (roleDashboard && roleDashboard[0] !== role) {
    return false;
  }

  const modulePermissions = [
    { prefix: '/vendors', roles: ['Admin', 'Officer'] },
    { prefix: '/rfqs/new', roles: ['Officer'] },
    { prefix: '/rfqs', roles: ['Admin', 'Officer', 'Vendor'] },
    { prefix: '/quotations', roles: ['Admin', 'Officer', 'Vendor'] },
    { prefix: '/approvals', roles: ['Admin', 'Officer', 'Manager'] },
    { prefix: '/purchase-orders', roles: ['Admin', 'Officer', 'Vendor'] },
    { prefix: '/invoices', roles: ['Admin', 'Officer', 'Vendor'] },
    { prefix: '/reports', roles: ['Admin', 'Officer'] },
    { prefix: '/activity', roles: ['Admin', 'Officer', 'Vendor', 'Manager'] },
    { prefix: '/users', roles: ['Admin'] }
  ];

  const matched = modulePermissions.find((permission) => path.startsWith(permission.prefix));
  return !matched || matched.roles.includes(role);
}
