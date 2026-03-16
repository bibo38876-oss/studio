"use client"

import { cn } from '@/lib/utils';

export type VerificationType = 'none' | 'blue' | 'gold';

interface VerifiedBadgeProps {
  type: VerificationType;
  className?: string;
  size?: number;
}

export default function VerifiedBadge({ type, className, size = 14 }: VerifiedBadgeProps) {
  if (!type || type === 'none') return null;

  const colors = {
    blue: "#1D9BF0",
    gold: "#EAB308",
  };

  const color = colors[type as keyof typeof colors] || colors.blue;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M22.5 12.5C22.5 18.0228 18.0228 22.5 12.5 22.5C6.97715 22.5 2.5 18.0228 2.5 12.5C2.5 6.97715 6.97715 2.5 12.5 2.5C18.0228 2.5 22.5 6.97715 22.5 12.5Z" 
        fill={color} 
      />
      <path 
        d="M22.25 12C22.25 13.07 21.37 14.15 21.1 15.19C20.82 16.27 21.17 17.51 20.61 18.41C20.04 19.3 18.8 19.46 17.98 20.1C17.15 20.73 16.71 21.84 15.7 22.18C14.7 22.5 13.56 21.9 12.5 21.9C11.44 21.9 10.3 22.51 9.3 22.18C8.29 21.84 7.85 20.73 7.02 20.1C6.2 19.46 4.96 19.31 4.39 18.41C3.83 17.51 4.18 16.27 3.9 15.19C3.63 14.15 2.75 13.07 2.75 12C2.75 10.93 3.63 9.85 3.9 8.81C4.18 7.73 3.83 6.49 4.39 5.59C4.96 4.69 6.2 4.54 7.02 3.9C7.85 3.27 8.29 2.16 9.3 1.82C10.3 1.49 11.44 2.1 12.5 2.1C13.56 2.1 14.7 1.49 15.7 1.82C16.71 2.16 17.15 3.27 17.98 3.9C18.8 4.54 20.04 4.69 20.61 5.59C21.17 6.49 20.82 7.73 21.1 8.81C21.37 9.85 22.25 10.93 22.25 12Z" 
        fill={color} 
      />
      <path 
        d="M9 12L11 14L15 10" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
