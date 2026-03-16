
"use client"

import Link from 'next/link';
import { Home, Compass, MessageSquare, User, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import CreatePost from '@/components/posts/CreatePost';
import { useState } from 'react';
import { useUser } from '@/firebase';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPostOpen, setIsPostOpen] = useState(false);
  const { user } = useUser();

  const isAnonymous = !user || user.isAnonymous;

  const isChatPage = pathname?.startsWith('/groups/') && pathname?.split('/').length > 2;
  const isSettingsPage = pathname === '/settings';
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname === '/admin';

  if (isChatPage || isSettingsPage || isLoginPage || isAdminPage) {
    return null;
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    if (isAnonymous) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const navItems = [
    { icon: <Home size={22} />, label: 'الرئيسية', path: '/' },
    { icon: <Compass size={22} />, label: 'استكشف', path: '/explore' },
    { icon: null, label: 'نشر', path: 'post' },
    { icon: <MessageSquare size={22} />, label: 'المجموعات', path: '/groups' },
    { 
      icon: <User size={22} />, 
      label: 'حسابي', 
      path: user && !user.isAnonymous ? `/profile/${user.uid}` : '/login',
      onClick: handleProfileClick
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/95 backdrop-blur-md border-t px-2 md:hidden">
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
                  <button className="relative w-12 h-9 transition-transform hover:scale-110 active:scale-95 mx-2 group">
                    <div className="absolute inset-0 bg-accent rounded-md -translate-x-1 opacity-70"></div>
                    <div className="absolute inset-0 bg-primary rounded-md translate-x-1 opacity-70"></div>
                    <div className="absolute inset-0 bg-foreground dark:bg-foreground rounded-md flex items-center justify-center">
                      <Plus size={24} className="text-background dark:text-background" strokeWidth={3} />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-auto p-0 border-none bg-background gap-0 overflow-hidden flex flex-col">
                  <DialogTitle className="sr-only">إنشاء منشور جديد</DialogTitle>
                  <CreatePost onSuccess={() => setIsPostOpen(false)} />
                </DialogContent>
              </Dialog>
            );
          }

          const isActive = pathname === item.path || (item.path === '/groups' && pathname === '/groups');
          return (
            <Link 
              key={index} 
              href={item.path} 
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-1 transition-colors w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {item.icon}
              <span className={`text-[9px] font-bold tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
