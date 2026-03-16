
'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full h-7 border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-5xl">
        <div className={`flex items-center transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/" className="text-xs font-bold text-primary font-headline tracking-tighter whitespace-nowrap">
            تواصل <span className="text-accent text-[8px]">Tawasul</span>
          </Link>
        </div>

        <div className={`flex-1 flex justify-center px-4 transition-all duration-300 ${isSearchFocused ? 'max-w-full' : 'max-w-[150px]'}`}>
          <div className="relative w-full group">
            <Search 
              size={10} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            <Input 
              placeholder="بحث..." 
              className="h-5 w-full pr-7 pl-2 bg-secondary/50 border-none rounded-full text-[9px] focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-secondary transition-all"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        <div className={`flex items-center gap-1 transition-all duration-300 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full relative">
              <Bell size={12} className="text-muted-foreground" />
              <span className="absolute top-1 left-1 w-1 h-1 bg-accent rounded-full border border-background"></span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
