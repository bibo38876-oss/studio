
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, Heart, BarChart3, Trash2, Coffee, Flag, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AadsUnitBanner } from '@/components/ads/AadsUnit';

export default function CommentsDialog({ postId, postAuthorId, post, onClose, currentUserProfile }: { postId: string, postAuthorId: string, post: any, onClose: () => void, currentUserProfile?: any }) {
  const [commentText, setCommentText] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    if (firestore && postId) {
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), { viewsCount: increment(1) });
    }
  }, [firestore, postId]);

  const postAuthorProfileRef = useMemoFirebase(() => {
    if (!firestore || !postAuthorId) return null;
    return doc(firestore, 'users', postAuthorId);
  }, [firestore, postAuthorId]);
  const { data: postAuthorProfile } = useDoc(postAuthorProfileRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, postId]);

  const { data: rawComments, isLoading } = useCollection(commentsQuery);

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

  const handleSupport = (amount: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if ((currentUserProfile?.coins || 0) < amount) {
      toast({ variant: "destructive", description: "رصيدك غير كافٍ." });
      return;
    }
    if (!firestore || !user) return;

    const platformFee = amount * 0.1;
    const netAmount = amount - platformFee;

    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-amount) });
    updateDocumentNonBlocking(doc(firestore, 'users', post.authorId), { coins: increment(netAmount) });
    
    addDocumentNonBlocking(collection(firestore, 'platform_revenue'), {
      type: 'support_fee',
      amount: platformFee,
      fromUserId: user.uid,
      toUserId: post.authorId,
      createdAt: serverTimestamp()
    });

    toast({ title: "شكراً لك! ☕️", description: `تم إرسال ${netAmount.toFixed(1)} عملة للمبدع.` });
    setIsSupportOpen(false);
  };

  const renderCommentsWithAds = () => {
    if (!rawComments) return null;
    const elements = [];
    for (let i = 0; i < rawComments.length; i++) {
      elements.push(<CommentItem key={rawComments[i].id} comment={rawComments[i]} postId={postId} firestore={firestore} user={user} />);
      // إعلان بانر نظيف كل 5 تعليقات
      if ((i + 1) % 5 === 0) {
        elements.push(<AadsUnitBanner key={`comment-ad-${i}`} />);
      }
    }
    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-background text-right">
      <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full"><ChevronRight size={20} /></Button>
        <span className="text-[11px] font-bold text-primary">النقاش التفاعلي</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 border-b bg-muted/5">
          <div className="flex gap-3 mb-4 justify-end">
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 leading-tight justify-end">
                <VerifiedBadge type={postAuthorProfile?.verificationType || post.authorVerificationType || 'none'} size={14} />
                <span className="text-xs font-bold text-primary">{postAuthorProfile?.username || post.authorName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10"><AvatarImage src={postAuthorProfile?.profilePictureUrl || post.authorAvatar} /><AvatarFallback>{(postAuthorProfile?.username || post.authorName)?.[0]}</AvatarFallback></Avatar>
          </div>
          
          <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap text-right font-medium">
            {post.content}
          </div>
          
          <div className="flex justify-between items-center py-3 border-t border-muted/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Heart size={18} /> <span className="text-[11px] font-bold">{post.likesCount || 0}</span></div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><MessageSquareText size={18} /> <span className="text-[11px] font-bold">{post.commentsCount || 0}</span></div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsSupportOpen(true)} className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700">
                <Coffee size={18} />
                <span className="text-[10px] font-bold">دعم</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : rawComments && rawComments.length > 0 ? (
            renderCommentsWithAds()
          ) : (
            <div className="text-center py-10 opacity-40"><p className="text-[10px] font-bold">لا توجد نقاشات بعد.</p></div>
          )}
        </div>
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-[300px] text-center p-6 rounded-none">
          <DialogTitle className="text-sm font-bold text-primary mb-2">دعم المبدع</DialogTitle>
          <div className="grid grid-cols-2 gap-3">
            {[3, 7, 10, 20].map((amt) => (
              <Button key={amt} variant="outline" className="h-14 flex flex-col gap-1 rounded-none border-primary/20" onClick={() => handleSupport(amt)}>
                <span className="text-sm font-bold">{amt}</span>
                <TimgadCoin size={16} />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-3 border-t bg-background sticky bottom-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input placeholder="أضف تعليقك..." className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs text-right h-full p-0" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
          <Button variant="ghost" size="icon" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8 w-8 rounded-full text-primary"><Send size={16} /></Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, firestore, user }: any) {
  return (
    <div className="flex gap-3 justify-end group">
      <div className="flex-1 flex flex-col items-end">
        <div className="bg-secondary/20 p-3 rounded-2xl rounded-tr-none text-right w-full">
          <div className="flex justify-end items-center gap-1.5 mb-1">
            <VerifiedBadge type={comment.authorVerificationType || 'none'} size={10} />
            <span className="text-[10px] font-bold text-primary">{comment.authorName}</span>
          </div>
          <p className="text-xs leading-relaxed">{comment.content}</p>
        </div>
        <span className="text-[7px] text-muted-foreground mt-1 px-1">{comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
      </div>
      <Avatar className="h-8 w-8 border shrink-0"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{comment.authorName?.[0]}</AvatarFallback></Avatar>
    </div>
  );
}
