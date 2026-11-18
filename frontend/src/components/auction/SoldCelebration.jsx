import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../context/SettingsContext';
import { Trophy, CheckCircle2, X } from 'lucide-react';

const SoldCelebration = ({ soldData, onClose }) => {
  const { formatCurrency } = useSettings();

  useEffect(() => {
    if (!soldData) return;

    // Trigger fireworks / confetti celebration
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    try {
      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#eab308', '#10b981', '#06b6d4', '#f59e0b', '#ffffff']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#eab308', '#10b981', '#06b6d4', '#f59e0b', '#ffffff']
        });
      }, 250);

      return () => clearInterval(interval);
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, [soldData]);

  if (!soldData) return null;

  // Support both soldData.team and soldData.winningTeam seamlessly
  const player = soldData.player || {};
  const team = soldData.team || soldData.winningTeam || {};
  const soldPrice = soldData.soldPrice || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/20 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SOLD Badge */}
        <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/30 mb-6">
          <Trophy className="w-4 h-4 fill-current" />
          <span>OFFICIALLY SOLD</span>
        </div>

        {/* Player and Team Showcases */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 my-6">
          {/* Player Card */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-800 mb-3">
              {player.photo ? (
                <img src={player.photo} alt={player.name || 'Player'} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-600">
                  #{player.serialNumber || '1'}
                </div>
              )}
            </div>
            <h4 className="text-xl font-black text-white">{player.name || 'Player'}</h4>
            <p className="text-xs text-amber-400 font-semibold uppercase">
              {typeof player.category === 'object' ? player.category?.name : player.category || 'Specialist'}
            </p>
          </div>

          <div className="text-slate-500 font-bold text-2xl uppercase tracking-widest hidden md:block">
            ➔
          </div>

          {/* Winning Team Card */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl bg-slate-800 mb-3 flex items-center justify-center p-2">
              {team.logo ? (
                <img src={team.logo} alt={team.name || 'Team'} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-600">
                  🛡️
                </div>
              )}
            </div>
            <h4 className="text-xl font-black text-white">{team.name || 'Winning Team'}</h4>
            <p className="text-xs text-emerald-400 font-semibold uppercase">Winning Franchise</p>
          </div>
        </div>

        {/* Final Amount */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">Final Sale Price</p>
          <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-mono">
            {formatCurrency(soldPrice)}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            Continue Auction
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoldCelebration;
