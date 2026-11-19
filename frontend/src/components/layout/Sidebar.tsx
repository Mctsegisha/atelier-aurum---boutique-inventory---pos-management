import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutGrid,
  ShoppingCart,
  Shirt,
  Boxes,
  Truck,
  Receipt,
  ReceiptText,
  BarChart3,
  Users,
  UserCheck,
  Settings,
  History,
  Clock,
  Wallet,
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Check
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const BRANCH_OPTIONS = [
  'Demo · Main Branch',
  'Hawassa · Main Branch',
  'Addis Ababa · Showroom',
  'Bole · Express Pop-up'
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { role, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Demo · Main Branch');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // Define navigation groups based on RBAC while preserving existing menu items & routes
  const getNavGroups = (): NavGroup[] => {
    if (role === 'sales') {
      return [
        {
          items: [
            { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart }
          ]
        },
        {
          title: 'FINANCE',
          items: [
            { id: 'sales', label: 'My Sales History', icon: Receipt },
            { id: 'shift', label: 'Cash Management', icon: Wallet }
          ]
        },
        {
          title: 'MANAGE',
          items: [
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'profile', label: 'My Profile', icon: UserCheck }
          ]
        }
      ];
    }

    if (role === 'store_person') {
      return [
        {
          items: [
            { id: 'dashboard', label: 'Store Dashboard', icon: LayoutGrid },
            { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart }
          ]
        },
        {
          title: 'INVENTORY',
          items: [
            { id: 'products', label: 'Product Catalog', icon: Shirt },
            { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
            { id: 'suppliers', label: 'Suppliers & Orders', icon: Truck }
          ]
        },
        {
          title: 'FINANCE',
          items: [
            { id: 'sales', label: 'Sales & Returns', icon: Receipt },
            { id: 'shift', label: 'Cash Management', icon: Wallet },
            { id: 'expenses', label: 'Store Expenses', icon: ReceiptText },
            { id: 'reports', label: 'Store Reports', icon: BarChart3 }
          ]
        },
        {
          title: 'MANAGE',
          items: [
            { id: 'customers', label: 'Customers', icon: Users }
          ]
        }
      ];
    }

    // Admin - Complete operations
    return [
      {
        items: [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutGrid },
          { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart }
        ]
      },
      {
        title: 'INVENTORY',
        items: [
          { id: 'products', label: 'Product Catalog', icon: Shirt },
          { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
          { id: 'suppliers', label: 'Suppliers & Orders', icon: Truck }
        ]
      },
      {
        title: 'FINANCE',
        items: [
          { id: 'sales', label: 'Sales & Refunds', icon: Receipt },
          { id: 'shift', label: 'Cash Management', icon: Wallet },
          { id: 'expenses', label: 'Operational Expenses', icon: ReceiptText },
          { id: 'reports', label: 'Financial & Analytics', icon: BarChart3 }
        ]
      },
      {
        title: 'MANAGE',
        items: [
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'employees', label: 'Staff & Roles', icon: UserCheck },
          { id: 'settings', label: 'Store Settings', icon: Settings },
          { id: 'audit', label: 'Security Audit Logs', icon: History }
        ]
      }
    ];
  };

  const navGroups = getNavGroups();

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-screen flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200 ease-in-out font-sans ${
        isCollapsed ? 'w-[70px]' : 'w-64'
      }`}
    >
      {/* 1. Header Area: Brand Block with icon container and subtitle */}
      <div>
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] border border-[#CDE5D8] flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-5 h-5 text-[#1C4E3D] stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 font-sans">
              <span className="block text-sm font-bold text-slate-900 tracking-tight leading-tight truncate font-sans">
                Hirbit Store
              </span>
              <p className="text-[11px] text-gray-400 font-normal leading-tight mt-0.5 truncate">
                Boutique ERP
              </p>
            </div>
          )}
        </div>
        <div className="border-b border-gray-200" />
      </div>

      {/* 2. Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && !isCollapsed && (
              <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-3 pt-3 pb-1">
                {group.title}
              </div>
            )}
            {group.title && isCollapsed && (
              <div className="my-2 border-t border-gray-100 mx-2" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center transition-all cursor-pointer text-left ${
                      isCollapsed
                        ? 'justify-center p-2 rounded-lg'
                        : 'gap-3 px-3 py-2 rounded-lg text-[13px] font-medium'
                    } ${
                      isActive
                        ? 'bg-[#EAF3EE] border border-[#CBE2D6] text-[#1C4E3D] font-semibold'
                        : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#1C4E3D]' : 'text-slate-500'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Sticky Bottom Footer */}
      <div className="border-t border-gray-200 p-3 bg-white space-y-2 relative">
        {/* Branch / Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className={`w-full flex items-center justify-between rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer text-left ${
              isCollapsed ? 'justify-center p-2' : 'gap-2 px-2.5 py-1.5'
            }`}
            title={isCollapsed ? selectedBranch : undefined}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              {!isCollapsed && (
                <span className="text-xs font-medium text-slate-700 truncate">
                  {selectedBranch}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
                  isBranchDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Branch Dropdown Menu Popup */}
          {isBranchDropdownOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                Active Branch
              </div>
              {BRANCH_OPTIONS.map((branch) => (
                <button
                  key={branch}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setIsBranchDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    selectedBranch === branch
                      ? 'bg-[#EAF3EE] text-[#1C4E3D] font-medium'
                      : 'text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{branch}</span>
                  {selectedBranch === branch && (
                    <Check className="w-3.5 h-3.5 text-[#1C4E3D]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Details & Sidebar Collapse Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-1 pt-0.5'}`}>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {user?.full_name || user?.username || 'Demo Visitor'}
              </div>
              <div className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                {user?.phone || '0999999999'}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
