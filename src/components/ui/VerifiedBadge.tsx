"use client"

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VerificationType = 'none' | 'blue' | 'gold' | 'grey';

interface VerifiedBadgeProps {
  type: VerificationType;
  className?: string;
  size?: number;
}

export default function VerifiedBadge({ type, className, size = 14 }: VerifiedBadgeProps) {
  if (!type || type === 'none') return null;

  const colors = {
    blue: "text-[#1D9BF0] fill-current",
    gold: "text-[#EAB308] fill-current",
    grey: "text-[#71717a] fill-current",
  };

  return (
    <BadgeCheck 
      size={size} 
      className={cn(colors[type as keyof typeof colors], className)} 
    />
  );
}
