import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { AuditLog } from '../types.ts';
import {
  History,
  Search,
  Shield,
  Filter,
  Code
} from 'lucide-react';

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({ action: actionFilter || undefined, limit: 100 });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Forensic & Compliance Oversight
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Security Audit Trail</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Immutable log of all staff logins, role assignments, inventory alterations, checkouts, and refund overrides.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by user, action (e.g. POS_CHECKOUT, INVENTORY_ADJUST)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-md text-xs px-3 py-2 focus:outline-none"
        >
          <option value="">All Audited Actions</option>
          <option value="POS_CHECKOUT">POS Checkout</option>
          <option value="PROCESS_REFUND">Process Refund</option>
          <option value="INVENTORY_ADJUST">Inventory Adjust</option>
          <option value="CREATE_PRODUCT">Create Product</option>
          <option value="UPDATE_USER">Update User / Role</option>
          <option value="LOGIN_SUCCESS">Staff Login</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
            <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type & ID</th>
                <th className="py-3 px-4">Audit Payload / Invariants</th>
                <th className="py-3 px-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#716D66]">
                    Retrieving security audit log...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#716D66]">
                    No audit records match the filter.
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-[#F9F8F6]/60 transition-colors">
                    <td className="py-3.5 px-4 text-[#716D66] whitespace-nowrap font-mono text-[11px]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#1A1A1A]">{l.user_name || 'System'}</p>
                      <span className="text-[10px] text-[#716D66] uppercase">{l.user_role || 'Daemon'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1A1A]">
                      <span className="px-1.5 py-0.5 bg-[#EFECE6] rounded text-[11px] text-[#2C2B29]">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#59554F]">{l.entity_type}</span>
                      {l.entity_id && (
                        <span className="block font-mono text-[10px] text-[#8C8275]">{l.entity_id}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#59554F] max-w-sm truncate">
                      {l.new_values || l.old_values || '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#716D66]">
                      {l.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
