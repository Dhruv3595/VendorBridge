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
    { path: '/admin/dashboard', label: 'Dashboard',       icon: '📊' },
    { path: '/users',           label: 'Users',           icon: '👥' },
    { path: '/vendors',         label: 'Vendors',         icon: '🏭' },
    { path: '/rfqs',            label: 'RFQs',            icon: '📋' },
    { path: '/quotations',      label: 'Quotations',      icon: '💬' },
    { path: '/approvals',       label: 'Approvals',       icon: '✅' },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: '📦' },
    { path: '/invoices',        label: 'Invoices',        icon: '🧾' },
    { path: '/reports',         label: 'Reports',         icon: '📈' },
    { path: '/activity',        label: 'Activity Logs',   icon: '📝' }
  ],
  Officer: [
    { path: '/officer/dashboard', label: 'Dashboard',       icon: '📊' },
    { path: '/vendors',           label: 'Vendors',         icon: '🏭' },
    { path: '/rfqs',              label: 'RFQs',            icon: '📋' },
    { path: '/quotations',        label: 'Quotations',      icon: '💬' },
    { path: '/approvals',         label: 'Approvals',       icon: '✅' },
    { path: '/purchase-orders',   label: 'Purchase Orders', icon: '📦' },
    { path: '/invoices',          label: 'Invoices',        icon: '🧾' },
    { path: '/reports',           label: 'Reports',         icon: '📈' },
    { path: '/activity',          label: 'Activity',        icon: '📝' }
  ],
  Vendor: [
    { path: '/vendor/dashboard', label: 'Dashboard',          icon: '📊' },
    { path: '/rfqs',             label: 'Assigned RFQs',      icon: '📋' },
    { path: '/quotations',       label: 'My Quotations',      icon: '💬' },
    { path: '/purchase-orders',  label: 'Purchase Orders',    icon: '📦' },
    { path: '/invoices',         label: 'Invoice Status',     icon: '🧾' },
    { path: '/activity',         label: 'Activity',           icon: '📝' }
  ],
  Manager: [
    { path: '/manager/dashboard',        label: 'Dashboard',          icon: '📊' },
    { path: '/approvals',                label: 'Pending Approvals',  icon: '⏳' },
    { path: '/approvals?status=Approved',label: 'Approved Requests',  icon: '✅' },
    { path: '/approvals?status=Rejected',label: 'Rejected Requests',  icon: '❌' },
    { path: '/activity',                 label: 'Workflow Monitor',   icon: '📝' }
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
