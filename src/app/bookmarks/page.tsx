
"use client"

import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/posts/PostCard';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  const { firestore, user } = useFirebase();

  const bookmarksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'bookmarks'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: bookmarks, isLoading } = useCollection(bookmarksQuery);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b">
          <h1 className="text-sm font-bold text-primary">العلامات المرجعية</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="space-y-[1px]">
            {bookmarks.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center">
            <Bookmark size={40} className="text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-xs">لم تقم بحفظ أي منشورات بعد.</p>
          </div>
        )}
      </main>
    </div>
  );
}
