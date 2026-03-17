
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, Heart, Bookmark, BarChart3, Rocket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';

export default function CommentsDialog({ postId, postAuthorId, post, onClose }: { postId: string, postAuthorId: string, post: any, onClose: () => void }) {
  const [commentText, setCommentText] = useState('');
  const { firestore, user } = useFirebase();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, postId]);

  const { data: comments, isLoading } = useCollection(commentsQuery);

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !postId) return null;
    return doc(firestore, 'posts', postId, 'likes', user.uid);
  }, [firestore, postId, user?.uid]);
  const { data: likeData } = useDoc(likeRef);

  const bookmarkRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !postId) return null;
    return doc(firestore, 'users', user.uid, 'bookmarks', postId);
  }, [firestore, postId, user?.uid]);
  const { data: bookmarkData } = useDoc(bookmarkRef);

  const handleAddComment = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!commentText.trim() || !user || !firestore) return;
    const content = commentText.trim();
    setCommentText('');
    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), {
      authorId: user.uid,
      authorName: user.displayName || 'مستخدم تيمقاد',
      authorAvatar: user.photoURL || '',
      content,
      createdAt: serverTimestamp(),
    });
    updateDocumentNonBlocking(doc(firestore, 'posts', postId), { commentsCount: increment(1) });
  };

  const handleLike = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !postId) return;
    if (likeData) {
      deleteDocumentNonBlocking(likeRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), { likesCount: increment(-1) });
    } else {
      setDocumentNonBlocking(likeRef!, { createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), { likesCount: increment(1) });
    }
  };

  const handleBookmark = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !postId) return;
    if (bookmarkData) {
      deleteDocumentNonBlocking(bookmarkRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), { bookmarksCount: increment(-1) });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...post, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), { bookmarksCount: increment(1) });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-right">
      <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full"><ChevronRight size={20} /></Button>
        <span className="text-[11px] font-bold text-primary">تفاصيل المنشور</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 border-b bg-muted/5">
          <div className="flex gap-3 mb-4">
            <Avatar className="h-10 w-10"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName?.[0]}</AvatarFallback></Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1"><VerifiedBadge type={post.authorVerificationType || 'none'} size={12} /><span className="text-xs font-bold text-primary">{post.authorName}</span></div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-4">{post.content}</p>
          {post.mediaUrls && post.mediaUrls.length > 0 && <img src={post.mediaUrls[0]} alt="Media" className="w-full rounded-xl border mb-4" />}
          
          <div className="flex justify-between items-center py-2 border-t">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className={cn("gap-1.5", likeData && "text-red-500")} onClick={handleLike}><Heart size={18} className={likeData ? "fill-current" : ""} /> <span className="text-xs font-bold">{post.likesCount || 0}</span></Button>
              <Button variant="ghost" size="sm" className={cn("gap-1.5", bookmarkData && "text-accent")} onClick={handleBookmark}><Bookmark size={18} className={bookmarkData ? "fill-current" : ""} /> <span className="text-xs font-bold">{post.bookmarksCount || 0}</span></Button>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground"><BarChart3 size={18} /><span className="text-xs font-bold">{post.viewsCount || 0}</span></div>
          </div>
        </div>

        {/* Ad Slot */}
        <div className="p-4">
          <div className="bg-primary/5 border border-dashed border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TimgadLogo size={24} className="text-primary" />
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5"><Rocket size={10} className="text-accent" /><span className="text-[9px] font-bold text-primary">مروج • Ad</span></div>
                <p className="text-[11px] font-bold">وثق حسابك الآن واحصل على ميزات النخبة في تيمقاد!</p>
              </div>
            </div>
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2"><MessageSquareText size={14} /><span className="text-[10px] font-bold">التعليقات</span></div>
          {isLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback>{c.authorName?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 bg-secondary/20 p-2 rounded-lg"><span className="text-[10px] font-bold block mb-1">{c.authorName}</span><p className="text-xs">{c.content}</p></div>
            </div>
          )) || <p className="text-center text-[10px] text-muted-foreground py-10">لا توجد تعليقات بعد.</p>}
        </div>
      </div>

      <div className="p-3 border-t bg-background sticky bottom-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input placeholder="اكتب تعليقاً..." className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
          <Button variant="ghost" size="icon" onClick={handleAddComment} disabled={!commentText.trim()}><Send size={16} className="text-primary" /></Button>
        </div>
      </div>
    </div>
  );
}
