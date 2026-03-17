
'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function WoodenChestIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="10" width="18" height="10" rx="1" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
      <path d="M3 10V7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V10H3Z" fill="#92400E" stroke="#451A03" strokeWidth="1.2" />
      <rect x="9" y="9" width="6" height="4" rx="1" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const unreadQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), where('read', '==', false));
  }, [firestore, user]);

  const { data: unreadNotifications } = useCollection(unreadQuery);
  const hasUnread = unreadNotifications && unreadNotifications.length > 0;

  return (
    <nav className="fixed top-0 z-50 w-full h-10 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto h-full flex items-center justify-between px-4 max-w-5xl">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-primary font-headline tracking-tighter">
          <TimgadLogo size={18} /> تيمقاد <span className="text-accent text-[10px]">Timgad</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* أيقونة الجرة معطلة برمجياً وتظهر رسالة قريباً */}
          <motion.div 
            whileTap={{ scale: 0.9 }} 
            onClick={() => toast({ title: "قريباً جداً! 🏺", description: "ميزة جرة تيمقاد الملكية في مراحل التطوير الأخيرة." })} 
            className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-secondary rounded-full relative"
          >
            <WoodenChestIcon size={18} />
          </motion.div>
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
