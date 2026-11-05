import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_ALLOWED_VIEWS,
  ROLE_DEFAULT_VIEW,
  isViewAllowedForRole,
  getDefaultViewForRole,
  getAllowedViewsForRole,
  validateAndSanitizeView,
  type Role,
  type AppView,
} from '../../frontend/src/types.ts';

const ALL_POSSIBLE_VIEWS: readonly AppView[] = [
  'dashboard',
  'pos',
  'products',
  'inventory',
  'sales',
  'customers',
  'suppliers',
  'expenses',
  'reports',
  'employees',
  'settings',
  'audit',
  'shift',
  'profile',
];

describe('RBAC Permission Matrix & Constants Integrity', () => {
  it('should define exact valid roles: admin, store_person, sales', () => {
    const roles = Object.keys(ROLE_ALLOWED_VIEWS).sort();
    assert.deepEqual(roles, ['admin', 'sales', 'store_person']);
  });

  it('should ensure every default view is in the role’s allowed views list (invariance check)', () => {
    const roles: Role[] = ['admin', 'store_person', 'sales'];
    for (const role of roles) {
      const defaultView = ROLE_DEFAULT_VIEW[role];
      const allowedViews = ROLE_ALLOWED_VIEWS[role];
      assert.ok(
        allowedViews.includes(defaultView),
        `Default view ${defaultView} for role ${role} must be in allowed views list`
      );
    }
  });

  it('should verify hierarchy subset properties (Sales ⊂ Store Person ⊂ Admin)', () => {
    const salesViews = new Set(ROLE_ALLOWED_VIEWS.sales);
    const storePersonViews = new Set(ROLE_ALLOWED_VIEWS.store_person);
    const adminViews = new Set(ROLE_ALLOWED_VIEWS.admin);

    // Sales allowed views must be a strict subset of store_person allowed views
    for (const view of salesViews) {
      assert.ok(
        storePersonViews.has(view),
        `Sales view ${view} should also be accessible by store_person`
      );
    }
    assert.ok(salesViews.size < storePersonViews.size);

    // Store Person allowed views must be a strict subset of admin allowed views
    for (const view of storePersonViews) {
      assert.ok(
        adminViews.has(view),
        `Store Person view ${view} should also be accessible by admin`
      );
    }
    assert.ok(storePersonViews.size < adminViews.size);
  });

  it('should ensure Admin has full coverage of all 14 system views', () => {
    assert.equal(ROLE_ALLOWED_VIEWS.admin.length, ALL_POSSIBLE_VIEWS.length);
    for (const view of ALL_POSSIBLE_VIEWS) {
      assert.ok(
        ROLE_ALLOWED_VIEWS.admin.includes(view),
        `Admin must have access to ${view}`
      );
    }
  });

  it('should verify Store Person has exactly 11 views and is barred from owner-only views', () => {
    assert.equal(ROLE_ALLOWED_VIEWS.store_person.length, 11);
    const ownerOnlyViews: AppView[] = ['employees', 'settings', 'audit'];
    for (const view of ownerOnlyViews) {
      assert.ok(
        !ROLE_ALLOWED_VIEWS.store_person.includes(view),
        `Store Person MUST NOT have access to owner-only view: ${view}`
      );
    }
  });

  it('should verify Sales has exactly 5 views and is barred from management/owner views', () => {
    assert.equal(ROLE_ALLOWED_VIEWS.sales.length, 5);
    const salesPermitted: AppView[] = ['pos', 'sales', 'customers', 'shift', 'profile'];
    assert.deepEqual([...ROLE_ALLOWED_VIEWS.sales].sort(), salesPermitted.sort());

    const salesRestricted: AppView[] = [
      'dashboard',
      'products',
      'inventory',
      'suppliers',
      'expenses',
      'reports',
      'employees',
      'settings',
      'audit',
    ];
    for (const view of salesRestricted) {
      assert.ok(
        !ROLE_ALLOWED_VIEWS.sales.includes(view),
        `Sales MUST NOT have access to ${view}`
      );
    }
  });
});

