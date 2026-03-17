
'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';

/**
 * WoodenChestIcon - A professional SVG representing a treasure chest.
 */
function WoodenChestIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect x="3" y="10" width="18" height="10" rx="1" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
      <path d="M3 10V7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V10H3Z" fill="#92400E" stroke="#451A03" strokeWidth="1.2" />
      <rect x="6" y="4" width="2" height="16" fill="#451A03" fillOpacity="0.4" />
      <rect x="16" y="4" width="2" height="16" fill="#451A03" fillOpacity="0.4" />
      <rect x="9" y="9" width="6" height="4" rx="1" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="12" cy="11" r="0.8" fill="#451A03" />
      <rect x="11.6" y="11" width="0.8" height="1.5" rx="0.2" fill="#451A03" />
      <path d="M10 4C10 3.44772 10.4477 3 11 3H13C13.5523 3 14 3.44772 14 4" stroke="#451A03" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { firestore, user } = useFirebase();

  const unreadQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('read', '==', false)
    );
  }, [firestore, user]);

  const { data: unreadNotifications } = useCollection(unreadQuery);
  const hasUnread = unreadNotifications && unreadNotifications.length > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full h-8 border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-5xl gap-4">
        <div className={`flex items-center transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-primary font-headline tracking-tighter whitespace-nowrap group">
            <TimgadLogo size={14} className="text-primary group-hover:scale-110 transition-transform" />
            تيمقاد <span className="text-accent text-[8px]">Timgad</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center transition-all duration-300">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm group">
            <button type="submit" className="absolute end-2.5 top-1/2 -translate-y-1/2 transition-colors">
              <Search size={12} className={`${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>
            <input 
              placeholder="بحث عن أشخاص أو وسم..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-6 w-full pe-8 ps-4 bg-secondary/50 border-none rounded-full text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-secondary transition-all ${isSearchFocused ? 'shadow-sm ring-1 ring-primary/10' : ''}`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
          </form>
        </div>

        <div className={`flex items-center gap-1 transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/vault">
            <motion.div
              whileHover={{ scale: 1.1, rotate: [-2, 2, -2, 0] }}
              whileTap={{ scale: 0.9 }}
              className="h-7 w-7 flex items-center justify-center cursor-pointer hover:bg-secondary rounded-full transition-colors relative"
              title="خزانة تيمقاد"
            >
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <WoodenChestIcon size={16} />
              </motion.div>
              <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          </Link>
          
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full relative hover:bg-secondary transition-all">
              <Bell size={16} className="text-muted-foreground" />
              {hasUnread && (
                <span className="absolute top-2 start-2 w-1.5 h-1.5 bg-accent rounded-full border border-background animate-pulse shadow-[0_0_5px_rgba(var(--accent),0.5)]"></span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
