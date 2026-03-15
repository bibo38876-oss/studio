"use client"

import Link from 'next/link';
import { Home, Compass, Bell, User, Plus } from 'lucide-react';
import { CURRENT_USER } from '@/lib/mock-data';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import CreatePost from '@/components/posts/CreatePost';
import { useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [isPostOpen, setIsPostOpen] = useState(false);

  const navItems = [
    { icon: <Home size={22} />, label: 'الرئيسية', path: '/' },
    { icon: <Compass size={22} />, label: 'استكشف', path: '/explore' },
    { icon: null, label: 'نشر', path: 'post' }, // Placeholder for the Plus button
    { icon: <Bell size={22} />, label: 'التنبيهات', path: '/notifications' },
    { icon: <User size={22} />, label: 'الملف الشخصي', path: `/profile/${CURRENT_USER.id}` },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-14 bg-background/95 backdrop-blur-md border-t px-2 md:hidden">
      <div className="grid h-full grid-cols-5 items-center justify-items-center max-w-lg mx-auto">
        {navItems.map((item, index) => {
          if (item.path === 'post') {
            return (
              <Dialog key={index} open={isPostOpen} onOpenChange={setIsPostOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center w-11 h-11 bg-primary text-white rounded-2xl shadow-lg -mt-6 transition-transform hover:scale-105 active:scale-95">
                    <Plus size={24} />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] p-0 border-none bg-background gap-0 overflow-hidden rounded-t-3xl sm:rounded-3xl">
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
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
