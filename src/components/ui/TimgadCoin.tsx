"use client"

import { cn } from "@/lib/utils";

interface CoinProps {
  size?: number;
  className?: string;
}

/**
 * TimgadCoin - A reusable component representing the official Timgad Coin.
 * Designed with gold gradients and professional numismatic details.
 */
export default function TimgadCoin({ size = 24, className }: CoinProps) {
  const uniqueId = Math.random().toString(36).substring(7);
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("drop-shadow-md", className)}
    >
      <defs>
        <radialGradient id={`gold-coin-${uniqueId}`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff7b5"/>
          <stop offset="30%" stopColor="#f3d34a"/>
          <stop offset="55%" stopColor="#d4a017"/>
          <stop offset="80%" stopColor="#a87900"/>
          <stop offset="100%" stopColor="#6b4f00"/>
        </radialGradient>
        <linearGradient id={`rim-coin-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2a8"/>
          <stop offset="50%" stopColor="#c99700"/>
          <stop offset="100%" stopColor="#6b4f00"/>
        </linearGradient>
        <path id={`circleText-coin-${uniqueId}`} d="M100,100 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0"/>
      </defs>
      
      {/* Outer Rim */}
      <circle cx="100" cy="100" r="95" fill="url(#rim-coin-uniqueId)" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#8a6500" strokeWidth="4" strokeDasharray="2 4"/>
      
      {/* Main Gold Body */}
      <circle cx="100" cy="100" r="82" fill={`url(#gold-coin-${uniqueId})`}/>
      <circle cx="100" cy="100" r="65" fill="none" stroke="#a87900" strokeWidth="2"/>
      
      {/* Circular Text (Miniaturized) */}
      <text fontSize="14" fill="#6b4f00" fontFamily="Arial" letterSpacing="2" fontWeight="bold">
        <textPath href={`#circleText-coin-${uniqueId}`} startOffset="50%" textAnchor="middle">
          TIMGAD • COIN •
        </textPath>
      </text>
      
      {/* Center T Emblem */}
      <text x="100" y="125" textAnchor="middle" fontFamily="serif" fontSize="85" fontWeight="bold" fill="#6b4f00" stroke="#4a3500" strokeWidth="1.5">
        T
      </text>
    </svg>
  );
}
