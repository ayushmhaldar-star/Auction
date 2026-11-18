import React from 'react';

export const AuctionProBadge = ({ className = 'w-10 h-10', iconOnly = false }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/25 ${className}`}>
      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        >
          {/* Hexagonal Champion Shield Outline */}
          <path
            d="M32 4L54 16V36C54 47.5 44.5 57 32 60C19.5 57 10 47.5 10 36V16L32 4Z"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gavel Head */}
          <rect
            x="24"
            y="18"
            width="22"
            height="9"
            rx="2.5"
            transform="rotate(38 24 18)"
            fill="url(#goldGradient)"
          />
          {/* Gavel Handle */}
          <line
            x1="30"
            y1="26"
            x2="18"
            y2="42"
            stroke="url(#goldGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Sound Block / Podium */}
          <path
            d="M26 48L44 48"
            stroke="url(#goldGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lightning / Star Spark */}
          <path
            d="M48 20L50 24L54 25L50.5 28L51 32L47.5 30L44 32L45 28L42 25L46 24L48 20Z"
            fill="#FDE047"
          />

          <defs>
            <linearGradient id="goldGradient" x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const AuctionProLogo = ({ size = 'md', showSubtitle = true, linkToHome = false }) => {
  const sizeClasses = {
    sm: { badge: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { badge: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]' },
    lg: { badge: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { badge: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' }
  };

  const s = sizeClasses[size] || sizeClasses.md;

  const content = (
    <div className="flex items-center space-x-3 select-none">
      <AuctionProBadge className={s.badge} />
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`font-black tracking-wider text-white uppercase font-sans ${s.text}`}>
            AUCTION
          </span>
          <span className={`font-black tracking-wider uppercase font-sans bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent ${s.text}`}>
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-amber-400 font-extrabold uppercase tracking-widest mt-0.5 ${s.sub}`}>
            Premier League Auction Desk
          </span>
        )}
      </div>
    </div>
  );

  return content;
};

export default AuctionProLogo;
