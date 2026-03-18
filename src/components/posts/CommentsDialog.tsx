
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
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import TimgadCoin from '@/components/ui/TimgadCoin';

export default function CommentsDialog({ postId, postAuthorId, post, onClose, currentUserProfile }: { postId: string, postAuthorId: string, post: any, onClose: () => void, currentUserProfile?: any }) {
  const [commentText, setCommentText] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;
  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isVerifiedAuthor = post.authorVerificationType === 'blue' || post.authorVerificationType === 'gold';

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

  const handleDeleteComment = (commentId: string) => {
    if (!firestore || !postId || !commentId) return;
    deleteDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', commentId));
    updateDocumentNonBlocking(doc(firestore, 'posts', postId), { commentsCount: increment(-1) });
    toast({ description: "تم حذف التعليق بنجاح." });
  };

  const handleLikeComment = (commentId: string) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !postId) return;
    updateDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', commentId), {
      likesCount: increment(1)
    });
    toast({ description: "أعجبك هذا التعليق." });
  };

  const handleReportComment = (commentId: string) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !postId) return;
    updateDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', commentId), {
      reportsCount: increment(1)
    });
    toast({ title: "شكراً لبلاغك", description: "سنقوم بمراجعة هذا التعليق." });
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
                <VerifiedBadge type={post.authorVerificationType || 'none'} size={14} />
                <span className="text-xs font-bold text-primary">{post.authorName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap text-right font-medium">
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

              {isVerifiedAuthor && (
                <motion.button 
                  whileTap={{ scale: 0.9 }} 
                  onClick={() => setIsSupportOpen(true)}
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors"
                >
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

        <div className="p-4">
          <div className="bg-primary/5 border border-dashed border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TimgadLogo size={24} className="text-primary" />
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5"><Rocket size={10} className="text-accent" /><span className="text-[9px] font-bold text-primary">مروج • Ad</span></div>
                <p className="text-[11px] font-bold text-primary/80 leading-tight">شحن رصيدك عبر PayPal متاح الآن لتفعيل ميزات النخبة!</p>
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
            comments.map((c: any) => {
              const canDelete = user && (user.uid === c.authorId || user.email === ADMIN_EMAIL);
              return (
                <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 justify-end group">
                  <div className="flex-1 flex flex-col items-end">
                    <div className="bg-secondary/20 p-2.5 rounded-2xl rounded-tr-none text-right relative w-full">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          {canDelete && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-destructive/40 hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                          )}
                          <button onClick={() => handleReportComment(c.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors"><Flag size={12} /></button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <VerifiedBadge type={c.authorVerificationType || 'none'} size={10} />
                          <span className="text-[10px] font-bold text-primary">{c.authorName}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed mb-2">{c.content}</p>
                      
                      <div className="flex items-center gap-3 pt-1 border-t border-muted/10">
                        <button 
                          onClick={() => handleLikeComment(c.id)} 
                          className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Heart size={10} />
                          <span>{c.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                    <span className="text-[7px] text-muted-foreground mt-1 px-1">{c.createdAt?.toDate ? formatDistanceToNow(c.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
                  </div>
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarImage src={c.authorAvatar} />
                    <AvatarFallback>{c.authorName?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-40"><p className="text-[10px] font-bold">لا توجد تعليقات بعد.</p></div>
          )}
        </div>
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-xs text-center p-6">
          <DialogHeader>
            <DialogTitle className="text-md font-bold text-primary">دعم المبدع</DialogTitle>
            <DialogDescription className="text-xs">اختر مبلغاً لدعم هذا المحتوى المتميز.</DialogDescription>
          </DialogHeader>
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
