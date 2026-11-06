import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    id: 1,
    businessName: 'VIPUL MILK',
    tagline: 'Fresh & Pure Farm Milk Dairy',
    ownerName: 'Vipul Patel',
    contactPhone: '+91 9876543210',
    address: 'Main Dairy Center, Anand, Gujarat',
    gstOrLicense: '',
    bankDetails: '',
    upiId: 'vipulmilk@upi',
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<AppSettings>('/settings');
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/settings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      setChangingPass(true);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ text: 'Password successfully updated!', error: false });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({
        text: err.response?.data?.message || err.response?.data?.error || 'Failed to update password',
        error: true,
      });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">System & Business Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage dairy profile, contact phone, payment details printed on PDF invoices, and account security.
        </p>
      </div>

      {/* Business Details Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-stone-900">Dairy Information & Bill Header</h2>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Settings Updated
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Business Name (Printed on Bills)
              </label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-stone-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Dairy Owner Name
              </label>
              <input
                type="text"
                value={settings.ownerName || ''}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Dairy Business Address
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                UPI ID (For Customer Payments)
              </label>
              <input
                type="text"
                value={settings.upiId || ''}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-stone-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                FSSAI / Dairy License Number
              </label>
              <input
                type="text"
                value={settings.gstOrLicense || ''}
                onChange={(e) => setSettings({ ...settings, gstOrLicense: e.target.value })}
                placeholder="Optional license registration number"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs transition duration-150 min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Dairy Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security: Owner Password Change */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 border-b border-stone-100 mb-6">
          <ShieldCheck className="w-5 h-5 text-stone-700" />
          <h2 className="text-lg font-bold text-stone-900">Owner Account Password</h2>
        </div>

        {passwordMsg && (
          <div
            className={`mb-5 p-3 rounded-xl text-xs font-bold border ${
              passwordMsg.error
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              New Password (Min. 6 chars) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 min-h-[44px]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPass}
              className="bg-stone-800 hover:bg-stone-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

