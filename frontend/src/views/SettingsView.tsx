import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { BusinessSettings } from '../types.ts';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Receipt,
  ShieldCheck,
  Percent,
  Sliders
} from 'lucide-react';

export function SettingsView() {
  const { role } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form fields
  const [businessName, setBusinessName] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [currencySymbol, setCurrencySymbol] = useState<string>('ETB');
  const [taxRate, setTaxRate] = useState<number>(0.15);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [receiptHeader, setReceiptHeader] = useState<string>('');
  const [receiptFooter, setReceiptFooter] = useState<string>('');
  const [allowNegativeInventory, setAllowNegativeInventory] = useState<boolean>(false);
  const [returnPolicyDays, setReturnPolicyDays] = useState<number>(14);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const s = await api.getSettings();
      setSettings(s);
      setBusinessName(s.business_name || 'Hirbit Store');
      setTagline(s.tagline || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setAddress(s.address || '');
      setCurrencySymbol(s.currency_symbol || 'ETB');
      setTaxRate(s.tax_rate ?? 0.15);
      setLowStockThreshold(s.low_stock_threshold ?? 5);
      setReceiptHeader(s.receipt_header || '');
      setReceiptFooter(s.receipt_footer || '');
      setAllowNegativeInventory(Boolean(s.allow_negative_inventory));
      setReturnPolicyDays(s.return_policy_days ?? 14);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      alert('Only the business Owner / Admin may update system settings.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateSettings({
        business_name: businessName,
        tagline,
        phone,
        email,
        address,
        currency_symbol: currencySymbol,
        tax_rate: Number(taxRate),
        low_stock_threshold: Number(lowStockThreshold),
        receipt_header: receiptHeader,
        receipt_footer: receiptFooter,
        allow_negative_inventory: allowNegativeInventory ? 1 : 0,
        return_policy_days: Number(returnPolicyDays)
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            System Preferences
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Store Configuration</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Configure store identity, taxation, low-stock notifications, and printed receipt templates.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings updated</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Business Identity */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
            <Building className="w-4 h-4 text-[#B89B65]" />
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Store Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Store Name</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Store Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Store Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Store Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial & Stock Policy */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
            <Percent className="w-4 h-4 text-[#B89B65]" />
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Taxation & Inventory Policy</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">VAT / Tax Rate (e.g. 0.15 = 15%)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="0.5"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[#59554F] font-medium mb-1">Global Low-Stock Alert Trigger (Units)</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(Number(e.target.value))}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[#59554F] font-medium mb-1">Return Window (Days)</label>
              <input
                type="number"
                min="1"
                value={returnPolicyDays}
                onChange={e => setReturnPolicyDays(Number(e.target.value))}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65] tabular-nums"
              />
            </div>
          </div>

          <div className="p-3 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1A1A1A] block">Disallow Negative Inventory</span>
              <p className="text-[11px] text-[#716D66]">
                Strictly blocks sales or checkout if on-hand variant quantity is 0 or less.
              </p>
            </div>
            <input
              type="checkbox"
              checked={!allowNegativeInventory}
              onChange={e => setAllowNegativeInventory(!e.target.checked)}
              className="w-4 h-4 rounded text-[#B89B65] focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Receipt Template */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
            <Receipt className="w-4 h-4 text-[#B89B65]" />
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Printed Thermal Receipt Slip</h3>
          </div>

          <div>
            <label className="block text-[#59554F] font-medium mb-1">Header Top Line</label>
            <input
              type="text"
              value={receiptHeader}
              onChange={e => setReceiptHeader(e.target.value)}
              className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#59554F] font-medium mb-1">Footer Policy Notice</label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
            />
          </div>
        </div>

        {role === 'admin' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-md text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
