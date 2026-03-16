
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users, Loader2, BadgeCheck, ArrowUpRight, Hash, ArrowRight } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PostCard from '@/components/posts/PostCard';

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  // تحديث البحث عند تغير البارامتر
  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialQuery]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'users'), limit(20));
  }, [firestore, currentUser]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore]);

  // استعلام نتائج البحث للأوسمة
  const hashtagResultsQuery = useMemoFirebase(() => {
    if (!firestore || !searchQuery || !searchQuery.startsWith('#')) return null;
    return query(
      collection(firestore, 'posts'),
      where('hashtags', 'array-contains', searchQuery),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, searchQuery]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: recentPosts, isLoading: isPostsLoading } = useCollection(postsQuery);
  const { data: searchPosts, isLoading: isSearching } = useCollection(hashtagResultsQuery);

  const trendingTags = useMemo(() => {
    if (!recentPosts) return [];
    
    const tagCounts: Record<string, number> = {};
    recentPosts.forEach(post => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ 
        name, 
        count,
        displayCount: (count * 15).toString() + 'K', 
        growth: `+${Math.floor(Math.random() * 50)}%` 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [recentPosts]);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) && 
    u.id !== currentUser?.uid
  ) || [];

  const isHashtagSearch = searchQuery.startsWith('#');

  if (isUserLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-12 pb-20 px-0 md:px-4">
        <div className="sticky top-8 z-30 bg-background/80 backdrop-blur-md p-4 border-b border-muted">
          <div className="relative">
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground"
                onClick={() => setSearchQuery('')}
              >
                <ArrowRight size={14} />
              </Button>
            )}
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن أشخاص أو وسم #..." 
              className="w-full pr-10 pl-10 h-10 rounded-full bg-secondary/50 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {searchQuery && isHashtagSearch ? (
          <div className="mt-2">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Hash size={16} />
                </div>
                <h2 className="text-sm font-bold text-primary">نتائج الوسم: {searchQuery}</h2>
              </div>
            </div>
            {isSearching ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : searchPosts && searchPosts.length > 0 ? (
              searchPosts.map((post: any) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-32 px-10">
                <p className="text-muted-foreground text-xs italic">لا توجد منشورات بهذا الوسم حالياً.</p>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 overflow-x-auto no-scrollbar">
              <TabsTrigger value="trending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
                <TrendingUp size={14} />
                متداول
              </TrendingUp>
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
                <Users size={14} />
                أشخاص
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-0">
              <div className="p-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">خوارزمية التداول</span>
                  <span className="text-[8px] text-muted-foreground">تحليل المنشورات والهاشتاجات النشطة حالياً في تواصل</span>
                </div>
                <Badge variant="outline" className="text-[7px] h-4 px-1.5 bg-white border-primary/20 text-primary rounded-none font-bold">LIVE</Badge>
              </div>
              <div className="divide-y divide-muted">
                {isPostsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : trendingTags.length > 0 ? trendingTags.map((tag, i) => (
                  <div 
                    key={i} 
                    className="p-4 hover:bg-muted/10 cursor-pointer flex justify-between items-center group transition-colors"
                    onClick={() => setSearchQuery(tag.name)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">رائج الآن</span>
                        <span className="text-[8px] text-green-600 font-bold">{tag.growth}</span>
                      </div>
                      <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{tag.name}</span>
                      <span className="text-[9px] text-muted-foreground">{tag.displayCount} تفاعل</span>
                    </div>
                    <ArrowUpRight size={18} className="text-muted-foreground/30 group-hover:text-accent/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                )) : (
                  <div className="text-center py-20">
                    <p className="text-xs text-muted-foreground italic">لا توجد وسوم متداولة حالياً.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              {isUsersLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="divide-y divide-muted">
                  {filteredUsers.map((user) => {
                    const isVerified = user.email === 'adelbenmaza8@gmail.com' || user.role === 'admin' || user.verificationType === 'blue' || user.verificationType === 'gold';
                    return (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-muted/20">
                            <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                            <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 leading-tight">
                              <span className="text-sm font-bold text-primary leading-tight">{user.username}</span>
                              {isVerified && <BadgeCheck size={14} className="text-accent fill-current" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{user.email}</span>
                          </div>
                        </Link>
                        <Button variant="outline" size="sm" className="rounded-full px-4 h-8 text-[11px] font-bold">
                          متابعة
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Users size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground text-xs">لم يتم العثور على نتائج.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
