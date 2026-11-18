import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../../components/common/Modal';
import Swal from 'sweetalert2';
import { 
  Plus, 
  Shield, 
  Edit2, 
  Trash2, 
  Coins, 
  Users, 
  Keyboard, 
  Upload, 
  Eye, 
  RefreshCw 
} from 'lucide-react';

const TeamManagement = () => {
  const { formatCurrency, formatLakhCrore } = useSettings();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [viewingPlayersTeam, setViewingPlayersTeam] = useState(null);

  const [name, setName] = useState('');
  const [initialBudget, setInitialBudget] = useState(100000000);
  const [shortcutKey, setShortcutKey] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/teams');
      if (res.data.success) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setName('');
    setInitialBudget(100000000);
    setShortcutKey('');
    setLogoFile(null);
    setLogoPreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setName(team.name);
    setInitialBudget(team.initialBudget);
    setShortcutKey(team.shortcutKey);
    setLogoFile(null);
    setLogoPreview(team.logo || '');
    setIsModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shortcutKey || !shortcutKey.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Shortcut Required',
        text: 'Please assign a 1-letter keyboard key (e.g. Q, W, E, R, T).',
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('initialBudget', Number(initialBudget) || 0);
    formData.append('shortcutKey', shortcutKey.trim().toUpperCase()[0]);
    if (logoFile) {
      formData.append('logo', logoFile);
    } else if (logoPreview && !logoFile) {
      formData.append('logo', logoPreview);
    }

    try {
      if (editingTeam) {
        await axiosClient.put(`/teams/${editingTeam._id}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Franchise Updated',
          text: `Team "${name}" updated successfully.`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
      } else {
        await axiosClient.post('/teams', formData);
        Swal.fire({
          icon: 'success',
          title: 'Franchise Created',
          text: `Team "${name}" added with shortcut [${shortcutKey.toUpperCase()[0]}].`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
      }
      setIsModalOpen(false);
      fetchTeams();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save franchise.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (team) => {
    if (team.purchasedPlayers && team.purchasedPlayers.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete Franchise',
        text: `Team "${team.name}" has already purchased ${team.purchasedPlayers.length} player(s). Reset auction or unassign players before deleting this team.`,
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete team "${team.name}"?`,
      text: 'This action will remove the franchise and free up shortcut key [' + team.shortcutKey + '].',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Franchise',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444'
    });

    if (confirm.isConfirmed) {
      try {
        await axiosClient.delete(`/teams/${team._id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: `Team "${team.name}" deleted.`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
        fetchTeams();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to delete team.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Team & Franchise Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure tournament franchises, assign keyboard shortcuts for fast live bidding, and monitor team purse balances.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Franchise</span>
        </button>
      </div>

      {/* Grid of Teams */}
      {loading ? (
        <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading franchises...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          No teams registered yet. Click "Add New Franchise" to register teams.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const pursePercent = team.initialBudget > 0 ? (team.remainingBalance / team.initialBudget) * 100 : 0;
            return (
              <div
                key={team._id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Bar with Logo & Hotkey */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 p-1.5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xl font-black text-amber-400">{team.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-lg group-hover:text-amber-400 transition-colors">
                          {team.name}
                        </h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-medium">Hotkey:</span>
                          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-sm">
                            {team.shortcutKey}
                          </kbd>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(team)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Team"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(team)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Purse / Budget Progress */}
                  <div className="space-y-2 py-3 border-t border-b border-slate-800 my-4">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-400">Remaining Balance:</span>
                      <span className="font-bold font-mono text-emerald-400 text-sm">
                        {formatCurrency(team.remainingBalance)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, pursePercent))}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Spent: <span className="text-white font-medium">{formatCurrency(team.totalSpent)}</span></span>
                      <span>Initial: <span className="text-slate-300 font-medium">{formatCurrency(team.initialBudget)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Footer with Purchased Players Link */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">{team.purchasedPlayers?.length || 0}</span>
                    <span className="text-slate-400">players signed</span>
                  </div>

                  <button
                    onClick={() => setViewingPlayersTeam(team)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Squad</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Franchise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? 'Edit Franchise' : 'Create New Franchise'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Franchise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mumbai Strikers"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Initial Purse Budget ({useSettings().settings.currencySymbol}) *
              </label>
              <input
                type="number"
                value={initialBudget}
                onChange={(e) => setInitialBudget(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="any"
                placeholder="Enter any amount (e.g. 5000, 50000, 10000000)"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                Preview: {initialBudget ? formatCurrency(initialBudget) : '₹0'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hotkey Shortcut Key *
              </label>
              <input
                type="text"
                maxLength={1}
                value={shortcutKey}
                onChange={(e) => setShortcutKey(e.target.value.toUpperCase())}
                placeholder="e.g. Q, W, E"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 text-center font-mono font-bold text-lg uppercase focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Single keyboard character for fast bidding</span>
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Franchise Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <Shield className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-2 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose Logo Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Franchise'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Squad Modal */}
      <Modal
        isOpen={Boolean(viewingPlayersTeam)}
        onClose={() => setViewingPlayersTeam(null)}
        title={`${viewingPlayersTeam?.name} – Purchased Players (${viewingPlayersTeam?.purchasedPlayers?.length || 0})`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400">Total Money Spent: </span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {formatCurrency(viewingPlayersTeam?.totalSpent || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Remaining Purse: </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {formatCurrency(viewingPlayersTeam?.remainingBalance || 0)}
              </span>
            </div>
          </div>

          {!viewingPlayersTeam?.purchasedPlayers || viewingPlayersTeam.purchasedPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No players purchased yet by {viewingPlayersTeam?.name}.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto">
              {viewingPlayersTeam.purchasedPlayers.map((player) => (
                <div key={player._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {player.photo ? (
                        <img src={player.photo} alt={player.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">#{player.serialNumber}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {player.name} <span className="text-xs text-slate-400">#{player.serialNumber}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {player.category?.name || 'Player'} • {player.battingStyle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {formatCurrency(player.soldPrice)}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Base: {formatCurrency(player.basePrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeamManagement;
