import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { useSettings } from '../../context/SettingsContext';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Shield, 
  Maximize, 
  Minimize, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { AuctionProBadge } from '../../components/common/AuctionProLogo';

const LiveAuctionDisplay = () => {
  const { formatCurrency } = useSettings();
  const { socket, joinAuction, latestSoldEvent, latestUnsoldEvent } = useSocket();

  const [auctionState, setAuctionState] = useState(null);
  const [publicSettings, setPublicSettings] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bidBump, setBidBump] = useState(false);
  const [soldCelebration, setSoldCelebration] = useState(null);
  const [unsoldBanner, setUnsoldBanner] = useState(null);

  // Fetch initial public state and public settings
  const fetchInitialPublicData = async () => {
    try {
      const [stateRes, settingsRes] = await Promise.all([
        axiosClient.get('/auction/public-state'),
        axiosClient.get('/settings/public')
      ]);
      if (stateRes.data.success) {
        setAuctionState(stateRes.data.state);
      }
      if (settingsRes.data.success) {
        setPublicSettings(settingsRes.data.settings);
      }
    } catch (err) {
      console.warn('Failed to load initial public display data:', err);
    }
  };

  useEffect(() => {
    fetchInitialPublicData();
    joinAuction('public');
  }, []);

  // Listen to Socket state updates for viewers
  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (data) => {
      if (data && data.state) {
        setAuctionState(data.state);
        setBidBump(true);
        setTimeout(() => setBidBump(false), 500);

        // If a new player is presented or status returns to ACTIVE, clear overlays
        if (data.state.status === 'ACTIVE' || data.state.status === 'IDLE') {
          setSoldCelebration(null);
          setUnsoldBanner(null);
        }
      }
    };

    const handleSold = (data) => {
      setSoldCelebration(data);
      setUnsoldBanner(null);

      // Trigger spectator confetti
      const end = Date.now() + 4000;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 35,
          spread: 360,
          ticks: 70,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#eab308', '#10b981', '#06b6d4', '#f59e0b', '#ffffff']
        });
      }, 300);
    };

    const handleUnsold = (data) => {
      setUnsoldBanner(data);
      setSoldCelebration(null);
    };

    socket.on('public_state_update', (state) => handleStateUpdate({ state }));
    socket.on('auction_state_update', handleStateUpdate);
    socket.on('player_sold_event', handleSold);
    socket.on('player_unsold_event', handleUnsold);

    return () => {
      socket.off('public_state_update');
      socket.off('auction_state_update');
      socket.off('player_sold_event');
      socket.off('player_unsold_event');
    };
  }, [socket]);

  // Sync if latest events received via context
  useEffect(() => {
    if (latestSoldEvent) {
      setSoldCelebration(latestSoldEvent);
    }
  }, [latestSoldEvent]);

  useEffect(() => {
    if (latestUnsoldEvent) {
      setUnsoldBanner(latestUnsoldEvent);
    }
  }, [latestUnsoldEvent]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const currentPlayer = auctionState?.currentPlayer;
  const currentBiddingTeam = auctionState?.currentBiddingTeam;
  const currentBid = auctionState?.currentBid || 0;
  const status = auctionState?.status || 'IDLE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10 relative overflow-hidden select-none font-sans">
      {/* Background stadium lighting effect */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* TOP BROADCAST HEADER */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        {/* Left: Tournament & Live indicator */}
        <div className="flex items-center space-x-4">
          <AuctionProBadge className="w-12 h-12" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wider uppercase font-sans drop-shadow-sm flex items-center space-x-2">
              <span>{publicSettings?.auctionTitle || 'AUCTION PRO'}</span>
            </h1>
            <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest flex items-center space-x-2">
              <span>Official Player Auction</span>
              <span>•</span>
              <span>Round {auctionState?.currentRound || 1} {auctionState?.isUnsoldRound ? '(Unsold Round)' : ''}</span>
            </p>
          </div>
        </div>

        {/* Right: Live Badge & Fullscreen */}
        <div className="flex items-center space-x-4">
          {status === 'ACTIVE' ? (
            <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 font-black text-xs uppercase tracking-widest animate-pulse shadow-lg shadow-rose-600/20">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>LIVE AUCTION</span>
            </div>
          ) : status === 'PAUSED' ? (
            <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>AUCTION PAUSED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <span>{status}</span>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* CENTER: MAIN STAGE */}
      <main className="relative z-10 my-auto py-6">
        {!currentPlayer ? (
          <div className="max-w-2xl mx-auto p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-12 h-12 text-amber-400/60" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">
              Waiting for Next Player
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              The auctioneer is preparing the next profile. The live broadcast will update automatically once bidding opens.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-7xl mx-auto">
            
            {/* PLAYER SHOWCASE (Col 7) */}
            <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
              <div>
                {/* Serial & Category Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-mono font-black text-sm">
                    <span>SERIAL NO:</span>
                    <span className="text-white text-base">#{currentPlayer.serialNumber}</span>
                  </div>

                  <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-widest">
                    {currentPlayer.category || 'Specialist'}
                  </span>
                </div>

                {/* Photo & Player Bio */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                  {/* Player Photo */}
                  <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-slate-800 shadow-2xl shadow-amber-500/10 shrink-0">
                    {currentPlayer.photo ? (
                      <img
                        src={currentPlayer.photo}
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-6xl text-slate-700">
                        #{currentPlayer.serialNumber}
                      </div>
                    )}
                  </div>

                  {/* Player Name & Age */}
                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none">
                      {currentPlayer.name}
                    </h2>
                    <div className="text-sm font-semibold text-slate-300 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <span>Age: <strong className="text-amber-400">{currentPlayer.age} Years</strong></span>
                      {currentPlayer.previousTeam && (
                        <>
                          <span>•</span>
                          <span>Previous: <strong className="text-cyan-400">{currentPlayer.previousTeam}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Player Description / Bio */}
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <span className="text-[11px] uppercase font-extrabold text-amber-400 tracking-wider">
                      PLAYER DESCRIPTION
                    </span>
                    <p className="text-base text-slate-200 leading-relaxed font-medium">
                      {currentPlayer.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Base Price Bar */}
              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Starting Base Price:</span>
                <span className="font-mono font-black text-emerald-400 text-xl">
                  {formatCurrency(currentPlayer.basePrice)}
                </span>
              </div>
            </div>

            {/* LIVE BIDDING ARENA (Col 5) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900/90 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between text-center relative overflow-hidden">
              {/* Glowing ring on bid update */}
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CURRENT HIGHEST BID</span>
                </div>

                {/* Giant Bid Counter */}
                <div className={`py-6 transition-all duration-300 ${
                  bidBump ? 'animate-bid-bump scale-105' : ''
                }`}>
                  <div className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-mono tracking-tight drop-shadow-md">
                    {formatCurrency(currentBid)}
                  </div>
                </div>
              </div>

              {/* Current Bidding Franchise Box */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl space-y-3">
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-widest block">
                  Holding Franchise
                </span>

                {currentBiddingTeam ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-amber-500/50 p-2 overflow-hidden flex items-center justify-center shadow-lg shadow-amber-500/20">
                      {currentBiddingTeam.logo ? (
                        <img src={currentBiddingTeam.logo} alt={currentBiddingTeam.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-10 h-10 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white tracking-wide">
                        {currentBiddingTeam.name}
                      </h4>
                      <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Current Top Bidder
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-slate-500 text-sm font-semibold italic">
                    Opening bid at base price...
                  </div>
                )}
              </div>

              {/* Footer indicator */}
              <div className="pt-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                Real-Time Synchronized Broadcast
              </div>
            </div>

          </div>
        )}
      </main>

      {/* BROADCAST TICKER FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
          <span className="font-semibold text-slate-400 font-mono">LIVE SATELLITE FEED • 1080P PROJECTION</span>
        </div>
        <div className="font-medium text-slate-400">
          {publicSettings?.websiteTitle || 'AUCTION PRO'} © 2026 • Official Tournament Broadcast
        </div>
      </footer>

      {/* DEDICATED FULL-SCREEN SOLD CELEBRATION */}
      {soldCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-4 border-amber-500/60 rounded-[2.5rem] p-10 md:p-14 text-center shadow-2xl shadow-amber-500/30 relative overflow-hidden">
            
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-3 px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-lg uppercase tracking-widest shadow-xl shadow-amber-500/30 mb-8 animate-bounce">
              <Trophy className="w-6 h-6 fill-current" />
              <span>OFFICIALLY SOLD</span>
            </div>

            {/* Player & Winning Franchise */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 my-8">
              {/* Player */}
              <div className="flex flex-col items-center">
                <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-800 mb-4">
                  {soldCelebration.player?.photo ? (
                    <img src={soldCelebration.player.photo} alt={soldCelebration.player.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-600">
                      #{soldCelebration.player?.serialNumber}
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-black text-white uppercase">{soldCelebration.player?.name}</h3>
                <span className="text-sm font-bold text-amber-400 uppercase mt-1">
                  {soldCelebration.player?.category || 'Player'}
                </span>
              </div>

              <div className="text-amber-500 font-black text-4xl hidden md:block">
                ➔
              </div>

              {/* Franchise */}
              <div className="flex flex-col items-center">
                <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-emerald-400 shadow-2xl bg-slate-800 mb-4 flex items-center justify-center p-3">
                  {soldCelebration.winningTeam?.logo ? (
                    <img src={soldCelebration.winningTeam.logo} alt={soldCelebration.winningTeam.name} className="w-full h-full object-contain" />
                  ) : (
                    <Shield className="w-16 h-16 text-emerald-400" />
                  )}
                </div>
                <h3 className="text-3xl font-black text-white uppercase">{soldCelebration.winningTeam?.name}</h3>
                <span className="text-sm font-bold text-emerald-400 uppercase mt-1">
                  Winning Franchise
                </span>
              </div>
            </div>

            {/* Giant Hammer Price */}
            <div className="mt-8 pt-8 border-t border-slate-800/90">
              <span className="text-sm uppercase font-extrabold tracking-widest text-slate-400 block mb-2">
                Sold For Final Price
              </span>
              <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-mono tracking-tight">
                {formatCurrency(soldCelebration.soldPrice)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FULL-SCREEN UNSOLD SCREEN */}
      {unsoldBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-10 text-center shadow-2xl shadow-rose-500/20">
            <div className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black text-base uppercase tracking-widest mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>PLAYER UNSOLD</span>
            </div>

            <div className="flex flex-col items-center my-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-rose-500/40 bg-slate-800 mb-4 grayscale">
                {unsoldBanner.player?.photo ? (
                  <img src={unsoldBanner.player.photo} alt={unsoldBanner.player.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-600">
                    #{unsoldBanner.player?.serialNumber}
                  </div>
                )}
              </div>

              <h3 className="text-3xl font-black text-white uppercase">{unsoldBanner.player?.name}</h3>
              <p className="text-sm text-slate-400 uppercase mt-1">
                {unsoldBanner.player?.category} • #{unsoldBanner.player?.serialNumber}
              </p>
              <p className="text-sm text-rose-400/90 mt-4 max-w-md leading-relaxed">
                No bids placed in this round. Player has been assigned to the Unsold Pool for subsequent auction rounds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAuctionDisplay;
