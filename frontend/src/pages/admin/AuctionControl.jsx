import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { useSettings } from '../../context/SettingsContext';
import SoldCelebration from '../../components/auction/SoldCelebration';
import UnsoldBanner from '../../components/auction/UnsoldBanner';
import KeyboardGuideModal from '../../components/auction/KeyboardGuideModal';
import Swal from 'sweetalert2';
import { 
  Gavel, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Pause, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Keyboard, 
  Shield, 
  TrendingUp, 
  Plus, 
  Tv, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const AuctionControl = () => {
  const { formatCurrency } = useSettings();
  const { realtimeState, latestSoldEvent, latestUnsoldEvent, clearCelebration } = useSocket();

  // State
  const [auctionState, setAuctionState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & serial jumps
  const [serialInput, setSerialInput] = useState('');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Bid configuration inputs
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [customIncrement, setCustomIncrement] = useState('');
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);

  // Bid bump animation tracker
  const [bidBump, setBidBump] = useState(false);

  // Fetch full admin auction state
  const fetchState = async () => {
    try {
      const res = await axiosClient.get('/auction/admin-state');
      if (res.data.success) {
        setAuctionState(res.data.state);
        if (res.data.state?.currentIncrement) {
          setCustomIncrement(res.data.state.currentIncrement);
        }
      }
    } catch (err) {
      console.error('Failed to load auction state:', err);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [tRes, cRes, pRes] = await Promise.all([
        axiosClient.get('/teams'),
        axiosClient.get('/categories'),
        axiosClient.get('/players?status=PENDING&sort=serialNumber&order=asc')
      ]);
      if (tRes.data.success) setTeams(tRes.data.teams);
      if (cRes.data.success) setCategories(cRes.data.categories);
      if (pRes.data.success) setPendingPlayers(pRes.data.players);
    } catch (err) {
      console.error('Failed to load auxiliary auction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    fetchAuxData();
  }, []);

  // Update local state when realtime updates arrive via Socket
  useEffect(() => {
    if (realtimeState) {
      setAuctionState(realtimeState);
      setBidBump(true);
      const timer = setTimeout(() => setBidBump(false), 400);
      return () => clearTimeout(timer);
    }
  }, [realtimeState]);

  // Select player by serial number or ID
  const handleSelectPlayer = async (serialOrId, isSerial = false) => {
    try {
      const payload = isSerial ? { serialNumber: Number(serialOrId) } : { playerId: serialOrId };
      const res = await axiosClient.post('/auction/select-player', payload);
      if (res.data.success) {
        setAuctionState(res.data.state);
        setSerialInput('');
        fetchAuxData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Player Selection Failed',
        text: err.response?.data?.message || 'Player not found.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  // Navigate player (next/prev)
  const handleNavigate = async (direction) => {
    try {
      const res = await axiosClient.post('/auction/navigate-player', {
        direction,
        categoryId: selectedCategory || undefined
      });
      if (res.data.success) {
        setAuctionState(res.data.state);
        fetchAuxData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'info',
        title: 'Navigation',
        text: err.response?.data?.message || 'No more players in this direction.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  // Place bid (via team button or hotkey)
  const handlePlaceBid = async (team, customAmount = null) => {
    if (!auctionState?.currentPlayer) {
      Swal.fire({
        icon: 'warning',
        title: 'No Player Selected',
        text: 'Please select a player to begin bidding.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (auctionState.status !== 'ACTIVE') {
      Swal.fire({
        icon: 'warning',
        title: `Auction ${auctionState.status}`,
        text: 'The auction must be ACTIVE to place bids. Click Resume or Select a Player.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      const payload = {
        teamId: team._id,
        customAmount: customAmount !== null ? customAmount : undefined
      };
      const res = await axiosClient.post('/auction/bid', payload);
      if (res.data.success) {
        setAuctionState(res.data.state);
        setCustomBidAmount('');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Bid Rejected',
        text: err.response?.data?.message || 'Invalid bid.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = useCallback((e) => {
    // DO NOT trigger shortcuts when typing in inputs, textareas, or selects
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const pressedKey = e.key.toUpperCase();

    // Check if key matches any team shortcut key
    const matchedTeam = teams.find((t) => t.shortcutKey === pressedKey);
    if (matchedTeam) {
      e.preventDefault();
      handlePlaceBid(matchedTeam);
    }
  }, [teams, auctionState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Undo last bid
  const handleUndoBid = async () => {
    try {
      const res = await axiosClient.post('/auction/undo-bid');
      if (res.data.success) {
        setAuctionState(res.data.state);
      }
    } catch (err) {
      Swal.fire({
        icon: 'info',
        title: 'Undo Bid',
        text: err.response?.data?.message || 'No bids to undo.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  // Toggle pause
  const handleTogglePause = async () => {
    try {
      const res = await axiosClient.post('/auction/pause');
      if (res.data.success) {
        setAuctionState(res.data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set Increment
  const handleUpdateIncrement = async (val) => {
    try {
      const num = Number(val);
      if (isNaN(num) || num <= 0) return;
      const res = await axiosClient.post('/auction/increment', { increment: num });
      if (res.data.success) {
        setAuctionState(res.data.state);
        setCustomIncrement(num);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Sold
  const handleMarkSold = async () => {
    if (!auctionState?.currentBiddingTeam) {
      Swal.fire({
        icon: 'warning',
        title: 'No Bidder',
        text: 'Cannot mark as SOLD! At least one franchise must place a bid.',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Confirm Player Sale',
      text: `Sell ${auctionState.currentPlayer.name} to ${auctionState.currentBiddingTeam.name} for ${formatCurrency(auctionState.currentBid)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, SOLD!',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosClient.post('/auction/sold');
        if (res.data.success) {
          setAuctionState(res.data.state);
          fetchAuxData();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Sale Failed',
          text: err.response?.data?.message || 'Could not complete sale.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  // Mark Unsold
  const handleMarkUnsold = async () => {
    const confirm = await Swal.fire({
      title: 'Pass Player Unsold?',
      text: `Mark ${auctionState?.currentPlayer?.name} as UNSOLD? No money will be deducted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, UNSOLD',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosClient.post('/auction/unsold');
        if (res.data.success) {
          setAuctionState(res.data.state);
          fetchAuxData();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to mark unsold.',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  const currentPlayer = auctionState?.currentPlayer;
  const currentBiddingTeam = auctionState?.currentBiddingTeam;
  const currentBid = auctionState?.currentBid || 0;
  const currentIncrementVal = auctionState?.currentIncrement || 100000;
  const status = auctionState?.status || 'IDLE';

  // Filtered pending players list for sidebar
  const filteredPending = pendingPlayers.filter((p) => {
    if (selectedCategory && (p.category?._id || p.category) !== selectedCategory) return false;
    if (searchPlayer) {
      const q = searchPlayer.toLowerCase();
      return p.name.toLowerCase().includes(q) || String(p.serialNumber).includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Celebration & Unsold Overlays */}
      <SoldCelebration soldData={latestSoldEvent} onClose={clearCelebration} />
      <UnsoldBanner unsoldData={latestUnsoldEvent} onClose={clearCelebration} />
      <KeyboardGuideModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
        teams={teams}
      />

      {/* Top Status & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center space-x-2">
              <span>Admin Auction Command Desk</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                status === 'SOLD' ? 'bg-cyan-500/20 text-cyan-400' :
                status === 'UNSOLD' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {status}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Round {auctionState?.currentRound || 1} {auctionState?.isUnsoldRound ? '(Unsold Pool)' : ''} • Press team keys [Q, W, E, R, T] to bid
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Keyboard Guide Button */}
          <button
            onClick={() => setIsKeyboardModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>Hotkeys Guide</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors ${
              status === 'PAUSED'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {status === 'PAUSED' ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Auction</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Auction</span>
              </>
            )}
          </button>

          {/* TV Screen Launcher */}
          <a
            href="/live"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
            title="Open Live TV Broadcast View"
          >
            <Tv className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* 3-SECTION AUCTION CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ================= LEFT SECTION: PLAYER SELECTION & ROSTER (Col 3) ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Player Navigation</span>
              <span className="text-amber-400 font-mono text-[11px]">{pendingPlayers.length} Pending</span>
            </h3>

            {/* Quick Serial Number Jump Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (serialInput) handleSelectPlayer(serialInput, true);
              }}
              className="flex space-x-1.5"
            >
              <input
                type="number"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Jump to Serial #..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase"
              >
                Go
              </button>
            </form>

            {/* Prev / Next Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleNavigate('prev')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Player</span>
              </button>
              <button
                onClick={() => handleNavigate('next')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
              >
                <span>Next Player</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">
                Filter Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                placeholder="Search roster..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Pending Players Scroll List */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-2">
              Pending Queue ({filteredPending.length})
            </h4>
            <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
              {filteredPending.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No players in this filter.</p>
              ) : (
                filteredPending.map((p) => {
                  const isCurrent = currentPlayer && currentPlayer._id === p._id;
                  return (
                    <button
                      key={p._id}
                      onClick={() => handleSelectPlayer(p._id, false)}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCurrent ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{p.serialNumber}
                        </span>
                        <span className="text-xs truncate">{p.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ml-1 ${
                        isCurrent ? 'text-slate-950' : 'text-emerald-400'
                      }`}>
                        {formatCurrency(p.basePrice)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= CENTER SECTION: CURRENT PLAYER CARD (Col 5) ================= */}
        <div className="lg:col-span-5">
          <div className="h-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Background ambient badge */}
            <div className="absolute top-4 right-4">
              <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border ${
                currentPlayer?.status === 'SOLD'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : currentPlayer?.status === 'UNSOLD'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {currentPlayer?.status || 'READY'}
              </span>
            </div>

            {!currentPlayer ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mx-auto text-slate-600">
                  🏏
                </div>
                <h3 className="text-xl font-bold text-white">No Player on Auction Block</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Select a player from the left queue or enter a serial number to initiate bidding.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Photo and Core Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
                  {/* Photo with serial badge */}
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-800 shadow-xl shrink-0">
                    {currentPlayer.photo ? (
                      <img
                        src={currentPlayer.photo}
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-4xl text-slate-600">
                        #{currentPlayer.serialNumber}
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-1.5 text-center">
                      <span className="text-[11px] font-mono font-black text-amber-300">
                        SERIAL #{currentPlayer.serialNumber}
                      </span>
                    </div>
                  </div>

                  {/* Player Name & Tagline */}
                  <div className="text-center sm:text-left space-y-1.5 flex-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {currentPlayer.category?.name || 'Category'}
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {currentPlayer.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Age: <span className="text-white font-semibold">{currentPlayer.age}</span>
                      {currentPlayer.previousTeam && (
                        <span> • Former Franchise: <span className="text-amber-300">{currentPlayer.previousTeam}</span></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-slate-800 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Batting Style</span>
                    <p className="font-bold text-white text-sm">{currentPlayer.battingStyle || 'Right-hand bat'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Bowling Style</span>
                    <p className="font-bold text-white text-sm">{currentPlayer.bowlingStyle || 'Right-arm medium'}</p>
                  </div>
                </div>

                {/* Base Price & Notes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase">Opening Base Price:</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      {formatCurrency(currentPlayer.basePrice)}
                    </span>
                  </div>

                  {currentPlayer.description && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-300 font-semibold">Scouting Note: </span>
                      {currentPlayer.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Bids in current pool: <strong className="text-white">{auctionState?.bidHistory?.length || 0}</strong></span>
              {currentPlayer?.auctionAttempts?.length > 0 && (
                <span className="text-amber-400 font-medium">
                  {currentPlayer.auctionAttempts.length} Previous Auction Attempt(s)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION: BIDDING CONTROLS & SOLD/UNSOLD (Col 4) ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            {/* Massive Current Bid Display */}
            <div className={`p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 text-center relative overflow-hidden ${
              bidBump ? 'animate-bid-bump ring-2 ring-amber-400' : ''
            }`}>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 block mb-1">
                Current Highest Bid
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-mono tracking-tight">
                {formatCurrency(currentBid)}
              </div>

              {/* Bidding Franchise Badge */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center space-x-2">
                {currentBiddingTeam ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center">
                      {currentBiddingTeam.logo ? (
                        <img src={currentBiddingTeam.logo} alt={currentBiddingTeam.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-white truncate max-w-[150px]">{currentBiddingTeam.name}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        Purse Left: {formatCurrency(currentBiddingTeam.remainingBalance)}
                      </p>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-medium italic">
                    Waiting for opening bid...
                  </span>
                )}
              </div>
            </div>

            {/* Bid Increments & Custom Bid Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Bidding Increment:</span>
                <span className="text-amber-400 font-mono font-bold">
                  +{formatCurrency(currentIncrementVal)}
                </span>
              </div>

              {/* Quick increment preset buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[500, 1000, 5000, 10000, 50000, 100000, 200000, 500000].map((inc) => (
                  <button
                    key={inc}
                    onClick={() => handleUpdateIncrement(inc)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center ${
                      currentIncrementVal === inc
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    +{inc >= 100000 ? `${inc / 100000}L` : inc >= 1000 ? `${inc / 1000}k` : inc}
                  </button>
                ))}
              </div>

              {/* Custom Increment Input */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={customIncrement}
                  onChange={(e) => setCustomIncrement(e.target.value)}
                  placeholder="Custom increment..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleUpdateIncrement(customIncrement)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Set
                </button>
              </div>

              {/* Manual Custom Bid Amount */}
              <div className="flex space-x-2 pt-1">
                <input
                  type="number"
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  placeholder="Manual exact bid..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (currentBiddingTeam && customBidAmount) {
                      handlePlaceBid(currentBiddingTeam, Number(customBidAmount));
                    } else {
                      Swal.fire({
                        icon: 'info',
                        title: 'Select Franchise',
                        text: 'Click on a team card below to place this custom bid.',
                        background: '#0f172a',
                        color: '#f8fafc'
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Quick Franchise Bid Buttons (with hotkey badges) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Click or Press Key to Bid:</span>
                <span className="text-[11px] text-slate-500">Shortcuts active</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {teams.map((t) => {
                  const isCurrentBidder = currentBiddingTeam && (currentBiddingTeam._id === t._id);
                  return (
                    <button
                      key={t._id}
                      onClick={() => handlePlaceBid(t, customBidAmount ? Number(customBidAmount) : null)}
                      className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all transform active:scale-95 ${
                        isCurrentBidder
                          ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {t.logo ? (
                            <img src={t.logo} alt={t.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">{t.name[0]}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold truncate max-w-[80px]">{t.name}</span>
                      </div>

                      <kbd className="px-2 py-1 rounded bg-slate-800 border border-amber-500/40 text-amber-300 font-mono font-black text-xs shadow-inner">
                        {t.shortcutKey}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: SOLD, UNSOLD, UNDO */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={handleMarkSold}
                disabled={!currentBiddingTeam}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5 fill-current" />
                <span>SOLD PLAYER</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMarkUnsold}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark Unsold</span>
                </button>

                <button
                  onClick={handleUndoBid}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo Bid</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionControl;