describe('isViewAllowedForRole', () => {
  describe('Admin Role', () => {
    it('should grant access to every single legitimate view in the application', () => {
      for (const view of ALL_POSSIBLE_VIEWS) {
        assert.equal(
          isViewAllowedForRole('admin', view),
          true,
          `Admin should be granted access to ${view}`
        );
      }
    });

    it('should deny access if view does not exist in the system', () => {
      assert.equal(isViewAllowedForRole('admin', 'unknown_view'), false);
      assert.equal(isViewAllowedForRole('admin', 'super_secret_panel'), false);
      assert.equal(isViewAllowedForRole('admin', 'DROP TABLE users'), false);
    });
  });

  describe('Store Person Role', () => {
    it('should grant access to all 11 operational views', () => {
      const allowed: AppView[] = [
        'dashboard',
        'pos',
        'products',
        'inventory',
        'sales',
        'customers',
        'suppliers',
        'expenses',
        'reports',
        'shift',
        'profile',
      ];
      for (const view of allowed) {
        assert.equal(
          isViewAllowedForRole('store_person', view),
          true,
          `Store Person should have access to ${view}`
        );
      }
    });

    it('should strictly deny unauthorized access to owner-only views', () => {
      const forbidden: AppView[] = ['employees', 'settings', 'audit'];
      for (const view of forbidden) {
        assert.equal(
          isViewAllowedForRole('store_person', view),
          false,
          `Store Person MUST NOT be allowed access to ${view}`
        );
      }
    });
  });

  describe('Sales Role', () => {
    it('should grant access strictly to POS, sales, customers, shift, and profile', () => {
      const allowed: AppView[] = ['pos', 'sales', 'customers', 'shift', 'profile'];
      for (const view of allowed) {
        assert.equal(
          isViewAllowedForRole('sales', view),
          true,
          `Sales should have access to ${view}`
        );
      }
    });

    it('should block all unauthorized views and privilege escalation attempts', () => {
      const forbidden: AppView[] = [
        'dashboard',
        'products',
        'inventory',
        'suppliers',
        'expenses',
        'reports',
        'employees',
        'settings',
        'audit',
      ];
      for (const view of forbidden) {
        assert.equal(
          isViewAllowedForRole('sales', view),
          false,
          `Sales MUST NOT have access to ${view}`
        );
      }
    });
  });

  describe('Boundary & Edge Cases', () => {
    it('should return false for null or undefined roles', () => {
      assert.equal(isViewAllowedForRole(null, 'dashboard'), false);
      assert.equal(isViewAllowedForRole(undefined, 'dashboard'), false);
      assert.equal(isViewAllowedForRole(null, 'pos'), false);
      assert.equal(isViewAllowedForRole(undefined, 'pos'), false);
    });

    it('should return false for null or undefined views', () => {
      assert.equal(isViewAllowedForRole('admin', null), false);
      assert.equal(isViewAllowedForRole('admin', undefined), false);
      assert.equal(isViewAllowedForRole('sales', null), false);
      assert.equal(isViewAllowedForRole('sales', undefined), false);
    });

    it('should return false when both role and view are missing or empty', () => {
      assert.equal(isViewAllowedForRole(null, null), false);
      assert.equal(isViewAllowedForRole(undefined, undefined), false);
      assert.equal(isViewAllowedForRole('' as Role, ''), false);
    });

    it('should return false for empty string role or view', () => {
      assert.equal(isViewAllowedForRole('' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('admin', ''), false);
      assert.equal(isViewAllowedForRole('admin', '   '), false);
    });

    it('should return false for non-string view inputs', () => {
      assert.equal(isViewAllowedForRole('admin', 123 as unknown as string), false);
      assert.equal(isViewAllowedForRole('admin', {} as unknown as string), false);
      assert.equal(isViewAllowedForRole('admin', [] as unknown as string), false);
      assert.equal(isViewAllowedForRole('admin', true as unknown as string), false);
    });

    it('should return false for invalid / fabricated roles', () => {
      assert.equal(isViewAllowedForRole('superadmin' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('owner' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('guest' as Role, 'pos'), false);
      assert.equal(isViewAllowedForRole('user' as Role, 'profile'), false);
      assert.equal(isViewAllowedForRole('root' as Role, 'settings'), false);
    });

    it('should be strictly case-sensitive for both role and view', () => {
      assert.equal(isViewAllowedForRole('Admin' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('ADMIN' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('Sales' as Role, 'pos'), false);
      assert.equal(isViewAllowedForRole('admin', 'Dashboard'), false);
      assert.equal(isViewAllowedForRole('admin', 'POS'), false);
      assert.equal(isViewAllowedForRole('sales', 'Pos'), false);
      assert.equal(isViewAllowedForRole('sales', 'SALES'), false);
    });

    it('should reject prototype pollution keys', () => {
      assert.equal(isViewAllowedForRole('__proto__' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('constructor' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('toString' as Role, 'dashboard'), false);
      assert.equal(isViewAllowedForRole('admin', '__proto__'), false);
      assert.equal(isViewAllowedForRole('admin', 'constructor'), false);
      assert.equal(isViewAllowedForRole('admin', 'valueOf'), false);
    });
  });
});

describe('getDefaultViewForRole', () => {
  it('should return "dashboard" for admin', () => {
    assert.equal(getDefaultViewForRole('admin'), 'dashboard');
  });

  it('should return "dashboard" for store_person', () => {
    assert.equal(getDefaultViewForRole('store_person'), 'dashboard');
  });

  it('should return "pos" for sales', () => {
    assert.equal(getDefaultViewForRole('sales'), 'pos');
  });

  describe('Boundary & Edge Cases', () => {
    it('should safely fall back to "pos" when role is null or undefined', () => {
      assert.equal(getDefaultViewForRole(null), 'pos');
      assert.equal(getDefaultViewForRole(undefined), 'pos');
    });

    it('should safely fall back to "pos" for empty string or invalid roles', () => {
      assert.equal(getDefaultViewForRole('' as Role), 'pos');
      assert.equal(getDefaultViewForRole('guest' as Role), 'pos');
      assert.equal(getDefaultViewForRole('superadmin' as Role), 'pos');
      assert.equal(getDefaultViewForRole('ADMIN' as Role), 'pos');
      assert.equal(getDefaultViewForRole('__proto__' as Role), 'pos');
    });
  });
});

describe('getAllowedViewsForRole', () => {
  it('should return 14 views for admin', () => {
    const views = getAllowedViewsForRole('admin');
    assert.equal(views.length, 14);
    assert.ok(views.includes('dashboard'));
    assert.ok(views.includes('settings'));
    assert.ok(views.includes('employees'));
  });

  it('should return 11 views for store_person without admin-only views', () => {
    const views = getAllowedViewsForRole('store_person');
    assert.equal(views.length, 11);
    assert.ok(views.includes('dashboard'));
    assert.ok(views.includes('products'));
    assert.ok(!views.includes('settings'));
    assert.ok(!views.includes('employees'));
    assert.ok(!views.includes('audit'));
  });

  it('should return 5 views for sales', () => {
    const views = getAllowedViewsForRole('sales');
    assert.equal(views.length, 5);
    assert.deepEqual([...views].sort(), ['customers', 'pos', 'profile', 'sales', 'shift']);
  });

  describe('Boundary & Edge Cases', () => {
    it('should return an empty array for null or undefined roles', () => {
      assert.deepEqual(getAllowedViewsForRole(null), []);
      assert.deepEqual(getAllowedViewsForRole(undefined), []);
    });

    it('should return an empty array for invalid or unmapped roles', () => {
      assert.deepEqual(getAllowedViewsForRole('' as Role), []);
      assert.deepEqual(getAllowedViewsForRole('guest' as Role), []);
      assert.deepEqual(getAllowedViewsForRole('root' as Role), []);
      assert.deepEqual(getAllowedViewsForRole('__proto__' as Role), []);
    });
  });
});

describe('validateAndSanitizeView (Defense-in-depth Sanitizer)', () => {
  describe('Valid Access Requests', () => {
    it('should preserve authorized views for admin', () => {
      assert.equal(validateAndSanitizeView('admin', 'dashboard'), 'dashboard');
      assert.equal(validateAndSanitizeView('admin', 'settings'), 'settings');
      assert.equal(validateAndSanitizeView('admin', 'employees'), 'employees');
      assert.equal(validateAndSanitizeView('admin', 'audit'), 'audit');
      assert.equal(validateAndSanitizeView('admin', 'pos'), 'pos');
    });

    it('should preserve authorized views for store_person', () => {
      assert.equal(validateAndSanitizeView('store_person', 'dashboard'), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', 'products'), 'products');
      assert.equal(validateAndSanitizeView('store_person', 'reports'), 'reports');
      assert.equal(validateAndSanitizeView('store_person', 'pos'), 'pos');
    });

    it('should preserve authorized views for sales', () => {
      assert.equal(validateAndSanitizeView('sales', 'pos'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'sales'), 'sales');
      assert.equal(validateAndSanitizeView('sales', 'customers'), 'customers');
      assert.equal(validateAndSanitizeView('sales', 'shift'), 'shift');
      assert.equal(validateAndSanitizeView('sales', 'profile'), 'profile');
    });
  });

  describe('Privilege Escalation and Unauthorized Route Attempts', () => {
    it('should redirect sales attempting to access owner or store_person views to "pos"', () => {
      assert.equal(validateAndSanitizeView('sales', 'dashboard'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'employees'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'settings'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'audit'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'inventory'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'reports'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'expenses'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'suppliers'), 'pos');
      assert.equal(validateAndSanitizeView('sales', 'products'), 'pos');
    });

    it('should redirect store_person attempting to access owner-only views to "dashboard"', () => {
      assert.equal(validateAndSanitizeView('store_person', 'employees'), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', 'settings'), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', 'audit'), 'dashboard');
    });
  });

  describe('Boundary & Edge Cases', () => {
    it('should redirect to "pos" when role is null or undefined', () => {
      assert.equal(validateAndSanitizeView(null, 'dashboard'), 'pos');
      assert.equal(validateAndSanitizeView(undefined, 'settings'), 'pos');
      assert.equal(validateAndSanitizeView(null, null), 'pos');
    });

    it('should redirect to role default view when requestedView is null or undefined', () => {
      assert.equal(validateAndSanitizeView('admin', null), 'dashboard');
      assert.equal(validateAndSanitizeView('admin', undefined), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', null), 'dashboard');
      assert.equal(validateAndSanitizeView('sales', null), 'pos');
      assert.equal(validateAndSanitizeView('sales', undefined), 'pos');
    });

    it('should redirect to role default view when requestedView is empty or invalid string', () => {
      assert.equal(validateAndSanitizeView('admin', ''), 'dashboard');
      assert.equal(validateAndSanitizeView('admin', '   '), 'dashboard');
      assert.equal(validateAndSanitizeView('admin', 'invalid_random_view'), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', 'hacked_view'), 'dashboard');
      assert.equal(validateAndSanitizeView('sales', 'evil_route'), 'pos');
    });

    it('should safely handle prototype pollution attempt in requestedView', () => {
      assert.equal(validateAndSanitizeView('admin', '__proto__'), 'dashboard');
      assert.equal(validateAndSanitizeView('store_person', 'constructor'), 'dashboard');
      assert.equal(validateAndSanitizeView('sales', 'toString'), 'pos');
    });

    it('should safely handle invalid or unknown role by redirecting to "pos"', () => {
      assert.equal(validateAndSanitizeView('intruder' as Role, 'dashboard'), 'pos');
      assert.equal(validateAndSanitizeView('' as Role, 'dashboard'), 'pos');
    });
  });
});
