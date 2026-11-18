import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import { History, Download, Filter, RefreshCw, FileText } from 'lucide-react';

const AuctionHistory = () => {
  const { formatCurrency } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAuxData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        axiosClient.get('/teams'),
        axiosClient.get('/categories')
      ]);
      if (tRes.data.success) setTeams(tRes.data.teams);
      if (cRes.data.success) setCategories(cRes.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (teamFilter) params.teamId = teamFilter;
      if (statusFilter) params.status = statusFilter;
      if (roundFilter) params.round = roundFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await axiosClient.get('/auction/history', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [teamFilter, statusFilter, roundFilter, categoryFilter]);

  const handleExport = (format) => {
    let url = `/api/auction/history?exportFormat=${format}`;
    if (teamFilter) url += `&teamId=${teamFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (roundFilter) url += `&round=${roundFilter}`;
    if (categoryFilter) url += `&category=${categoryFilter}`;

    // Trigger file download
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Auction Transaction Audit Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete tamper-evident ledger of every bidding event, sale, and unsold conclusion.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-500/30 flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase text-slate-400 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </span>

        {/* Team Filter */}
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Franchises</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="SOLD">SOLD</option>
          <option value="UNSOLD">UNSOLD</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Round Filter */}
        <select
          value={roundFilter}
          onChange={(e) => setRoundFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Rounds</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
          <option value="3">Round 3</option>
        </select>

        {(teamFilter || statusFilter || categoryFilter || roundFilter) && (
          <button
            onClick={() => {
              setTeamFilter('');
              setStatusFilter('');
              setCategoryFilter('');
              setRoundFilter('');
            }}
            className="text-xs text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading transaction audit log...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No transactions match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Serial #</th>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Winning Team</th>
                  <th className="px-4 py-3.5 text-right">Base Price</th>
                  <th className="px-4 py-3.5 text-right">Hammer Price</th>
                  <th className="px-4 py-3.5 text-center">Round</th>
                  <th className="px-4 py-3.5 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-bold text-xs border border-slate-700">
                        #{t.playerSerialNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-white">
                      {t.playerName}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                        {t.playerCategory}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'SOLD'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-200">
                      {t.winningTeamName || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-400">
                      {formatCurrency(t.basePrice)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                      {t.status === 'SOLD' ? formatCurrency(t.finalPrice) : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-center text-xs font-mono">
                      R{t.round}
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs text-slate-400">
                      {new Date(t.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionHistory;
