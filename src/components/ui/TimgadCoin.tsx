
"use client"

import { cn } from "@/lib/utils";
import { useState, useEffect, memo } from "react";

interface CoinProps {
  size?: number;
  className?: string;
}

/**
 * TimgadCoin - Optimized version for performance.
 * Uses memo to prevent unnecessary re-renders in large lists.
 */
function TimgadCoinComponent({ size = 24, className }: CoinProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: size, height: size }} className={cn("bg-yellow-500/10 rounded-full animate-pulse", className)} />;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("drop-shadow-sm animate-gpu", className)}
    >
      <defs>
        <radialGradient id="gold-coin-grad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff7b5"/>
          <stop offset="55%" stopColor="#d4a017"/>
          <stop offset="100%" stopColor="#6b4f00"/>
        </radialGradient>
        <linearGradient id="rim-coin-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2a8"/>
          <stop offset="100%" stopColor="#6b4f00"/>
        </linearGradient>
      </defs>
      
      <circle cx="100" cy="100" r="95" fill="url(#rim-coin-grad)" />
      <circle cx="100" cy="100" r="82" fill="url(#gold-coin-grad)"/>
      <circle cx="100" cy="100" r="65" fill="none" stroke="#a87900" strokeWidth="1"/>
      
      <text x="100" y="125" textAnchor="middle" fontFamily="serif" fontSize="85" fontWeight="bold" fill="#6b4f00">
        T
      </text>
    </svg>
  );
}

export default memo(TimgadCoinComponent);
