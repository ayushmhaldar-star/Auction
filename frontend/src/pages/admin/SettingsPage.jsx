import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import Swal from 'sweetalert2';
import { Settings, Save, Lock, RotateCcw, Tv, AlertTriangle, ShieldCheck } from 'lucide-react';

const SettingsPage = () => {
  const { settings, fetchSettings } = useSettings();

  const [formData, setFormData] = useState({
    websiteTitle: '',
    auctionTitle: '',
    currencySymbol: '₹',
    defaultBudget: 100000000,
    defaultIncrement: 500000,
    publicDisplayUrl: '/live'
  });
  const [teamShortcuts, setTeamShortcuts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const fetchFullSettings = async () => {
    try {
      const res = await axiosClient.get('/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setFormData({
          websiteTitle: s.websiteTitle || 'Cricket Auction Pro',
          auctionTitle: s.auctionTitle || 'Premier Cricket League Auction 2026',
          currencySymbol: s.currencySymbol || '₹',
          defaultBudget: s.defaultBudget || 100000000,
          defaultIncrement: s.defaultIncrement || 500000,
          publicDisplayUrl: s.publicDisplayUrl || '/live'
        });
        setTeamShortcuts(res.data.teamShortcuts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFullSettings();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosClient.put('/settings', formData);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Settings Saved',
          text: 'Tournament configuration updated successfully.',
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
        fetchSettings();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update settings.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Passwords Mismatch',
        text: 'New password and confirmation do not match.',
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    setChangingPass(true);
    try {
      const res = await axiosClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          text: 'Master administrator password updated.',
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Could not change password.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setChangingPass(false);
    }
  };

  const handleResetTournament = async () => {
    const confirm = await Swal.fire({
      title: 'DANGER: Reset Tournament Auction?',
      text: 'This will reset ALL player statuses back to PENDING, refund team purse balances to initial amounts, and clear transaction history! Are you absolutely sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset Entire Auction',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosClient.post('/auction/reset');
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Tournament Reset',
            text: res.data.message,
            background: '#0f172a',
            color: '#f8fafc'
          });
          fetchFullSettings();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to reset auction.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>System & Tournament Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize website branding, financial defaults, hotkey bindings, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSettingsSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">
              Tournament Configuration
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Website / System Title
              </label>
              <input
                type="text"
                value={formData.websiteTitle}
                onChange={(e) => setFormData({ ...formData, websiteTitle: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Live Auction Tournament Banner Title
              </label>
              <input
                type="text"
                value={formData.auctionTitle}
                onChange={(e) => setFormData({ ...formData, auctionTitle: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Default Franchise Budget
                </label>
                <input
                  type="number"
                  value={formData.defaultBudget}
                  onChange={(e) => setFormData({ ...formData, defaultBudget: Number(e.target.value) })}
                  step="any"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Default Increment
                </label>
                <input
                  type="number"
                  value={formData.defaultIncrement}
                  onChange={(e) => setFormData({ ...formData, defaultIncrement: Number(e.target.value) })}
                  step="any"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Public Live Broadcast URL
              </label>
              <div className="flex">
                <span className="px-3 py-2.5 bg-slate-800 border border-r-0 border-slate-800 rounded-l-xl text-slate-400 text-xs font-mono flex items-center">
                  http://...
                </span>
                <input
                  type="text"
                  value={formData.publicDisplayUrl}
                  onChange={(e) => setFormData({ ...formData, publicDisplayUrl: e.target.value })}
                  required
                  className="flex-1 px-4 py-2.5 rounded-r-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Change Master Admin Password</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPass}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors disabled:opacity-50"
              >
                <span>{changingPass ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Quick Links & Danger Zone */}
        <div className="space-y-6">
          {/* TV Projector Quick Link */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Live Projector Display</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open the dedicated read-only screen optimized for 1920x1080 resolution TV and projector screens.
            </p>
            <a
              href="/live"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all"
            >
              <span>Launch Live Screen</span>
              <span>➔</span>
            </a>
          </div>

          {/* Assigned Hotkeys Overview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Assigned Team Shortcuts
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {teamShortcuts.map((t) => (
                <div key={t.teamId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="font-semibold text-slate-200 truncate">{t.name}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-amber-500/40 text-amber-300 font-mono font-bold">
                    {t.shortcutKey}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Reset Tournament */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reset all players back to Pending, restore franchise budgets to initial amounts, and clear transaction logs.
            </p>
            <button
              onClick={handleResetTournament}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Entire Auction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
