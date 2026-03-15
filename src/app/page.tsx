'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { firestore, auth, user, isUserLoading } = useFirebase();

  // Auto sign-in anonymously for the demo
  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      // Using non-blocking sign-in and removing console.error to prevent UI error overlay
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-8 flex gap-6">
        {/* Left column - Hidden on small screens */}
        <div className="hidden md:block w-64 pt-2 h-fit sticky top-8">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 w-full max-w-full md:max-w-2xl mx-auto">
          <div className="flex flex-col">
            {isPostsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground text-xs">جاري التحميل...</p>
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-20 bg-card border-none">
                <p className="text-muted-foreground text-sm">لا توجد منشورات بعد.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Hidden on small screens */}
        <div className="hidden lg:block w-80 pt-2 h-fit sticky top-8">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
