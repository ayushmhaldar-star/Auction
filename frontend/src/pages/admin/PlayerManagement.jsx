import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../../components/common/Modal';
import Swal from 'sweetalert2';
import { 
  Plus, 
  Users, 
  Search, 
  Filter, 
  Upload, 
  Edit2, 
  Trash2, 
  Gavel, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

const PlayerManagement = () => {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('serialNumber');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    age: 24,
    category: '',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    previousTeam: '',
    basePrice: 1000000,
    description: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File import state
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortBy,
        order: sortOrder
      };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axiosClient.get('/players', { params });
      if (res.data.success) {
        setPlayers(res.data.players);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [search, categoryFilter, statusFilter, sortBy, sortOrder]);

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormData({
      serialNumber: '',
      name: '',
      age: 24,
      category: categories[0]?._id || '',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      previousTeam: '',
      basePrice: 1000000,
      description: ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (player) => {
    setEditingPlayer(player);
    setFormData({
      serialNumber: player.serialNumber,
      name: player.name,
      age: player.age,
      category: player.category?._id || player.category,
      battingStyle: player.battingStyle || 'Right-hand bat',
      bowlingStyle: player.bowlingStyle || 'Right-arm medium',
      previousTeam: player.previousTeam || '',
      basePrice: player.basePrice,
      description: player.description || ''
    });
    setPhotoFile(null);
    setPhotoPreview(player.photo || '');
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    if (photoFile) {
      data.append('photo', photoFile);
    } else if (photoPreview && !photoFile) {
      data.append('photo', photoPreview);
    }

    try {
      if (editingPlayer) {
        await axiosClient.put(`/players/${editingPlayer._id}`, data);
        Swal.fire({
          icon: 'success',
          title: 'Player Updated',
          text: `Updated "${formData.name}".`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
      } else {
        await axiosClient.post('/players', data);
        Swal.fire({
          icon: 'success',
          title: 'Player Created',
          text: `Added player "${formData.name}".`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
      }
      setIsModalOpen(false);
      fetchPlayers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save player.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (player) => {
    const confirm = await Swal.fire({
      title: `Delete Player #${player.serialNumber}?`,
      text: `Are you sure you want to remove ${player.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444'
    });

    if (confirm.isConfirmed) {
      try {
        await axiosClient.delete(`/players/${player._id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: `Player ${player.name} deleted.`,
          background: '#0f172a',
          color: '#f8fafc',
          timer: 2000
        });
        fetchPlayers();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to delete player.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    const data = new FormData();
    data.append('file', importFile);

    try {
      const res = await axiosClient.post('/players/import', data);
      Swal.fire({
        icon: 'success',
        title: 'Import Complete',
        text: res.data.message,
        background: '#0f172a',
        color: '#f8fafc'
      });
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchPlayers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: err.response?.data?.message || 'File processing error.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setImporting(false);
    }
  };

  const startAuctionForPlayer = async (player) => {
    try {
      const res = await axiosClient.post('/auction/select-player', { playerId: player._id });
      if (res.data.success) {
        navigate('/admin/auction');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Could not select player for auction.',
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Player Registry & Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain player profiles, upload images, import bulk rosters from Excel/CSV, and select players for live auction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center space-x-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import CSV/Excel</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name or serial #..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SOLD">Sold</option>
          <option value="UNSOLD">Unsold</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split('-');
            setSortBy(sb);
            setSortOrder(so);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="serialNumber-asc">Serial # (1 ➔ 99)</option>
          <option value="serialNumber-desc">Serial # (99 ➔ 1)</option>
          <option value="basePrice-desc">Base Price (High ➔ Low)</option>
          <option value="basePrice-asc">Base Price (Low ➔ High)</option>
          <option value="name-asc">Name (A ➔ Z)</option>
        </select>
      </div>

      {/* Players Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading players...</span>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No players found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Serial #</th>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Style / Role</th>
                  <th className="px-4 py-3.5 text-right">Base Price</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Serial # */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-bold text-xs border border-slate-700">
                        #{p.serialNumber}
                      </span>
                    </td>

                    {/* Player Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">#{p.serialNumber}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">
                            Age: {p.age} {p.previousTeam ? `• Prev: ${p.previousTeam}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {p.category?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* Style */}
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      <div><span className="text-slate-300">{p.battingStyle}</span></div>
                      <div className="text-[11px] text-slate-500">{p.bowlingStyle}</div>
                    </td>

                    {/* Base Price */}
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                      {formatCurrency(p.basePrice)}
                      {p.status === 'SOLD' && (
                        <div className="text-xs font-bold text-emerald-400">
                          Sold: {formatCurrency(p.soldPrice)}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === 'SOLD'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'UNSOLD'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {p.status === 'SOLD' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SOLD ({p.soldTo?.name})</span>
                          </>
                        ) : p.status === 'UNSOLD' ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>UNSOLD</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => startAuctionForPlayer(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1 border border-amber-500/30 transition-all"
                          title="Auction this player now"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Auction</span>
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Player"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                          title="Delete Player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Player Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlayer ? `Edit Player #${editingPlayer.serialNumber}` : 'Register New Player'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Serial Number {editingPlayer ? '*' : '(Auto-generated if empty)'}
              </label>
              <input
                type="number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Auto"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Virat Sharma"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Age *
              </label>
              <input
                type="number"
                min="14"
                max="60"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Base Price ({useSettings().settings.currencySymbol}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value === '' ? '' : Number(e.target.value) })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Batting Style
              </label>
              <select
                value={formData.battingStyle}
                onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="Right-hand bat">Right-hand bat</option>
                <option value="Left-hand bat">Left-hand bat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Bowling Style
              </label>
              <input
                type="text"
                value={formData.bowlingStyle}
                onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                placeholder="e.g. Right-arm fast, Leg-break"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Previous Team
              </label>
              <input
                type="text"
                value={formData.previousTeam}
                onChange={(e) => setFormData({ ...formData, previousTeam: e.target.value })}
                placeholder="e.g. Mumbai Strikers"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Photo Upload and Preview */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Player Photograph
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover object-top" />
                ) : (
                  <Users className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-2 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose Photo File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description / Scouting Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Career highlights, stats, recent match performance..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
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
              {submitting ? 'Saving...' : editingPlayer ? 'Save Changes' : 'Register Player'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV / Excel Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Players from Excel or CSV"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload a spreadsheet (.xlsx or .csv) containing columns like <strong className="text-white">Name</strong>, <strong className="text-white">Category</strong>, <strong className="text-white">Age</strong>, <strong className="text-white">Base Price</strong>, <strong className="text-white">Batting Style</strong>, and <strong className="text-white">Bowling Style</strong>.
          </p>

          <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 text-center transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">
              {importFile ? importFile.name : 'Select or drop your spreadsheet'}
            </p>
            <p className="text-xs text-slate-500 mb-4">Supported formats: .xlsx, .xls, .csv (up to 10MB)</p>

            <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider inline-flex items-center space-x-2">
              <span>Browse File</span>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!importFile || importing}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {importing ? 'Processing File...' : 'Start Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlayerManagement;
