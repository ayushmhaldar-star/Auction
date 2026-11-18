import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSettings } from '../../context/SettingsContext';
import Swal from 'sweetalert2';
import { XCircle, RotateCcw, Gavel, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const UnsoldPlayers = () => {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  const fetchUnsoldPlayers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/players?status=UNSOLD&sort=serialNumber&order=asc');
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
    fetchUnsoldPlayers();
  }, []);

  const handleStartUnsoldRound = async () => {
    if (players.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Unsold Players',
        text: 'There are currently no unsold players available to auction.',
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Start Unsold Player Round?',
      text: `This will reset all ${players.length} unsold player(s) back to PENDING for the new auction round. Their profiles and base prices remain intact.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Start Unsold Round',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      setRestarting(true);
      try {
        const res = await axiosClient.post('/auction/start-unsold-round');
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Unsold Round Started!',
            text: res.data.message,
            background: '#0f172a',
            color: '#f8fafc',
            timer: 2000
          });
          navigate('/admin/auction');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to start unsold round.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      } finally {
        setRestarting(false);
      }
    }
  };

  const auctionSpecificPlayer = async (player) => {
    try {
      // First update player back to pending so they can be selected
      await axiosClient.put(`/players/${player._id}`, { status: 'PENDING' });
      await axiosClient.post('/auction/select-player', { playerId: player._id });
      navigate('/admin/auction');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Could not select player.',
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
            <XCircle className="w-6 h-6 text-rose-400" />
            <span>Unsold Players & Re-Auction Pool</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Players who received no bids in earlier rounds. Re-auction them individually or initiate a dedicated Unsold Round.
          </p>
        </div>

        {/* Start Unsold Round Button */}
        <button
          onClick={handleStartUnsoldRound}
          disabled={players.length === 0 || restarting}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-40"
        >
          <RotateCcw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
          <span>START UNSOLD ROUND ({players.length})</span>
        </button>
      </div>

      {/* Unsold Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-amber-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading unsold players...</span>
          </div>
        ) : players.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-2xl">
              👍
            </div>
            <h3 className="text-lg font-bold text-white">No Unsold Players in Pool</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any players marked UNSOLD during active bidding will be listed here for second-chance rounds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Serial #</th>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Style</th>
                  <th className="px-4 py-3.5 text-right">Base Price</th>
                  <th className="px-4 py-3.5 text-center">Auction Attempts</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-rose-300 font-mono font-bold text-xs border border-slate-700">
                        #{p.serialNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center grayscale">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">#{p.serialNumber}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.age} yrs • {p.battingStyle}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {p.category?.name || 'Category'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      <div>{p.battingStyle}</div>
                      <div className="text-[11px] text-slate-500">{p.bowlingStyle}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                      {formatCurrency(p.basePrice)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.auctionAttempts?.length || 1} Attempt(s)
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => auctionSpecificPlayer(p)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1 border border-amber-500/30 transition-all ml-auto"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Re-Auction</span>
                      </button>
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

export default UnsoldPlayers;
