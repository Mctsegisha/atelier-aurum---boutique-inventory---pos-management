import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { LoginView } from './views/LoginView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { PosView } from './views/PosView.tsx';
import { ProductsView } from './views/ProductsView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { SalesView } from './views/SalesView.tsx';
import { CustomersView } from './views/CustomersView.tsx';
import { SuppliersView } from './views/SuppliersView.tsx';
import { ExpensesView } from './views/ExpensesView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { EmployeesView } from './views/EmployeesView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { AuditLogsView } from './views/AuditLogsView.tsx';
import { ShiftView } from './views/ShiftView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import {
  AppView,
  ROLE_DEFAULT_VIEW,
  isViewAllowedForRole
} from './types.ts';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function MainApp() {
  const { user, role, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  // Secure navigation wrapper: validates that requested view is permitted for the active role
  const handleNavigate = (requestedView: string) => {
    if (!role) {
      setCurrentView('dashboard');
      return;
    }

    if (isViewAllowedForRole(role, requestedView)) {
      setCurrentView(requestedView as AppView);
    } else {
      const fallback = ROLE_DEFAULT_VIEW[role];
      console.warn(
        `[RBAC Security Warning] Role "${role}" is not authorized to access restricted view "${requestedView}". Redirecting to authorized default "${fallback}".`
      );
      setCurrentView(fallback);
    }
  };

  // Reconcile and validate current view whenever role changes
  // Prevents state persistence of unauthorized views (e.g. from previous higher-privileged session)
  useEffect(() => {
    if (!role) return;

    if (!isViewAllowedForRole(role, currentView)) {
      const fallbackView = ROLE_DEFAULT_VIEW[role];
      console.info(
        `[RBAC State Reconciled] Active role "${role}" cannot view "${currentView}". Resetting currentView state to "${fallbackView}".`
      );
      setCurrentView(fallbackView);
    }
  }, [role, currentView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center text-xs text-[#716D66]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#B89B65] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">Hirbit Store</h2>
          <p className="text-[#8C8275]">Initializing store management system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Strict route protection with explicit validation
  const renderView = () => {
    // Defense-in-depth: if manual state injection or tampering occurs, block rendering and show access denial
    if (role && !isViewAllowedForRole(role, currentView)) {
      const authorizedDefault = ROLE_DEFAULT_VIEW[role];
      return (
        <div className="p-8 max-w-md mx-auto mt-16 bg-white rounded-xl border border-red-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">Access Restricted</h3>
            <p className="text-xs text-[#716D66] mt-1 leading-relaxed">
              Your active role <strong className="uppercase text-[#1A1A1A]">{role}</strong> is restricted from accessing the{' '}
              <code className="bg-[#F0EDE8] px-1.5 py-0.5 rounded text-[#1A1A1A] font-mono">{currentView}</code> workspace.
            </p>
          </div>
          <button
            onClick={() => handleNavigate(authorizedDefault)}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Authorized Workspace ({authorizedDefault.toUpperCase()})</span>
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'pos':
        return <PosView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'employees':
        return <EmployeesView />;
      case 'settings':
        return <SettingsView />;
      case 'audit':
        return <AuditLogsView />;
      case 'shift':
        return <ShiftView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary key={currentView}>
            {renderView()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
