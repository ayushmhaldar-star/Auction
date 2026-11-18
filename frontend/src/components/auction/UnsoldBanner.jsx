import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const UnsoldBanner = ({ unsoldData, onClose }) => {
  if (!unsoldData) return null;

  const { player } = unsoldData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-rose-500/40 rounded-3xl p-8 text-center shadow-2xl shadow-rose-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* UNSOLD Stamp Badge */}
        <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black text-sm uppercase tracking-widest mb-6">
          <AlertCircle className="w-4 h-4" />
          <span>PLAYER UNSOLD</span>
        </div>

        <div className="flex flex-col items-center my-4">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-rose-500/40 bg-slate-800 mb-4 grayscale">
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-600">
                #{player.serialNumber}
              </div>
            )}
          </div>

          <h4 className="text-2xl font-black text-white">{player.name}</h4>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-1">
            {player.category?.name || player.category} • #{player.serialNumber}
          </p>
          <p className="text-xs text-rose-400/90 mt-4 max-w-xs leading-relaxed">
            No bids placed during this round. This player is moved to the Unsold Pool and can be re-auctioned in the Unsold Round.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider transition-all"
          >
            Next Player
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsoldBanner;
