
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users, Loader2, ArrowUpRight, MessageSquare, ArrowRight, UserPlus, UserCheck } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, where, doc, arrayUnion, arrayRemove, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PostCard from '@/components/posts/PostCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { useToast } from '@/hooks/use-toast';

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialQuery]);

  // جلب المستخدمين للبحث - يتطلب تسجيل الدخول
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return query(collection(firestore, 'users'), limit(100));
  }, [firestore, currentUser?.uid]);

  // جلب المنشورات العامة للترند والبحث النصي - يتطلب تسجيل الدخول
  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, currentUser?.uid]);

  // جلب نتائج الوسوم
  const hashtagResultsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid || !searchQuery || !searchQuery.startsWith('#')) return null;
    return query(
      collection(firestore, 'posts'),
      where('hashtags', 'array-contains', searchQuery),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, currentUser?.uid, searchQuery]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: recentPosts, isLoading: isPostsLoading } = useCollection(postsQuery);
  const { data: searchPosts, isLoading: isSearching } = useCollection(hashtagResultsQuery);

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);
  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  // حساب الوسوم الأكثر تداولاً
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
        displayCount: count === 1 ? 'منشور واحد' : `${count} منشورات`,
        growth: 'نشط حالياً' 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [recentPosts]);

  // تصفية المستخدمين بناءً على البحث
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    const queryStr = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery;
    if (!queryStr) return allUsers.filter(u => u.id !== currentUser?.uid).slice(0, 20);
    
    return allUsers.filter(u => 
      (u.username?.toLowerCase().includes(queryStr.toLowerCase()) || 
       u.email?.toLowerCase().includes(queryStr.toLowerCase())) &&
      u.id !== currentUser?.uid
    );
  }, [allUsers, searchQuery, currentUser?.uid]);

  // تصفية المنشورات نصياً (إذا لم يكن وسماً)
  const textFilteredPosts = useMemo(() => {
    if (!recentPosts || !searchQuery || searchQuery.startsWith('#')) return [];
    return recentPosts.filter(p => 
      p.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentPosts, searchQuery]);

  const handleFollow = (targetUserId: string, isFollowing: boolean) => {
    if (!firestore || !currentUser) return;
    const curUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetUserId, 'notifications'), {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: currentUserProfile?.username || currentUser.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

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
        {/* شريط البحث العلوي */}
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
              className="w-full pr-10 pl-10 h-10 rounded-full bg-secondary/50 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary/30 text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* عرض النتائج أو القوائم الافتراضية */}
        {searchQuery ? (
          <div className="mt-2">
            <Tabs defaultValue={isHashtagSearch ? "posts" : "users"} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0">
                <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold">أشخاص ({filteredUsers.length})</TabsTrigger>
                <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold">منشورات ({isHashtagSearch ? (searchPosts?.length || 0) : textFilteredPosts.length})</TabsTrigger>
              </TabsList>

              {/* تبويب نتائج المستخدمين */}
              <TabsContent value="users" className="mt-0">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-muted">
                    {filteredUsers.map((u) => {
                      const isFollowing = currentUserProfile?.followingIds?.includes(u.id);
                      const verificationType = u.verificationType || 'none';
                      return (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                          <Link href={`/profile/${u.id}`} className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-muted/20">
                              <AvatarImage src={u.profilePictureUrl} alt={u.username} />
                              <AvatarFallback>{u.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <VerifiedBadge type={verificationType} size={14} />
                                <span className="text-sm font-bold text-primary">{u.username}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{u.email}</span>
                            </div>
                          </Link>
                          <Button 
                            size="sm" 
                            variant={isFollowing ? "outline" : "default"} 
                            className="h-8 rounded-full px-5 text-[10px] font-bold"
                            onClick={() => handleFollow(u.id, !!isFollowing)}
                          >
                            {isFollowing ? 'متابع' : 'متابعة'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Users size={30} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-muted-foreground text-[10px]">لا توجد نتائج للأشخاص.</p>
                  </div>
                )}
              </TabsContent>

              {/* تبويب نتائج المنشورات */}
              <TabsContent value="posts" className="mt-0">
                {isHashtagSearch ? (
                  isSearching ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                  ) : searchPosts && searchPosts.length > 0 ? (
                    searchPosts.map((post: any) => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className="text-center py-20"><p className="text-muted-foreground text-[10px]">لا توجد منشورات بهذا الوسم.</p></div>
                  )
                ) : (
                  textFilteredPosts.length > 0 ? (
                    textFilteredPosts.map((post: any) => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className="text-center py-20">
                      <MessageSquare size={30} className="mx-auto text-muted-foreground/20 mb-2" />
                      <p className="text-muted-foreground text-[10px]">لا توجد منشورات مطابقة للبحث.</p>
                    </div>
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* القوائم الافتراضية عند عدم وجود بحث */
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 overflow-x-auto no-scrollbar">
              <TabsTrigger value="trending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
                <TrendingUp size={14} />
                متداول
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold gap-2">
                <Users size={14} />
                أشخاص مقترحين
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-0">
              <div className="p-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">خوارزمية التداول</span>
                  <span className="text-[8px] text-muted-foreground">تحليل المنشورات والهاشتاجات النشطة حالياً في تيمقاد</span>
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
                    <div className="flex flex-col text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[8px] text-green-600 font-bold">{tag.growth}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">رائج الآن</span>
                      </div>
                      <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{tag.name}</span>
                      <span className="text-[9px] text-muted-foreground">{tag.displayCount}</span>
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
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : filteredUsers.length > 0 ? (
                <div className="divide-y divide-muted">
                  {filteredUsers.map((u) => {
                    const isFollowing = currentUserProfile?.followingIds?.includes(u.id);
                    const verificationType = u.verificationType || 'none';
                    return (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <Link href={`/profile/${u.id}`} className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-muted/20">
                            <AvatarImage src={u.profilePictureUrl} alt={u.username} />
                            <AvatarFallback>{u.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-right">
                            <div className="flex items-center gap-1.5 leading-tight justify-end">
                              <VerifiedBadge type={verificationType} size={14} />
                              <span className="text-sm font-bold text-primary">{u.username}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        </Link>
                        <Button 
                          size="sm" 
                          variant={isFollowing ? "outline" : "default"} 
                          className="h-8 rounded-full px-5 text-[10px] font-bold"
                          onClick={() => handleFollow(u.id, !!isFollowing)}
                        >
                          {isFollowing ? 'متابع' : 'متابعة'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Users size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground text-xs">لا يوجد مستخدمين لعرضهم.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
