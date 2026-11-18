import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Users, Tags, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', displayOrder: 0 });
  const [viewingPlayers, setViewingPlayers] = useState(null);
  const [categoryPlayers, setCategoryPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', displayOrder: categories.length + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      displayOrder: cat.displayOrder || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await axiosClient.put(`/categories/${editingCategory._id}`, formData);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Category Updated',
            text: `Category "${formData.name}" has been updated.`,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#f59e0b',
            timer: 2000
          });
        }
      } else {
        const res = await axiosClient.post('/categories', formData);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Category Created',
            text: `Category "${formData.name}" has been added.`,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#f59e0b',
            timer: 2000
          });
        }
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Operation failed.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  const handleDelete = async (cat) => {
    if (cat.playerCount > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete Category',
        text: `There are ${cat.playerCount} player(s) currently assigned to "${cat.name}". Please reassign or remove them first.`,
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete "${cat.name}"?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosClient.delete(`/categories/${cat._id}`);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: `Category "${cat.name}" was removed.`,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#f59e0b',
            timer: 2000
          });
          fetchCategories();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to delete category.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  const viewCategoryPlayers = async (cat) => {
    setViewingPlayers(cat);
    setLoadingPlayers(true);
    try {
      const res = await axiosClient.get(`/categories/${cat._id}/players`);
      if (res.data.success) {
        setCategoryPlayers(res.data.players);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Tags className="w-6 h-6 text-amber-400" />
            <span>Category Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, reorganize, and manage player specializations dynamically.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          No categories found. Click "Add Category" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      #{cat.displayOrder || 1}
                    </span>
                    <h3 className="font-extrabold text-white text-lg">{cat.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                  {cat.description || 'No description provided for this category.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">{cat.playerCount}</span>
                  <span className="text-slate-400">player{cat.playerCount !== 1 ? 's' : ''} assigned</span>
                </div>

                <button
                  onClick={() => viewCategoryPlayers(cat)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 group"
                >
                  <span>View Players</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Batsman, Bowler, All-Rounder"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category role and player criteria..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
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
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Category Players Modal */}
      <Modal
        isOpen={Boolean(viewingPlayers)}
        onClose={() => setViewingPlayers(null)}
        title={`Players in "${viewingPlayers?.name}"`}
        maxWidth="max-w-3xl"
      >
        {loadingPlayers ? (
          <div className="py-12 text-center text-amber-400">Loading players...</div>
        ) : categoryPlayers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No players are currently assigned to this category.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto">
            {categoryPlayers.map((player) => (
              <div key={player._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
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
                      {player.battingStyle} • {player.bowlingStyle}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      player.status === 'SOLD'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : player.status === 'UNSOLD'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {player.status}
                  </span>
                  {player.status === 'SOLD' && player.soldTo && (
                    <p className="text-[11px] text-amber-400 mt-0.5">Sold to {player.soldTo.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryManagement;
