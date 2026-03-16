"use client"

import { cn } from '@/lib/utils';

export type VerificationType = 'none' | 'blue' | 'gold';

interface VerifiedBadgeProps {
  type: VerificationType;
  className?: string;
  size?: number;
}

/**
 * VerifiedBadge - A component that renders an X-style verified badge.
 * Redrawn with precise geometric paths for the scalloped circle and checkmark.
 */
export default function VerifiedBadge({ type, className, size = 13 }: VerifiedBadgeProps) {
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
      aria-hidden="true"
    >
      {/* Official X/Twitter Scalloped Shape Path */}
      <path 
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" 
        fill={color} 
      />
      {/* Clean White Checkmark Path */}
      <path 
        d="M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" 
        fill="white" 
      />
    </svg>
  );
}
