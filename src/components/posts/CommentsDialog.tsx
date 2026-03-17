
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

  const renderContentWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return <span key={i} className="text-blue-500 font-bold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-right">
      <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full"><ChevronRight size={20} /></Button>
        <span className="text-[11px] font-bold text-primary">تفاصيل المنشور</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 border-b bg-muted/5">
          <div className="flex gap-3 mb-4 justify-end">
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 leading-tight justify-end">
                <VerifiedBadge type={post.authorVerificationType || 'none'} size={12} />
                <span className="text-xs font-bold text-primary">{post.authorName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName?.[0]}</AvatarFallback></Avatar>
          </div>
          
          <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap text-right">
            {renderContentWithHashtags(post.content)}
          </div>
          
          {post.mediaUrls && post.mediaUrls.length > 0 && <img src={post.mediaUrls[0]} alt="Media" className="w-full rounded-xl border mb-4 shadow-sm" />}
          
          <div className="flex justify-between items-center py-3 border-t border-muted/10">
            <div className="flex items-center gap-6">
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} className={cn("flex items-center gap-1.5 transition-colors", likeData ? "text-red-500" : "text-muted-foreground hover:text-red-500")}>
                <Heart size={20} className={likeData ? "fill-current" : ""} />
                <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
              </motion.button>
              
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquareText size={20} />
                <span className="text-[11px] font-bold">{post.commentsCount || 0}</span>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BarChart3 size={20} />
                <span className="text-[11px] font-bold">{post.viewsCount || 0}</span>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.9 }} onClick={handleBookmark} className={cn("flex items-center gap-1.5 transition-colors", bookmarkData ? "text-blue-500" : "text-muted-foreground hover:text-blue-500")}>
              <Bookmark size={20} className={bookmarkData ? "fill-current" : ""} />
              <span className="text-[11px] font-bold">{post.bookmarksCount || 0}</span>
            </motion.button>
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
            <ChevronRight size={16} className="text-primary/30" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-muted/10 pb-2 justify-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">التعليقات</span>
            <MessageSquareText size={14} className="text-primary" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : comments && comments.length > 0 ? (
            comments.map((c: any) => (
              <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 justify-end">
                <div className="flex-1 bg-secondary/20 p-2.5 rounded-2xl rounded-tr-none text-right">
                  <span className="text-[10px] font-bold block mb-1 text-primary">{c.authorName}</span>
                  <p className="text-xs leading-relaxed">{c.content}</p>
                </div>
                <Avatar className="h-8 w-8 border"><AvatarFallback>{c.authorName?.[0]}</AvatarFallback></Avatar>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-40"><p className="text-[10px] font-bold">لا توجد تعليقات بعد.</p></div>
          )}
        </div>
      </div>

      <div className="p-3 border-t bg-background sticky bottom-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input 
            placeholder="اكتب تعليقاً..." 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs text-right h-full p-0" 
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} 
          />
          <Button variant="ghost" size="icon" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8 w-8 rounded-full text-primary">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
