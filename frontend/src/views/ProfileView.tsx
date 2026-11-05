import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { UserCheck, Shield, Key, CheckCircle2, Lock } from 'lucide-react';

export function ProfileView() {
  const { user, role } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccessMsg('Your security password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E0D8]">
        <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
          Operator Credentials
        </span>
        <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">My Staff Profile</h1>
        <p className="text-xs text-[#716D66] mt-1">
          Review your verified permissions, assigned role tier, and security credentials.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#EFECE6] border border-[#D8D2C7] shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-2xl font-bold text-[#1A1A1A]">
                {user?.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">{user?.full_name}</h3>
            <p className="text-xs text-[#716D66]">{user?.email} · @{user?.username}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-semibold rounded">
              Role: {role}
            </span>
          </div>
        </div>

        {/* Permissions Strip */}
        <div className="pt-4 border-t border-[#E5E0D8] space-y-2">
          <span className="text-xs font-semibold text-[#1A1A1A] block">Active Role Permissions</span>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {user?.permissions?.map(p => (
              <span key={p} className="px-2 py-0.5 bg-[#F9F8F6] border border-[#E5E0D8] rounded text-[11px] font-mono text-[#59554F]">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
          <Key className="w-4 h-4 text-[#B89B65]" />
          <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Update Staff Password</h3>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block text-[#59554F] font-medium mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isUpdating ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
