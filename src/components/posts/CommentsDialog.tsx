
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, Heart, Bookmark, BarChart3, Rocket, Trash2, Coffee, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function CommentsDialog({ postId, postAuthorId, post, onClose, currentUserProfile }: { postId: string, postAuthorId: string, post: any, onClose: () => void, currentUserProfile?: any }) {
  const [commentText, setCommentText] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;
  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  const postAuthorProfileRef = useMemoFirebase(() => {
    if (!firestore || !postAuthorId) return null;
    return doc(firestore, 'users', postAuthorId);
  }, [firestore, postAuthorId]);
  const { data: postAuthorProfile } = useDoc(postAuthorProfileRef);

  const currentPostVerification: VerificationType = postAuthorProfile?.verificationType || post.authorVerificationType || 'none';
  const isVerifiedAuthor = currentPostVerification === 'blue' || currentVerificationType === 'gold';

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, postId]);

  const { data: rawComments, isLoading } = useCollection(commentsQuery);

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
      authorName: currentUserProfile?.username || user.displayName || 'مستخدم تيمقاد',
      authorAvatar: currentUserProfile?.profilePictureUrl || user.photoURL || '',
      authorVerificationType: currentUserProfile?.verificationType || 'none',
      content,
      likesCount: 0,
      reportsCount: 0,
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

  const handleSupport = async (amount: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if ((currentUserProfile?.coins || 0) < amount) {
      toast({ variant: "destructive", description: "رصيدك لا يكفي لهذا الدعم." });
      return;
    }
    updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), { coins: increment(-amount) });
    updateDocumentNonBlocking(doc(firestore!, 'users', post.authorId), { coins: increment(amount) });
    addDocumentNonBlocking(collection(firestore!, 'users', post.authorId, 'notifications'), {
      type: 'support',
      fromUserId: user!.uid,
      fromUsername: currentUserProfile?.username || 'مبادر من تيمقاد',
      fromAvatar: currentUserProfile?.profilePictureUrl || '',
      amount,
      postId: post.id,
      createdAt: serverTimestamp(),
      read: false
    });
    toast({ title: "تم إرسال الدعم!", description: `لقد أرسلت ${amount} عملة ذهبية تقديراً لهذا المحتوى.` });
    setIsSupportOpen(false);
  };

  const renderContentWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return <span key={i} className="text-accent font-bold">{part}</span>;
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
                <VerifiedBadge type={currentPostVerification} size={14} />
                <span className="text-xs font-bold text-primary">{postAuthorProfile?.username || post.authorName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10">
              <AvatarImage src={postAuthorProfile?.profilePictureUrl || post.authorAvatar} />
              <AvatarFallback>{(postAuthorProfile?.username || post.authorName)?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap text-right font-medium">
            {renderContentWithHashtags(post.content)}
          </div>
          
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mb-4">
              {post.mediaUrls.length === 1 ? (
                <img src={post.mediaUrls[0]} alt="Media" className="w-full rounded-xl border shadow-sm" />
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {post.mediaUrls.map((url, index) => (
                      <CarouselItem key={index}>
                        <img src={url} alt={`Media ${index + 1}`} className="w-full rounded-xl border shadow-sm h-auto object-cover max-h-[500px]" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="right-2 bg-black/20 text-white h-8 w-8 border-none" />
                  <CarouselNext className="left-2 bg-black/20 text-white h-8 w-8 border-none" />
                </Carousel>
              )}
            </div>
          )}
          
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
              {isVerifiedAuthor && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsSupportOpen(true)} className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700">
                  <Coffee size={20} />
                  <span className="text-[10px] font-bold">دعم</span>
                </motion.button>
              )}
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

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : rawComments && rawComments.length > 0 ? (
            rawComments.map((c: any) => (
              <CommentItem key={c.id} comment={c} postId={postId} firestore={firestore} user={user} ADMIN_EMAIL={ADMIN_EMAIL} />
            ))
          ) : (
            <div className="text-center py-10 opacity-40"><p className="text-[10px] font-bold">لا توجد تعليقات بعد.</p></div>
          )}
        </div>
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-[300px] text-center p-6">
          <DialogTitle className="text-md font-bold text-primary">دعم المبدع</DialogTitle>
          <div className="grid grid-cols-3 gap-3 py-6">
            {[1, 5, 10].map((amt) => (
              <Button key={amt} variant="outline" className="h-12 flex flex-col gap-1 rounded-xl" onClick={() => handleSupport(amt)}>
                <span className="text-sm font-bold">{amt}</span>
                <TimgadCoin size={14} />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-3 border-t bg-background sticky bottom-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input placeholder="اكتب تعليقاً..." className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs text-right h-full p-0" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
          <Button variant="ghost" size="icon" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8 w-8 rounded-full text-primary"><Send size={16} /></Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, firestore, user, ADMIN_EMAIL }: any) {
  const authorRef = useMemoFirebase(() => {
    if (!firestore || !comment.authorId) return null;
    return doc(firestore, 'users', comment.authorId);
  }, [firestore, comment.authorId]);
  
  const { data: authorProfile } = useDoc(authorRef);
  const verificationType = authorProfile?.verificationType || comment.authorVerificationType || 'none';
  const canDelete = user && (user.uid === comment.authorId || user.email === ADMIN_EMAIL);

  const handleDelete = () => {
    deleteDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', comment.id));
    updateDocumentNonBlocking(doc(firestore, 'posts', postId), { commentsCount: increment(-1) });
  };

  return (
    <div className="flex gap-3 justify-end group">
      <div className="flex-1 flex flex-col items-end">
        <div className="bg-secondary/20 p-2.5 rounded-2xl rounded-tr-none text-right relative w-full">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              {canDelete && (
                <button onClick={handleDelete} className="text-destructive/40 hover:text-destructive transition-colors"><Trash2 size={12} /></button>
              )}
              <button onClick={() => updateDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', comment.id), { reportsCount: increment(1) })} className="text-muted-foreground/40 hover:text-red-50 transition-colors"><Flag size={12} /></button>
            </div>
            <div className="flex items-center gap-1.5">
              <VerifiedBadge type={verificationType} size={10} />
              <span className="text-[10px] font-bold text-primary">{authorProfile?.username || comment.authorName}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed mb-2">{comment.content}</p>
          <div className="flex items-center gap-3 pt-1 border-t border-muted/10">
            <button onClick={() => updateDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', comment.id), { likesCount: increment(1) })} className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-red-500">
              <Heart size={10} />
              <span>{comment.likesCount || 0}</span>
            </button>
          </div>
        </div>
        <span className="text-[7px] text-muted-foreground mt-1 px-1">{comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
      </div>
      <Avatar className="h-8 w-8 border shrink-0">
        <AvatarImage src={authorProfile?.profilePictureUrl || comment.authorAvatar} />
        <AvatarFallback>{(authorProfile?.username || comment.authorName)?.[0]}</AvatarFallback>
      </Avatar>
    </div>
  );
}
