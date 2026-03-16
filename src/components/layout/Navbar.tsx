
'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  return (
    <nav className="fixed top-0 z-50 w-full h-8 border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-5xl gap-4">
        <div className={`flex items-center transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-primary font-headline tracking-tighter whitespace-nowrap">
            <TimgadLogo size={14} className="text-primary" />
            تيمقاد <span className="text-accent text-[8px]">Timgad</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center transition-all duration-300">
          <div className="relative w-full max-w-sm group">
            <Search 
              size={12} 
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            <input 
              placeholder="بحث في تيمقاد..." 
              className={`h-6 w-full pr-8 pl-4 bg-secondary/50 border-none rounded-full text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-secondary transition-all ${isSearchFocused ? 'shadow-sm' : ''}`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        <div className={`flex items-center gap-1 transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full relative hover:bg-secondary">
              <Bell size={16} className="text-muted-foreground" />
              {hasUnread && (
                <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-accent rounded-full border border-background animate-pulse"></span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
