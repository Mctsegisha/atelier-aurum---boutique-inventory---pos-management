import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  CreditCard,
  Receipt,
  Users,
  Truck,
  ReceiptText,
  UserCheck,
  BarChart3,
  History,
  Settings,
  Clock,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { role, user } = useAuth();

  // Define navigation items based on strict RBAC
  const getNavItems = () => {
    if (role === 'sales') {
      return [
        { id: 'pos', label: 'Point of Sale (POS)', icon: CreditCard },
        { id: 'sales', label: 'My Sales History', icon: Receipt },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'shift', label: 'Register & Shift', icon: Clock },
        { id: 'profile', label: 'My Profile', icon: UserCheck }
      ];
    }

    if (role === 'store_person') {
      return [
        { id: 'dashboard', label: 'Store Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'Point of Sale (POS)', icon: CreditCard },
        { id: 'products', label: 'Product Catalog', icon: Shirt },
        { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
        { id: 'sales', label: 'Sales & Returns', icon: Receipt },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'suppliers', label: 'Suppliers & Orders', icon: Truck },
        { id: 'expenses', label: 'Store Expenses', icon: ReceiptText },
        { id: 'reports', label: 'Store Reports', icon: BarChart3 }
      ];
    }

    // Admin - Complete operations
    return [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'Point of Sale (POS)', icon: CreditCard },
      { id: 'products', label: 'Product Catalog', icon: Shirt },
      { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
      { id: 'sales', label: 'Sales & Refunds', icon: Receipt },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'suppliers', label: 'Suppliers & Orders', icon: Truck },
      { id: 'expenses', label: 'Operational Expenses', icon: ReceiptText },
      { id: 'employees', label: 'Staff & Roles', icon: UserCheck },
      { id: 'reports', label: 'Financial & Analytics', icon: BarChart3 },
      { id: 'audit', label: 'Security Audit Logs', icon: History },
      { id: 'settings', label: 'Store Settings', icon: Settings }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#F9F8F6] border-r border-[#E5E0D8] min-h-[calc(100vh-61px)] flex flex-col justify-between shrink-0 p-4 transition-colors">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#716D66] font-medium px-3">
            {role === 'admin' ? 'Administrator Workspace' : role === 'store_person' ? 'Store Manager Workspace' : 'Sales Associate Console'}
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#1A1A1A] text-[#F9F8F6] shadow-sm'
                      : 'text-[#4A4742] hover:text-[#1A1A1A] hover:bg-[#EFECE6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#B89B65]' : 'text-[#716D66]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Store Signature card */}
      <div className="p-3 bg-[#EFECE6]/70 rounded-lg border border-[#E5E0D8]/60 text-xs">
        <div className="flex items-center gap-1.5 text-[#B89B65] font-serif text-sm font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hirbit Store</span>
        </div>
        <p className="text-[11px] text-[#716D66] mt-1 leading-relaxed">
          ACID transactions, persistent relational storage & multi-role RBAC active.
        </p>
      </div>
    </aside>
  );
}
