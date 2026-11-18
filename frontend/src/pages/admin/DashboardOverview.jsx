import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/common/StatCard';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Coins, 
  Gavel, 
  ArrowRight, 
  Tv, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

const DashboardOverview = () => {
  const { formatCurrency, formatLakhCrore } = useSettings();
  const { realtimeState } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/auction/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [realtimeState]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-amber-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-sm">Loading Auction Statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auction Command Center</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Tournament Overview & Live Control
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage franchises, catalog players, control real-time bids with hotkeys, and broadcast live on TV/projector screens with zero latency.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/admin/auction"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all transform active:scale-95"
            >
              <Gavel className="w-4 h-4" />
              <span>Enter Auction Control</span>
            </Link>
            <a
              href="/live"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Launch Projector View</span>
            </a>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Players"
          value={stats?.totalPlayers ?? 0}
          subtitle={`${stats?.remainingPlayers ?? 0} players pending`}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Total Franchises"
          value={stats?.totalTeams ?? 0}
          subtitle="Ready for bidding"
          icon={Shield}
          color="amber"
        />
        <StatCard
          title="Players Sold"
          value={stats?.playersSold ?? 0}
          subtitle={`${stats?.playersUnsold ?? 0} unsold in pool`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Amount Spent"
          value={formatLakhCrore(stats?.totalAuctionAmount ?? 0)}
          subtitle={`Exact: ${formatCurrency(stats?.totalAuctionAmount ?? 0)}`}
          icon={Coins}
          color="purple"
        />
      </div>

      {/* Secondary Stats & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Auction State Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white text-base">Auction State</h3>
            <span className="text-xs px-2.5 py-1 rounded font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Round {stats?.currentRound || 1}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Current Phase:</span>
              <span className="font-bold text-white uppercase">{stats?.currentAuctionStatus || 'IDLE'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Unsold Round Active:</span>
              <span className={`font-bold ${stats?.isUnsoldRound ? 'text-rose-400' : 'text-slate-500'}`}>
                {stats?.isUnsoldRound ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Remaining Pending:</span>
              <span className="font-bold text-cyan-400">{stats?.remainingPlayers ?? 0} players</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/auction"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Manage Active Bids</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent Auction Transactions</span>
            </h3>
            <Link to="/admin/history" className="text-xs text-amber-400 hover:underline font-semibold">
              View All History ➔
            </Link>
          </div>

          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No auction transactions recorded yet. Start bidding from the Auction Control screen!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {stats.recentActivity.map((tx) => (
                <div key={tx._id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {tx.player?.photo ? (
                        <img src={tx.player.photo} alt={tx.playerName} className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">#{tx.playerSerialNumber}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {tx.playerName} <span className="text-xs text-slate-400 font-normal">#{tx.playerSerialNumber}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {tx.status === 'SOLD' ? (
                          <span>Sold to <span className="text-amber-400 font-semibold">{tx.winningTeamName}</span></span>
                        ) : (
                          <span className="text-rose-400 font-medium">Passed Unsold</span>
                        )}
                        <span className="mx-1.5">•</span>
                        <span>Round {tx.round}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${tx.status === 'SOLD' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {tx.status === 'SOLD' ? formatCurrency(tx.finalPrice) : 'Unsold'}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
