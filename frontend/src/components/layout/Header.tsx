import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Role, Notification } from '../../types.ts';
import { api } from '../../api.ts';
import { Bell, ShieldCheck, UserCheck, ShoppingBag, LogOut, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(res => {
          if (Array.isArray(res)) {
            setNotifications(res);
          } else {
            setNotifications([]);
          }
        })
        .catch(() => {
          setNotifications([]);
        });
    }
  }, [user, currentView]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => (Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: 1 })) : []));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate(role === 'sales' ? 'pos' : 'dashboard')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="font-serif text-2xl font-semibold tracking-wide text-[#1A1A1A] group-hover:text-[#B89B65] transition-colors whitespace-nowrap shrink-0">
            Hirbit Store
          </span>
          <span className="block text-[11px] tracking-[0.2em] uppercase text-[#716D66] font-sans">
            Inventory & POS System
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation status & quick actions */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-[#716D66]">
        <span>Hawassa Piyassa Mall, 1st Floor</span>
        <span aria-hidden="true">·</span>
        <span className="capitalize">{role === 'admin' ? 'System Administrator Console' : role === 'store_person' ? 'Store Operations Mode' : 'POS Register Shift'}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">Terminal 01</span>
      </div>

      {/* Zone 3: Interactive Controls (Active Role Badge, Notifications, Profile) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Verified Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EFECE6] rounded-md border border-[#E5E0D8]">
          <span className="text-[10px] uppercase tracking-wider text-[#716D66] font-medium hidden sm:inline">
            Role:
          </span>
          <span className="text-xs font-semibold text-[#1A1A1A]">
            {role === 'admin' ? 'System Administrator' : role === 'store_person' ? 'Store Manager' : 'Sales Associate'}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-[#59554F] hover:text-[#1A1A1A] hover:bg-[#EFECE6] rounded-md transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#B89B65] rounded-full" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E0D8] rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                  Store Alerts ({safeNotifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#B89B65] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#F0EDE8] py-1">
                {safeNotifications.length === 0 ? (
                  <p className="text-xs text-[#716D66] py-4 text-center">No recent alerts</p>
                ) : (
                  safeNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) onNavigate(n.link.replace('/', ''));
                        setShowNotifMenu(false);
                      }}
                      className={`py-2 px-1 text-xs cursor-pointer hover:bg-[#F9F8F6] rounded transition-colors ${!n.is_read ? 'font-medium' : 'text-[#716D66]'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                        {n.type === 'low_stock' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        {n.type === 'new_sale' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {n.type === 'po_received' && <CheckCircle2 className="w-3.5 h-3.5 text-[#B89B65] shrink-0" />}
                        <span className="truncate">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-[#716D66] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E5E0D8]">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-[#E5E0D8] shrink-0 border border-[#D8D2C7]">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] font-medium text-[#1A1A1A]">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-medium text-[#1A1A1A] leading-tight truncate max-w-[130px]">
              {user?.full_name}
            </span>
            <span className="block text-[10px] text-[#716D66] uppercase tracking-wider">
              {role === 'admin' ? 'Admin' : role === 'store_person' ? 'Store Person' : 'Sales'}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-[#716D66] hover:text-[#1A1A1A] hover:bg-[#EFECE6] rounded transition-colors ml-1 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
