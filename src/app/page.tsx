
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { Loader2, LayoutGrid, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // جلب بيانات المستخدم للتأكد من قائمة المتابعة
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userProfileRef);

  // استعلام المنشورات العامة
  const allPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore, user?.uid]);

  // استعلام المتابعة - قد يتطلب فهرساً مشابهاً (authorId IN, createdAt DESC)
  const followingPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(
      collection(firestore, 'posts'), 
      where('authorId', 'in', profile.followingIds.slice(0, 10)),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, profile?.followingIds]);

  const { data: allPosts, isLoading: isAllLoading } = useCollection(allPostsQuery);
  const { data: followingPosts, isLoading: isFollowingLoading } = useCollection(followingPostsQuery);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-10 flex gap-6">
        <div className="hidden md:block w-64 pt-2 h-fit sticky top-10">
          <LeftSidebar />
        </div>

        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background border-b border-muted rounded-none h-10 p-0 sticky top-8 z-40">
              <TabsTrigger 
                value="all" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs"
              >
                <LayoutGrid size={14} className="ml-1.5" />
                عام
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs"
              >
                <Users size={14} className="ml-1.5" />
                أتابعهم
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {isAllLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : allPosts && allPosts.length > 0 ? (
                allPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-20 bg-card border-b">
                  <p className="text-muted-foreground text-xs font-medium">لا توجد منشورات بعد.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-0">
              {!profile?.followingIds || profile.followingIds.length === 0 ? (
                <div className="text-center py-24 bg-card px-8 border-b">
                  <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-primary font-bold text-sm mb-1">ابدأ بمتابعة الآخرين</p>
                  <p className="text-muted-foreground text-[10px]">ستظهر منشورات من تتابعهم هنا.</p>
                </div>
              ) : isFollowingLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : followingPosts && followingPosts.length > 0 ? (
                followingPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-20 bg-card border-b">
                  <p className="text-muted-foreground text-[10px]">لا توجد منشورات جديدة ممن تتابعهم.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:block w-80 pt-2 h-fit sticky top-10">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
