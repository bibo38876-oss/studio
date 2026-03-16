
'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';

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
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-primary font-headline tracking-tighter whitespace-nowrap">
            <TimgadLogo size={14} className="text-primary" />
            تيمقاد <span className="text-accent text-[8px]">Timgad</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center transition-all duration-300">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm group">
            <button type="submit" className="absolute end-2.5 top-1/2 -translate-y-1/2 transition-colors">
              <Search 
                size={12} 
                className={`${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} 
              />
            </button>
            <input 
              placeholder="بحث عن أشخاص أو وسم..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-6 w-full pe-8 ps-4 bg-secondary/50 border-none rounded-full text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-secondary transition-all ${isSearchFocused ? 'shadow-sm' : ''}`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
          </form>
        </div>

        <div className={`flex items-center gap-1 transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full relative hover:bg-secondary">
              <Bell size={16} className="text-muted-foreground" />
              {hasUnread && (
                <span className="absolute top-2 start-2 w-1.5 h-1.5 bg-accent rounded-full border border-background animate-pulse"></span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
