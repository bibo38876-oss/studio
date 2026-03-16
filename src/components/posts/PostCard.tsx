
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Repeat, Trash2, AlertTriangle, Link as LinkIcon, BarChart3, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp, runTransaction, arrayUnion, collection } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    totalVotes: number;
    expiresAt: string;
  };
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  viewsCount?: number;
  reportsCount?: number;
  hashtags?: string[];
  email?: string;
  authorVerificationType?: VerificationType;
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  
  const isAnonymous = !user || user.isAnonymous;
  const isOwner = user?.uid === post.authorId;

  const postRef = useMemoFirebase(() => {
    if (!firestore || !post.id) return null;
    return doc(firestore, 'posts', post.id);
  }, [firestore, post.id]);

  const { data: centralPost } = useDoc(postRef);
  const displayPost = centralPost || post;

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !displayPost.authorId) return null;
    return doc(firestore, 'users', displayPost.authorId);
  }, [firestore, displayPost.authorId]);
  const { data: authorData } = useDoc(authorRef);

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user || !displayPost.id) return null;
    return doc(firestore, 'posts', displayPost.id, 'likes', user.uid);
  }, [firestore, displayPost.id, user]);
  const { data: likeData } = useDoc(likeRef);

  const repostRef = useMemoFirebase(() => {
    if (!firestore || !user || !displayPost.id) return null;
    return doc(firestore, 'users', user.uid, 'reposts', displayPost.id);
  }, [firestore, displayPost.id, user]);
  const { data: repostData } = useDoc(repostRef);

  const userVoteRef = useMemoFirebase(() => {
    if (!firestore || !user || !displayPost.id) return null;
    return doc(firestore, 'posts', displayPost.id, 'pollVotes', user.uid);
  }, [firestore, displayPost.id, user]);
  const { data: userVote } = useDoc(userVoteRef);

  useEffect(() => {
    if (!firestore || !displayPost.id || viewedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          updateDocumentNonBlocking(doc(firestore, 'posts', displayPost.id), { viewsCount: increment(1) });
        }
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [firestore, displayPost.id]);

  const handleVote = async (optionIndex: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.poll || userVote) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef!);
        if (!postDoc.exists()) return;
        
        const currentPoll = postDoc.data().poll;
        currentPoll.options[optionIndex].votes += 1;
        currentPoll.totalVotes += 1;
        
        transaction.update(postRef!, { poll: currentPoll });
        transaction.set(userVoteRef!, { optionIndex, votedAt: serverTimestamp() });
      });
      toast({ description: "تم تسجيل تصويتك بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", description: "فشل في تسجيل التصويت." });
    }
  };

  const handleLike = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.id) return;

    if (likeData) {
      deleteDocumentNonBlocking(likeRef!);
      updateDocumentNonBlocking(postRef!, { likesCount: increment(-1) });
      deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'likedPosts', displayPost.id));
    } else {
      setDocumentNonBlocking(likeRef!, { createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(postRef!, { likesCount: increment(1) });
      setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'likedPosts', displayPost.id), { ...displayPost, likedAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { interactedAuthorIds: arrayUnion(displayPost.authorId) });

      if (user.uid !== displayPost.authorId) {
        updateDocumentNonBlocking(doc(firestore, 'users', displayPost.authorId, 'notifications', `${user.uid}_like_${displayPost.id}`), {
          type: 'like',
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستكشف تيمقاد',
          fromAvatar: user.photoURL || '',
          postId: displayPost.id,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    }
  };

  const handleRepost = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.id) return;

    if (repostData) {
      deleteDocumentNonBlocking(repostRef!);
      updateDocumentNonBlocking(postRef!, { repostsCount: increment(-1) });
    } else {
      setDocumentNonBlocking(repostRef!, { postData: displayPost, repostedAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(postRef!, { repostsCount: increment(1) });
      toast({ description: "تمت إعادة النشر بنجاح." });
      
      if (user.uid !== displayPost.authorId) {
        updateDocumentNonBlocking(doc(firestore, 'users', displayPost.authorId, 'notifications', `${user.uid}_repost_${displayPost.id}`), {
          type: 'repost',
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستكشف تيمقاد',
          fromAvatar: user.photoURL || '',
          postId: displayPost.id,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    }
  };

  const handleReport = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.id) return;

    // 1. إنشاء مستند بلاغ
    addDocumentNonBlocking(collection(firestore, 'reports'), {
      reporterId: user.uid,
      targetId: displayPost.id,
      targetType: 'post',
      createdAt: serverTimestamp(),
      status: 'pending'
    });

    // 2. زيادة عداد البلاغات في المنشور
    updateDocumentNonBlocking(postRef!, {
      reportsCount: increment(1)
    });

    toast({ title: "شكراً لك", description: "تم استلام بلاغك، سنقوم بمراجعته قريباً." });
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const isLong = content.length > 250;
    const displayContent = isLong && !isExpanded ? content.slice(0, 250) + "..." : content;
    const parts = displayContent.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return <Link key={i} href={`/explore?q=${encodeURIComponent(part)}`} className="text-accent font-bold hover:underline" onClick={(e) => e.stopPropagation()}>{part}</Link>;
      }
      return part;
    });
    return (
      <div className="flex flex-col text-right">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap tracking-tight text-right">{parts}</p>
        {isLong && <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-accent text-[10px] font-bold mt-1 text-right hover:underline">{isExpanded ? 'عرض أقل' : 'اقرأ المزيد'}</button>}
      </div>
    );
  };

  const verificationType: VerificationType = displayPost.email === 'adelbenmaza8@gmail.com' 
    ? 'blue' : (authorData?.verificationType || displayPost.authorVerificationType || 'none');

  return (
    <Card ref={cardRef} className="border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-colors" onClick={() => setIsCommentsOpen(true)}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/post/${displayPost.id}`); toast({ description: "تم نسخ الرابط" }); }} className="gap-2 cursor-pointer"><LinkIcon size={12} /> نسخ الرابط</DropdownMenuItem>
            {!isOwner && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReport(); }} className="gap-2 text-red-500 cursor-pointer"><AlertTriangle size={12} /> إبلاغ عن محتوى مخالف</DropdownMenuItem>}
            {isOwner && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDocumentNonBlocking(doc(firestore!, 'posts', displayPost.id)); toast({ description: "تم الحذف" }); }} className="gap-2 text-destructive cursor-pointer"><Trash2 size={12} /> حذف المنشور</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href={`/profile/${displayPost.authorId}`} className="flex flex-row gap-3 group items-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 leading-tight justify-end">
              <VerifiedBadge type={verificationType} size={13} />
              <span className="text-sm font-bold text-primary group-hover:underline">{displayPost.authorName || 'مستخدم تيمقاد'}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">{displayPost.createdAt?.toDate ? formatDistanceToNow(displayPost.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'الآن'}</span>
          </div>
          <Avatar className="h-9 w-9 border border-muted/20 rounded-full bg-primary/5">
            <AvatarImage src={displayPost.authorAvatar} />
            <AvatarFallback className="text-[10px] font-bold">{displayPost.authorName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
      </CardHeader>
      
      <CardContent className="px-4 py-1 text-right space-y-3">
        {displayPost.content && renderContent(displayPost.content)}

        {displayPost.poll && (
          <div className="bg-secondary/10 p-4 border border-primary/5 space-y-4 rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary">{displayPost.poll.question}</span>
              {userVote && <CheckCircle2 size={14} className="text-accent" />}
            </div>
            <div className="space-y-3">
              {displayPost.poll.options.map((option, i) => {
                const percentage = displayPost.poll!.totalVotes > 0 ? Math.round((option.votes / displayPost.poll!.totalVotes) * 100) : 0;
                const isSelected = userVote?.optionIndex === i;
                return (
                  <div key={i} className="relative group">
                    {userVote ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] mb-1 px-1">
                          <span className={cn("font-bold", isSelected ? "text-primary" : "text-muted-foreground")}>{option.text}</span>
                          <span className="font-bold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className={cn("h-6 rounded-none bg-secondary", isSelected ? "bg-primary/20" : "")} />
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full h-9 justify-start text-[11px] rounded-none hover:bg-primary/5 hover:border-primary/30 font-medium" onClick={() => handleVote(i)}>
                        {option.text}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {displayPost.mediaUrls && displayPost.mediaUrls.length > 0 && (
          <div className="w-full mt-2 rounded-lg overflow-hidden border border-muted/10">
            <Carousel className="w-full" opts={{ direction: 'rtl' }}>
              <CarouselContent className="-ml-0">
                {displayPost.mediaUrls.map((url: string, index: number) => (
                  <CarouselItem key={index} className="pl-0">
                    <img src={url} alt={`Post media ${index + 1}`} className="w-full h-auto block" loading="lazy" />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-1 flex flex-row justify-between items-center h-9">
        <Button variant="ghost" size="sm" className={cn("h-7 gap-1.5 rounded-full px-2", likeData ? "text-red-500" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); handleLike(); }}>
          <Heart size={16} className={cn(likeData ? "fill-current" : "")} /><span className="text-[10px] font-bold">{displayPost.likesCount || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-muted-foreground gap-1.5 rounded-full px-2" onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}>
          <MessageCircle size={16} /><span className="text-[10px] font-bold">{displayPost.commentsCount || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className={cn("h-7 gap-1.5 rounded-full px-2", repostData ? "text-green-500" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); handleRepost(); }}>
          <Repeat size={16} /><span className="text-[10px] font-bold">{displayPost.repostsCount || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-muted-foreground gap-1.5 rounded-full px-2" onClick={(e) => e.stopPropagation()}>
          <BarChart3 size={16} /><span className="text-[10px] font-bold">{displayPost.viewsCount || 0}</span>
        </Button>
      </CardFooter>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[95vh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">تفاصيل المنشور</DialogTitle>
          <CommentsDialog postId={displayPost.id} postAuthorId={displayPost.authorId} post={displayPost} onClose={() => setIsCommentsOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
