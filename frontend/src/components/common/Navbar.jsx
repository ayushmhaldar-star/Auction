import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useSettings } from '../../context/SettingsContext';
import { Maximize, Minimize, Radio, Tv, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { isConnected, realtimeState } = useSocket();
  const { settings } = useSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const status = realtimeState?.status || 'IDLE';

  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>BIDDING ACTIVE</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>AUCTION PAUSED</span>
          </span>
        );
      case 'SOLD':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <span>PLAYER SOLD</span>
          </span>
        );
      case 'UNSOLD':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span>PLAYER UNSOLD</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>IDLE / READY</span>
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-base font-bold text-white tracking-wide truncate max-w-md">
          {settings.auctionTitle || 'Premier Cricket League Auction 2026'}
        </h2>
        {getStatusBadge()}
        {realtimeState?.currentRound && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Round {realtimeState.currentRound} {realtimeState.isUnsoldRound ? '(Unsold Pool)' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Socket status */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
            {isConnected ? 'Realtime Connected' : 'Reconnecting...'}
          </span>
        </div>

        {/* Live projector button */}
        <a
          href="/live"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
          title="Open Projector / TV Screen"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Launch TV View</span>
        </a>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
