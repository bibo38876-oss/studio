
"use client"

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users, Hash, Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { firestore, user: currentUser } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(20));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) && 
    u.id !== currentUser?.uid
  ) || [];

  const trendingTags = [
    { name: 'رؤية_2030', count: '125K' },
    { name: 'الذكاء_الاصطناعي', count: '89K' },
    { name: 'تطوير_الذات', count: '45K' },
    { name: 'السعودية', count: '210K' },
    { name: 'تقنية', count: '67K' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-12 pb-20 px-0 md:px-4">
        <div className="sticky top-8 z-30 bg-background/80 backdrop-blur-md p-4 border-b border-muted">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن أشخاص أو مواضيع..." 
              className="w-full pr-10 pl-4 h-10 rounded-full bg-secondary/50 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="trending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
              <TrendingUp size={14} />
              متداول
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
              <Users size={14} />
              أشخاص
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0">
            <div className="divide-y divide-muted">
              {trendingTags.map((tag, i) => (
                <div key={i} className="p-4 hover:bg-muted/10 cursor-pointer flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">رائج في المملكة العربية السعودية</span>
                    <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors">#{tag.name}</span>
                    <span className="text-[10px] text-muted-foreground">{tag.count} منشور</span>
                  </div>
                  <Hash size={18} className="text-muted-foreground/30 group-hover:text-accent/50" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-muted">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-muted/20">
                        <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                        <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary leading-tight">{user.username}</span>
                        <span className="text-[10px] text-muted-foreground">@{user.id.slice(0, 8)}</span>
                        <p className="text-[10px] text-foreground line-clamp-1 mt-0.5">{user.bio}</p>
                      </div>
                    </Link>
                    <Button variant="outline" size="sm" className="rounded-full px-4 h-8 text-[11px] font-bold">
                      متابعة
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Users size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-xs">لم يتم العثور على نتائج.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
