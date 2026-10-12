import React from 'react';

export const GovernmentSealSvg: React.FC<{ className?: string }> = ({ className = "w-64 h-64" }) => {
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="textCirclePath" d="M 50, 150 A 100,100 0 1,1 250,150 A 100,100 0 1,1 50,150" />
        <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Outer Glow Ring */}
      <circle cx="150" cy="150" r="140" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="2" strokeDasharray="6 6" />
      <circle cx="150" cy="150" r="132" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      
      {/* Inner Fill */}
      <circle cx="150" cy="150" r="125" fill="url(#sealGrad)" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="2" />
      
      {/* Laurel Wreath */}
      <g stroke="rgba(147, 197, 253, 0.4)" strokeWidth="2" fill="none">
        <path d="M 50 170 Q 40 120 70 80 Q 110 50 150 50 Q 190 50 230 80 Q 260 120 250 170 Q 230 220 180 240 Q 150 245 120 240 Q 70 220 50 170 Z" strokeWidth="1" />
        {/* Leaf details */}
        <path d="M 45 130 C 35 120, 40 100, 60 105" />
        <path d="M 55 95 C 50 80, 70 70, 80 85" />
        <path d="M 255 130 C 265 120, 260 100, 240 105" />
        <path d="M 245 95 C 250 80, 230 70, 220 85" />
      </g>

      {/* Circular Text */}
      <text fill="rgba(255, 255, 255, 0.35)" fontSize="13" fontWeight="800" letterSpacing="4">
        <textPath href="#textCirclePath" startOffset="50%" textAnchor="middle">
          GOVERNMENT • INTEGRITY • PROGRESS
        </textPath>
      </text>

      {/* Center Sun & Rays */}
      <g transform="translate(150, 115)">
        <circle cx="0" cy="0" r="16" fill="rgba(251, 191, 36, 0.6)" stroke="#f59e0b" strokeWidth="1.5" />
        {/* 8 Sun Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1="0"
            y1="-20"
            x2="0"
            y2="-28"
            stroke="rgba(251, 191, 36, 0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>

      {/* Three Stars */}
      <g fill="rgba(253, 224, 71, 0.7)">
        <polygon points="150,68 153,75 160,75 155,79 157,86 150,82 143,86 145,79 140,75 147,75" />
        <polygon points="105,88 108,95 115,95 110,99 112,106 105,102 98,106 100,99 95,95 102,95" />
        <polygon points="195,88 198,95 205,95 200,99 202,106 195,102 188,106 190,99 185,95 192,95" />
      </g>

      {/* Caring Hands / Base Emblem */}
      <g transform="translate(150, 185)" fill="none" stroke="rgba(96, 165, 250, 0.7)" strokeWidth="2.5" strokeLinecap="round">
        {/* Left hand */}
        <path d="M-40,10 C-30,30 -10,35 0,10" fill="rgba(37, 99, 235, 0.3)" />
        {/* Right hand */}
        <path d="M40,10 C30,30 10,35 0,10" fill="rgba(37, 99, 235, 0.3)" />
        {/* Center Heart / Helping hand */}
        <path d="M0,0 C-10,-12 -20,-2 0,15 C20,-2 10,-12 0,0 Z" fill="rgba(239, 68, 68, 0.6)" stroke="#f87171" />
      </g>
    </svg>
  );
};
