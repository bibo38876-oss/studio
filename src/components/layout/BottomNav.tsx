"use client"

import Link from 'next/link';
import { Home, Compass, MessageSquare, User, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import CreatePost from '@/components/posts/CreatePost';
import { useState } from 'react';
import { useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPostOpen, setIsPostOpen] = useState(false);
  const { user } = useUser();

  const isAnonymous = !user || user.isAnonymous;

  if (pathname !== '/') {
    return null;
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    if (isAnonymous) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const navItems = [
    { icon: <Home size={18} />, label: 'الرئيسية', path: '/' },
    { icon: <Compass size={18} />, label: 'استكشف', path: '/explore' },
    { icon: null, label: 'نشر', path: 'post' },
    { icon: <MessageSquare size={18} />, label: 'المجموعات', path: '/groups' },
    { 
      icon: <User size={18} />, 
      label: 'حسابي', 
      path: user && !user.isAnonymous ? `/profile/${user.uid}` : '/login',
      onClick: handleProfileClick
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-12 bg-background/95 backdrop-blur-md border-t px-1 md:hidden">
      <div className="grid h-full grid-cols-5 items-center justify-items-center max-w-lg mx-auto">
        {navItems.map((item, index) => {
          if (item.path === 'post') {
            return (
              <Dialog key={index} open={isPostOpen} onOpenChange={(open) => {
                if (isAnonymous && open) {
                  router.push('/login');
                  return;
                }
                setIsPostOpen(open);
              }}>
                <DialogTrigger asChild>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className="relative w-8 h-7 transition-transform mx-1 group"
                  >
                    <div className="absolute inset-0 bg-accent rounded-sm -translate-x-0.5 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute inset-0 bg-primary rounded-sm translate-x-0.5 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute inset-0 bg-foreground dark:bg-foreground rounded-sm flex items-center justify-center">
                      <Plus size={16} className="text-background dark:text-background" strokeWidth={3} />
                    </div>
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-auto p-0 border-none bg-background gap-0 overflow-hidden flex flex-col">
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
              onClick={item.onClick}
              className={`w-full h-full`}
            >
              <motion.div 
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}
              >
                <div className={isActive ? 'animate-icon-pop' : ''}>
                  {item.icon}
                </div>
                <span className={`text-[7.5px] font-bold tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
