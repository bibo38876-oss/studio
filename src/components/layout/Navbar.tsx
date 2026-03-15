import Link from 'next/link';
import { Home, User, Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CURRENT_USER } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-primary font-headline tracking-tighter">
            تواصل <span className="text-accent">Tawasul</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
              <Home size={20} />
              <span className="font-medium">الرئيسية</span>
            </Link>
            <Link href={`/profile/${CURRENT_USER.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
              <User size={20} />
              <span className="font-medium">الملف الشخصي</span>
            </Link>
            <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
              <Bell size={20} />
              <span className="font-medium">التنبيهات</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="بحث في تواصل..." 
              className="h-10 pr-10 pl-4 rounded-full bg-secondary border-none focus:ring-2 focus:ring-accent outline-none w-64 text-sm transition-all"
            />
          </div>
          <Link href={`/profile/${CURRENT_USER.id}`}>
            <Avatar className="h-9 w-9 border-2 border-transparent hover:border-accent transition-all">
              <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
              <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search size={20} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
