import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { User, Role } from '../types.ts';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle
} from 'lucide-react';

export function EmployeesView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('sales');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !fullName.trim() || !password) {
      setErrorMsg('All fields marked with an asterisk are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createUser({
        username: username.trim(),
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role,
        phone: phone.trim() || undefined
      });
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      await api.toggleUserActive(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setFullName('');
    setPassword('');
    setRole('sales');
    setPhone('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Store Governance & RBAC
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Staff Accounts & Role Assignment</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Create employee credentials, assign role tiers (System Administrator, Store Manager, Sales Associate), and toggle active access.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
            <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#716D66]">
                    Loading staff directory...
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[#F9F8F6]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EFECE6] border border-[#D8D2C7] flex items-center justify-center font-serif font-bold text-sm text-[#1A1A1A]">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#1A1A1A]">{u.full_name}</p>
                          <span className="text-[11px] text-[#716D66]">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-[#1A1A1A] text-white'
                          : u.role === 'store_person'
                          ? 'bg-[#B89B65]/20 text-[#8C6D32] border border-[#B89B65]/40'
                          : 'bg-[#EFECE6] text-[#59554F]'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'store_person' ? 'Store Person' : 'Sales'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#59554F]">
                      <p className="font-mono text-[11px] text-[#1A1A1A]">@{u.username}</p>
                      <p className="text-[11px] text-[#716D66]">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-[#716D66]">
                      {u.phone || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[11px] font-medium ${
                        u.is_active ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {u.is_active ? 'Active Account' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Add Employee User                                       */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Create Staff Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marc Jacobs"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="marc_pos"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Assigned Role Tier *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                  >
                    <option value="sales">Sales Associate (POS & Checkout)</option>
                    <option value="store_person">Store Manager (Inventory & Operations)</option>
                    <option value="admin">System Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="staff@hirbitstore.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+251 91 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded font-medium transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Issue Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
