import Link from 'next/link';
import { User, Bookmark, Settings, MessageSquare, Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CURRENT_USER } from '@/lib/mock-data';

export default function LeftSidebar() {
  return (
    <aside className="hidden md:block w-64 space-y-4">
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="h-16 bg-primary w-full" />
        <CardContent className="relative pt-0 px-4 pb-6">
          <Avatar className="h-16 w-16 absolute -top-8 right-4 border-4 border-card">
            <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
            <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-10 space-y-1">
            <h3 className="font-bold text-lg text-primary">{CURRENT_USER.name}</h3>
            <p className="text-sm text-muted-foreground">{CURRENT_USER.handle}</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground line-clamp-2">
            {CURRENT_USER.bio}
          </p>
          <div className="mt-6 flex gap-4 border-t pt-4">
            <div className="flex flex-col text-center flex-1">
              <span className="font-bold text-primary text-sm">{CURRENT_USER.followers}</span>
              <span className="text-[10px] text-muted-foreground">متابع</span>
            </div>
            <div className="flex flex-col text-center flex-1 border-r">
              <span className="font-bold text-primary text-sm">{CURRENT_USER.following}</span>
              <span className="text-[10px] text-muted-foreground">يتابع</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-2xl p-2 shadow-sm space-y-1">
        {[
          { icon: <Compass size={20} />, label: 'استكشف', active: false },
          { icon: <MessageSquare size={20} />, label: 'الرسائل', active: false },
          { icon: <Bookmark size={20} />, label: 'العلامات المرجعية', active: false },
          { icon: <Settings size={20} />, label: 'الإعدادات', active: false },
        ].map((item, i) => (
          <Link key={i} href="#" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.active ? 'bg-secondary text-primary font-bold' : 'text-muted-foreground hover:bg-secondary hover:text-primary'}`}>
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
