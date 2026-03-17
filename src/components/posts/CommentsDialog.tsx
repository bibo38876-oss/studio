
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, MoreVertical, Trash2, AlertTriangle, Users, Sparkles, ImageIcon, Rocket } from 'lucide-react';
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

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !postAuthorId) return null;
    return doc(firestore, 'users', postAuthorId);
  }, [firestore, postAuthorId]);
  const { data: authorData } = useDoc(authorRef);

  const postLiveRef = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, postId]);
  const { data: livePost } = useDoc(postLiveRef);
  const displayPost = livePost || post;

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

    const commentData = {
      authorId: user.uid,
      authorName: profile?.username || user.displayName || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      content: content,
      createdAt: serverTimestamp(),
      authorEmail: user.email,
      authorVerificationType: user.email === 'adelbenmaza8@gmail.com' ? 'blue' : (profile?.verificationType || 'none')
    };

    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), commentData);
    
    updateDoc(doc(firestore, 'posts', postId), {
      commentsCount: increment(1)
    });

    if (user.uid !== postAuthorId) {
      setDocumentNonBlocking(doc(firestore, 'users', postAuthorId, 'notifications', `${user.uid}_comment_${Date.now()}`), {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: profile?.username || user.displayName || 'مستخدم تواصل',
        fromAvatar: profile?.profilePictureUrl || '',
        postId: postId,
        createdAt: serverTimestamp(),
        read: false
      }, { merge: true });
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.poll || userVote || isVoteLoading) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postLiveRef!);
        if (!postDoc.exists()) return;
        
        const currentPoll = postDoc.data().poll;
        currentPoll.options[optionIndex].votes += 1;
        currentPoll.totalVotes += 1;
        
        transaction.update(postLiveRef!, { poll: currentPoll });
        transaction.set(userVoteRef!, { optionIndex, votedAt: serverTimestamp() });
      });
      toast({ description: "تم تسجيل تصويتك بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", description: "فشل في تسجيل التصويت." });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'posts', postId, 'comments', commentId));
    updateDoc(doc(firestore, 'posts', postId), {
      commentsCount: increment(-1)
    });
    toast({ description: "تم حذف التعليق." });
  };

  const handleReportComment = () => {
    toast({ title: "شكراً لك", description: "تم استلام البلاغ عن هذا التعليق." });
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
  
  const currentAuthorName = authorData?.username || displayPost?.authorName || 'مستخدم تيمقاد';
  const currentAuthorAvatar = authorData?.profilePictureUrl || displayPost?.authorAvatar;
  const currentVerificationType = authorData?.verificationType || displayPost?.authorVerificationType || 'none';

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-left-2 duration-300">
      <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 h-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="h-8 w-8 rounded-full hover:bg-secondary transition-colors"
        >
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
              <Avatar className="h-10 w-10 border border-muted/20 rounded-full">
                <AvatarImage src={currentAuthorAvatar} alt={currentAuthorName} />
                <AvatarFallback>{currentAuthorName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center text-right">
                <div className="flex items-center gap-1.5 leading-tight justify-end">
                  <VerifiedBadge type={currentVerificationType === 'blue' || displayPost.email === 'adelbenmaza8@gmail.com' ? 'blue' : currentVerificationType} />
                  <span className="text-xs font-bold text-primary">{currentAuthorName}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">@{displayPost.email?.split('@')[0] || 'مستخدم'}</span>
              </div>
            </div>
            {displayPost.content && (
              <p className="px-4 pb-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap tracking-tight text-right">
                {renderContent(displayPost.content)}
              </p>
            )}

            {displayPost.poll && (
              <div className="px-4 mb-4">
                <div className="bg-secondary/10 p-4 border border-primary/5 space-y-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-primary">{displayPost.poll.question}</span>
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-full border border-primary/10">
                      <Users size={10} className="text-primary" />
                      <span className="text-[9px] font-bold text-primary">{displayPost.poll.totalVotes || 0} صوت</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {displayPost.poll.options.map((option: any, i: number) => {
                      const percentage = displayPost.poll!.totalVotes > 0 ? Math.round((option.votes / displayPost.poll!.totalVotes) * 100) : 0;
                      const isSelected = userVote?.optionIndex === i;
                      return (
                        <div key={i} className="relative overflow-hidden">
                          {userVote ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px] mb-1 px-1">
                                <div className="flex items-center gap-2">
                                  {option.imageUrl && (
                                    <div className="h-8 w-8 rounded-lg overflow-hidden border border-primary/10">
                                      <img src={option.imageUrl} className="w-full h-full object-cover" alt="Option" />
                                    </div>
                                  )}
                                  <span className={cn("font-bold", isSelected ? "text-primary underline" : "text-muted-foreground")}>{option.text}</span>
                                </div>
                                <span className="font-bold text-primary">{percentage}%</span>
                              </div>
                              <Progress value={percentage} className={cn("h-8 rounded-lg bg-secondary", isSelected ? "bg-primary/20" : "")} />
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full h-auto min-h-[44px] justify-between py-2 px-4 text-[12px] rounded-xl hover:bg-primary/5 hover:border-primary/30 font-bold group transition-all" 
                              onClick={() => handleVote(i)}
                            >
                              <div className="flex items-center gap-3">
                                {option.imageUrl && (
                                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-primary/10 shadow-sm group-hover:scale-105 transition-transform">
                                    <img src={option.imageUrl} className="w-full h-full object-cover" alt="Option" />
                                  </div>
                                )}
                                <span>{option.text}</span>
                              </div>
                              <Sparkles size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {allMedia.length > 0 && (
              <div className="w-full bg-black/5 relative">
                <Carousel 
                  setApi={setApi}
                  className="w-full"
                  opts={{ direction: 'rtl', align: 'start', loop: false }}
                >
                  <CarouselContent className="-ml-0">
                    {allMedia.map((url: string, index: number) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="relative w-full flex items-center justify-center bg-black/5">
                          <img 
                            src={url} 
                            alt={`Post detail ${index + 1}`} 
                            className="w-full h-auto block"
                            loading="lazy"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {countSlides > 1 && (
                  <div className="absolute top-4 left-4 z-10 flex flex-col items-center gap-1.5">
                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl">
                      <ImageIcon size={12} />
                      <span>{currentSlide} / {countSlides}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: countSlides }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                            currentSlide === i + 1 ? "w-4 bg-primary" : "w-1.5 bg-white/40"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* مساحة إعلانية مخصصة تظهر أسفل المنشور وقبل التعليقات */}
        <div className="px-4 py-4 bg-background">
          <div className="bg-primary/5 border border-dashed border-primary/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/10 transition-all cursor-pointer shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
                <TimgadLogo size={20} variant="white" />
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Rocket size={10} className="text-accent animate-pulse" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">محتوى مروج • Sponsored</span>
                </div>
                <p className="text-[11px] font-bold text-foreground/80">احصل على توثيق تيمقاد الملكي وتمتع بمزايا النخبة الآن!</p>
              </div>
            </div>
            <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="flex items-center gap-2 mb-2 border-b pb-2">
            <MessageSquareText size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">التعليقات</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary h-6 w-6" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-right-1 duration-300">
                <Avatar className="h-8 w-8 border rounded-full">
                  <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                  <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 justify-end">
                      <VerifiedBadge type={comment.authorVerificationType || (comment.authorEmail === 'adelbenmaza8@gmail.com' ? 'blue' : 'none')} size={12} />
                      <span className="text-[11px] font-bold text-primary">{comment.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-muted-foreground">
                        {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: ar }) : 'الآن'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                            <MoreVertical size={10} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          {user?.uid === comment.authorId ? (
                            <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive gap-2 cursor-pointer">
                              <Trash2 size={12} />
                              حذف التعليق
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={handleReportComment} className="gap-2 cursor-pointer">
                              <AlertTriangle size={12} />
                              إبلاغ
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="text-xs text-foreground/90 leading-relaxed bg-secondary/30 p-2 rounded-none text-right">
                    {renderContent(comment.content)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/5 rounded-none border border-dashed border-muted">
              <p className="text-muted-foreground text-[10px] font-medium italic">لا توجد تعليقات بعد. كن أول من يشارك!</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t bg-background/95 backdrop-blur-sm pb-safe sticky bottom-0 z-30">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10 group focus-within:bg-secondary/80 transition-all">
          <div className="flex-1 relative flex items-center">
            <Input 
              placeholder={isAnonymous ? "سجل الدخول للتعليق..." : "اكتب تعليقاً (150 حرفاً)..."}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0 placeholder:text-muted-foreground/50"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              readOnly={isAnonymous}
              onClick={() => isAnonymous && router.push('/login')}
              maxLength={150}
            />
            {commentText.length > 120 && (
              <span className="absolute left-0 text-[8px] text-primary/50 font-bold">
                {150 - commentText.length}
              </span>
            )}
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className={`h-8 w-8 rounded-full transition-all duration-300 ${commentText.trim() ? 'text-primary scale-110' : 'text-muted-foreground opacity-50'}`}
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
