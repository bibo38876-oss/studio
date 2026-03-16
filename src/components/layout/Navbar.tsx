
'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full h-12 border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-5xl gap-4">
        <div className={`flex items-center transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/" className="text-sm font-bold text-primary font-headline tracking-tighter whitespace-nowrap">
            تواصل <span className="text-accent text-[10px]">Tawasul</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center transition-all duration-300">
          <div className="relative w-full max-w-md group">
            <Search 
              size={14} 
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            <input 
              placeholder="ابحث في تواصل..." 
              className={`h-9 w-full pr-10 pl-4 bg-secondary/50 border-none rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-secondary transition-all ${isSearchFocused ? 'shadow-sm' : ''}`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative hover:bg-secondary">
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
