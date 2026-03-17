
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, MoreVertical, Trash2, AlertTriangle, Users, Sparkles, ImageIcon, Rocket, Heart, Bookmark, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';

interface CommentsDialogProps {
  postId: string;
  postAuthorId: string;
  post?: any;
  onClose: () => void;
}

export default function CommentsDialog({ postId, postAuthorId, post, onClose }: CommentsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countSlides, setCountSlides] = useState(0);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user || isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user, isAnonymous]);
  const { data: profile } = useDoc(userRef);

  const postLiveRef = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, postId]);
  const { data: livePost } = useDoc(postLiveRef);
  const displayPost = livePost || post;

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

  const userVoteRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !postId) return null;
    return doc(firestore, 'posts', postId, 'pollVotes', user.uid);
  }, [firestore, postId, user?.uid]);
  const { data: userVote, isLoading: isVoteLoading } = useDoc(userVoteRef);

  useEffect(() => {
    if (!api) return;
    setCountSlides(api.scrollSnapList().length);
    setCurrentSlide(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, postId]);

  const { data: comments, isLoading } = useCollection(commentsQuery);

  const handleAddComment = () => {
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!commentText.trim() || !user || !firestore) return;

    const content = commentText.trim().substring(0, 150);
    setCommentText('');

    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), {
      authorId: user.uid,
      authorName: profile?.username || user.displayName || 'مستخدم تيمقاد',
      authorAvatar: profile?.profilePictureUrl || '',
      content: content,
      createdAt: serverTimestamp(),
      authorEmail: user.email,
      authorVerificationType: user.email === 'adelbenmaza8@gmail.com' ? 'blue' : (profile?.verificationType || 'none')
    });
    
    updateDoc(doc(firestore, 'posts', postId), {
      commentsCount: increment(1)
    });

    if (user.uid !== postAuthorId) {
      setDocumentNonBlocking(doc(firestore, 'users', postAuthorId, 'notifications', `${user.uid}_comment_${Date.now()}`), {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: profile?.username || user.displayName || 'مستخدم تيمقاد',
        fromAvatar: profile?.profilePictureUrl || '',
        postId: postId,
        createdAt: serverTimestamp(),
        read: false
      }, { merge: true });
    }
  };

  const handleLike = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !postId) return;

    if (likeData) {
      deleteDocumentNonBlocking(likeRef!);
      updateDocumentNonBlocking(postLiveRef!, { likesCount: increment(-1) });
      deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'likedPosts', postId));
    } else {
      setDocumentNonBlocking(likeRef!, { createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(postLiveRef!, { likesCount: increment(1) });
      setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'likedPosts', postId), { ...displayPost, likedAt: serverTimestamp() }, { merge: true });
      
      if (user.uid !== postAuthorId) {
        setDocumentNonBlocking(doc(firestore, 'users', postAuthorId, 'notifications', `${user.uid}_like_${postId}`), {
          type: 'like',
          fromUserId: user.uid,
          fromUsername: profile?.username || user.displayName || 'مستكشف تيمقاد',
          fromAvatar: profile?.profilePictureUrl || '',
          postId: postId,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleBookmark = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !postId) return;

    if (bookmarkData) {
      deleteDocumentNonBlocking(bookmarkRef!);
      updateDocumentNonBlocking(postLiveRef!, { bookmarksCount: increment(-1) });
      toast({ description: "تمت إزالة المنشور من المحفوظات." });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...displayPost, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(postLiveRef!, { bookmarksCount: increment(1) });
      toast({ description: "تم حفظ المنشور بنجاح." });
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Link 
            key={i} 
            href={`/explore?q=${encodeURIComponent(part)}`}
            className="text-accent font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const allMedia = displayPost?.mediaUrls || (displayPost?.mediaUrl ? [displayPost.mediaUrl] : []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <ChevronRight size={20} />
        </Button>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-primary leading-tight">تفاصيل المنشور</span>
          <span className="text-[8px] text-muted-foreground">التفاعل والتعليقات</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 scroll-smooth">
        {displayPost && (
          <div className="pb-4 border-b bg-muted/5">
            <div className="flex gap-3 p-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={displayPost.authorAvatar} />
                <AvatarFallback>{displayPost.authorName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center text-right">
                <div className="flex items-center gap-1.5 leading-tight justify-end">
                  <VerifiedBadge type={displayPost.authorVerificationType || 'none'} />
                  <span className="text-xs font-bold text-primary">{displayPost.authorName}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">@{displayPost.email?.split('@')[0] || 'مستخدم'}</span>
              </div>
            </div>
            {displayPost.content && (
              <p className="px-4 pb-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap text-right">
                {renderContent(displayPost.content)}
              </p>
            )}

            {displayPost.poll && (
              <div className="px-4 mb-4">
                <div className="bg-secondary/10 p-4 border rounded-xl space-y-3">
                  <span className="text-sm font-bold text-primary block mb-2">{displayPost.poll.question}</span>
                  {displayPost.poll.options.map((option: any, i: number) => {
                    const percentage = displayPost.poll!.totalVotes > 0 ? Math.round((option.votes / displayPost.poll!.totalVotes) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>{option.text}</span>
                          <span>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {allMedia.length > 0 && (
              <div className="w-full bg-black/5 relative">
                <Carousel setApi={setApi} className="w-full" opts={{ direction: 'rtl' }}>
                  <CarouselContent className="-ml-0">
                    {allMedia.map((url: string, index: number) => (
                      <CarouselItem key={index} className="pl-0">
                        <img src={url} alt={`Post media ${index}`} className="w-full h-auto block" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                {countSlides > 1 && (
                  <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    {currentSlide} / {countSlides}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center px-4 mt-4 py-2 border-t border-muted/10">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 rounded-full px-3", likeData ? "text-red-500 bg-red-50/50" : "text-muted-foreground")} onClick={handleLike}>
                  <Heart size={18} className={likeData ? "fill-current" : ""} />
                  <span className="text-[11px] font-bold">{displayPost.likesCount || 0}</span>
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 rounded-full px-3", bookmarkData ? "text-accent bg-accent/5" : "text-muted-foreground")} onClick={handleBookmark}>
                  <Bookmark size={18} className={bookmarkData ? "fill-current" : ""} />
                  <span className="text-[11px] font-bold">{displayPost.bookmarksCount || 0}</span>
                </Button>
              </motion.div>
              <div className="flex items-center gap-1.5 text-muted-foreground px-3">
                <BarChart3 size={18} />
                <span className="text-[11px] font-bold">{displayPost.viewsCount || 0}</span>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <div className="bg-primary/5 border border-dashed border-primary/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/10 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white">
                <TimgadLogo size={20} variant="white" />
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Rocket size={10} className="text-accent animate-pulse" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">محتوى مروج • Ad</span>
                </div>
                <p className="text-[11px] font-bold text-foreground/80">احصل على توثيق تيمقاد الملكي الآن وتمتع بمزايا النخبة!</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-primary group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="flex items-center gap-2 mb-2 border-b pb-2">
            <MessageSquareText size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">التعليقات</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary h-6 w-6" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={comment.authorAvatar} />
                  <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary">{comment.authorName}</span>
                    <span className="text-[8px] text-muted-foreground">
                      {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: ar }) : 'الآن'}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/90 leading-relaxed bg-secondary/30 p-2 rounded-lg text-right">
                    {renderContent(comment.content)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-40">
              <p className="text-[10px] font-medium italic">لا توجد تعليقات بعد.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t bg-background sticky bottom-0 z-30">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input 
            placeholder={isAnonymous ? "سجل الدخول للتعليق..." : "اكتب تعليقاً..."}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            readOnly={isAnonymous}
            maxLength={150}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className={cn("h-8 w-8 rounded-full", commentText.trim() ? 'text-primary' : 'text-muted-foreground opacity-50')}
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
