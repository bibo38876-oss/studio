
"use client"

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'white';
}

/**
 * TimgadLogo - A custom SVG icon representing the Timgad Arch.
 * Stylized minimalist design for a modern social media brand.
 */
export default function TimgadLogo({ className, size = 24, variant = 'default' }: LogoProps) {
  const color = variant === 'white' ? 'white' : 'currentColor';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-all duration-300", className)}
      aria-hidden="true"
    >
      {/* Main Arch Structure */}
      <path 
        d="M4 22V10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10V22" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base Foundation */}
      <path 
        d="M2 22H22" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      {/* Inner Detail / Stylized 'T' */}
      <path 
        d="M12 7V17M9 7H15" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
