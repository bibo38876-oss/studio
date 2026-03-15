import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MOCK_USERS } from '@/lib/mock-data';

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block w-80 space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-primary">اقتراحات المتابعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_USERS.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary leading-tight">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.handle}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full px-4 h-8 text-xs font-semibold hover:bg-accent hover:text-white transition-all">
                متابعة
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-primary">الأكثر تداولاً</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { tag: '#رؤية_2030', posts: '1.2K' },
            { tag: '#تقنية_المستقبل', posts: '850' },
            { tag: '#الذكاء_الاصطناعي', posts: '2.5K' },
            { tag: '#تطوير_الذات', posts: '540' },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{item.tag}</p>
              <p className="text-xs text-muted-foreground">{item.posts} منشور</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="px-4 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <a href="#" className="hover:underline">عن تواصل</a>
        <a href="#" className="hover:underline">سياسة الخصوصية</a>
        <a href="#" className="hover:underline">الشروط والأحكام</a>
        <span>© 2024 تواصل</span>
      </div>
    </aside>
  );
}
