import Link from 'next/link';
import { Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CURRENT_USER } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full h-10 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-bold text-primary font-headline tracking-tighter">
            تواصل <span className="text-accent text-sm">Tawasul</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <Search size={16} className="text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <Settings size={16} className="text-muted-foreground" />
          </Button>
          <Link href={`/profile/${CURRENT_USER.id}`}>
            <Avatar className="h-6 w-6 border border-accent/20">
              <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
              <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </nav>
  );
}
