"use client"

import Link from 'next/link';
import { Home, Compass, Bell, User, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import CreatePost from '@/components/posts/CreatePost';
import { useState } from 'react';
import { useUser } from '@/firebase';

export default function BottomNav() {
  const pathname = usePathname();
  const [isPostOpen, setIsPostOpen] = useState(false);
  const { user } = useUser();

  const navItems = [
    { icon: <Home size={14} />, label: 'الرئيسية', path: '/' },
    { icon: <Compass size={14} />, label: 'استكشف', path: '/explore' },
    { icon: null, label: 'نشر', path: 'post' },
    { icon: <Bell size={14} />, label: 'تنبيهات', path: '/notifications' },
    { icon: <User size={14} />, label: 'حسابي', path: user ? `/profile/${user.uid}` : '/profile/me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-8 bg-background/95 backdrop-blur-md border-t px-1 md:hidden">
      <div className="grid h-full grid-cols-5 items-center justify-items-center max-w-lg mx-auto">
        {navItems.map((item, index) => {
          if (item.path === 'post') {
            return (
              <Dialog key={index} open={isPostOpen} onOpenChange={setIsPostOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-lg shadow-md -mt-4 transition-transform hover:scale-105 active:scale-95">
                    <Plus size={16} />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] p-0 border-none bg-background gap-0 overflow-hidden rounded-t-2xl sm:rounded-2xl">
                  <DialogTitle className="sr-only">إنشاء منشور جديد</DialogTitle>
                  <CreatePost onSuccess={() => setIsPostOpen(false)} />
                </DialogContent>
              </Dialog>
            );
          }

          const isActive = pathname === item.path;
          return (
            <Link 
              key={index} 
              href={item.path} 
              className={`flex flex-col items-center justify-center gap-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {item.icon}
              <span className="text-[7px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}