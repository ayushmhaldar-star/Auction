import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import { CheckCircle2, Shield, RefreshCw } from 'lucide-react';

const SoldPlayers = () => {
  const { formatCurrency } = useSettings();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSoldPlayers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/players?status=SOLD&sort=soldPrice&order=desc');
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
    fetchSoldPlayers();
  }, []);

  const totalSoldAmount = players.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Sold Players Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed acquisitions across all tournament auction rounds.
          </p>
        </div>

        <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400">Total Sold: </span>
            <span className="font-bold text-white">{players.length} Players</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Total Realized: </span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(totalSoldAmount)}</span>
          </div>
        </div>
      </div>

      {/* Sold Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading sold players...</span>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No players sold yet. Once a player is hammered SOLD, they appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Serial #</th>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Winning Franchise</th>
                  <th className="px-4 py-3.5 text-right">Base Price</th>
                  <th className="px-4 py-3.5 text-right">Final Sold Price</th>
                  <th className="px-4 py-3.5 text-center">Round</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-bold text-xs border border-slate-700">
                        #{p.serialNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">#{p.serialNumber}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.battingStyle} • {p.age} yrs</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {p.category?.name || 'Category'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                          {p.soldTo?.logo ? (
                            <img src={p.soldTo.logo} alt={p.soldTo.name} className="w-full h-full object-contain" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="font-bold text-white text-xs">{p.soldTo?.name || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-400">
                      {formatCurrency(p.basePrice)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      {formatCurrency(p.soldPrice)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
                        Round {p.auctionRound || 1}
                      </span>
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

export default SoldPlayers;
