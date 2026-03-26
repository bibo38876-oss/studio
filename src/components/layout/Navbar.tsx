
'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';

export default function Navbar() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const [searchValue, setSearchValue] = useState('');

  const unreadQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), where('read', '==', false));
  }, [firestore, user]);

  const { data: unreadNotifications } = useCollection(unreadQuery);
  const hasUnread = unreadNotifications && unreadNotifications.length > 0;

  return (
    <nav className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[500px] h-10 border-b bg-background/80 backdrop-blur-md px-safe">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-xl">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-primary font-headline tracking-tighter shrink-0">
          <TimgadLogo size={18} /> تيمقاد <span className="text-accent text-[10px]">Mobile</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/explore">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Search size={18} />
            </Button>
          </Link>
          
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell size={18} />
              {hasUnread && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full border border-background"></span>}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
