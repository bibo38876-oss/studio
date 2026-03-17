
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Bookmark, Trash2, AlertTriangle, Link as LinkIcon, BarChart3, CheckCircle2, UserPlus, UserCheck, UserRoundPlus, Rocket, Coffee, Sparkles, ImageIcon, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp, runTransaction, arrayUnion, arrayRemove, updateDoc, collection } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  poll?: {
    question: string;
    options: { text: string; imageUrl?: string; votes: number }[];
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
  promoted?: boolean;
  impressions_left?: number;
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSupportAnim, setShowSupportAnim] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  const promotedViewedRef = useRef(false);
  
  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

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

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !displayPost.id) return null;
    return doc(firestore, 'posts', displayPost.id, 'likes', user.uid);
  }, [firestore, displayPost.id, user?.uid]);
  const { data: likeData, isLoading: isLikeLoading } = useDoc(likeRef);

  const bookmarkRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !displayPost.id) return null;
    return doc(firestore, 'users', user.uid, 'bookmarks', displayPost.id);
  }, [firestore, displayPost.id, user?.uid]);
  const { data: bookmarkData, isLoading: isBookmarkLoading } = useDoc(bookmarkRef);

  const userVoteRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !displayPost.id) return null;
    return doc(firestore, 'posts', displayPost.id, 'pollVotes', user.uid);
  }, [firestore, displayPost.id, user?.uid]);
  const { data: userVote, isLoading: isVoteLoading } = useDoc(userVoteRef);

  useEffect(() => {
    if (!firestore || !displayPost.id || !user?.uid) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!viewedRef.current) {
            viewedRef.current = true;
            updateDocumentNonBlocking(doc(firestore, 'posts', displayPost.id), { viewsCount: increment(1) });
          }
          if (displayPost.promoted && (displayPost.impressions_left || 0) > 0 && !promotedViewedRef.current) {
            promotedViewedRef.current = true;
            updateDocumentNonBlocking(doc(firestore, 'posts', displayPost.id), { 
              impressions_left: increment(-1),
            });
          }
        }
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [firestore, displayPost.id, displayPost.promoted, displayPost.impressions_left, user?.uid]);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.authorId || isOwner) return;

    const curUserRef = doc(firestore, 'users', user.uid);
    const targetUserRef = doc(firestore, 'users', displayPost.authorId);
    const isFollowing = currentUserProfile?.followingIds?.includes(displayPost.authorId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(displayPost.authorId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(user.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(displayPost.authorId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(user.uid) });
      
      setDocumentNonBlocking(doc(firestore, 'users', displayPost.authorId, 'notifications', `${user.uid}_follow`), {
        type: 'follow',
        fromUserId: user.uid,
        fromUsername: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      }, { merge: true });
    }
  };

  const handlePromote = (impressions: number, cost: number) => {
    if (!firestore || !displayPost.id || !user?.uid || !currentUserProfile) return;

    if (!isInfiniteAdmin && (currentUserProfile.coins || 0) < cost) {
      toast({
        variant: "destructive",
        title: "رصيد غير كافٍ",
        description: `تحتاج إلى ${cost} عملة تيمقاد لتفعيل هذه الباقة الترويجية.`,
      });
      return;
    }

    if (!isInfiniteAdmin) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-cost)
      });
    }

    updateDocumentNonBlocking(doc(firestore, 'posts', displayPost.id), {
      promoted: true,
      impressions_left: increment(impressions)
    });

    setIsPromoteOpen(false);
    toast({ 
      title: "تم الترويج بنجاح!", 
      description: isInfiniteAdmin ? `تم ترويج المنشور بميزة الإشراف الإداري.` : `لقد دفعت ${cost} عملة مقابل ${impressions} مشاهدة مستهدفة في مجتمع تيمقاد.` 
    });
  };

  const handleSupport = (amount: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !currentUserProfile) return;

    if (!isInfiniteAdmin && (currentUserProfile.coins || 0) < amount) {
      toast({
        variant: "destructive",
        title: "رصيد غير كافٍ",
        description: "لا تملك عملات كافية لإرسال هذا الدعم.",
      });
      return;
    }

    setShowSupportAnim(true);
    setTimeout(() => setShowSupportAnim(false), 2000);

    if (!isInfiniteAdmin) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-amount)
      });
    }

    updateDocumentNonBlocking(doc(firestore, 'users', displayPost.authorId), {
      coins: increment(amount)
    });

    addDocumentNonBlocking(collection(firestore, 'users', displayPost.authorId, 'notifications'), {
      type: 'support',
      fromUserId: user.uid,
      fromUsername: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
      fromAvatar: currentUserProfile?.profilePictureUrl || '',
      amount: amount,
      postId: displayPost.id,
      createdAt: serverTimestamp(),
      read: false
    });

    const supportedUserRef = doc(firestore, 'users', user.uid, 'supportedPeople', displayPost.authorId);
    setDocumentNonBlocking(supportedUserRef, {
      userId: displayPost.authorId,
      username: authorData?.username || displayPost.authorName,
      avatar: authorData?.profilePictureUrl || displayPost.authorAvatar,
      totalAmount: increment(amount),
      lastSupportedAt: serverTimestamp(),
      verificationType: authorData?.verificationType || displayPost.authorVerificationType || 'none'
    }, { merge: true });

    const supporterRef = doc(firestore, 'users', displayPost.authorId, 'supporters', user.uid);
    setDocumentNonBlocking(supporterRef, {
      userId: user.uid,
      username: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
      avatar: currentUserProfile?.profilePictureUrl || '',
      totalAmount: increment(amount),
      lastSupportedAt: serverTimestamp(),
      verificationType: currentUserProfile?.verificationType || 'none'
    }, { merge: true });

    toast({
      title: "تم إرسال الدعم",
      description: `لقد أرسلت ${amount} عملة تيمقاد لدعم هذا المحتوى. شكراً لك!`,
    });
  };

  const handleVote = async (optionIndex: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.poll || userVote || isVoteLoading) return;

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
    if (!firestore || !user || !displayPost.id || isLikeLoading) return;

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
        setDocumentNonBlocking(doc(firestore, 'users', displayPost.authorId, 'notifications', `${user.uid}_like_${displayPost.id}`), {
          type: 'like',
          fromUserId: user.uid,
          fromUsername: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
          fromAvatar: currentUserProfile?.profilePictureUrl || '',
          postId: displayPost.id,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleBookmark = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.id || isBookmarkLoading) return;

    if (bookmarkData) {
      deleteDocumentNonBlocking(bookmarkRef!);
      toast({ description: "تمت إزالة المنشور من المحفوظات." });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...displayPost, createdAt: serverTimestamp() }, { merge: true });
      toast({ description: "تم حفظ المنشور بنجاح." });
    }
  };

  const handleReport = () => {
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !displayPost.id) return;

    addDocumentNonBlocking(collection(firestore, 'reports'), {
      reporterId: user.uid,
      targetId: displayPost.id,
      targetType: 'post',
      createdAt: serverTimestamp(),
      status: 'pending'
    });

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

  const currentAuthorName = authorData?.username || displayPost.authorName || 'مستخدم تيمقاد';
  const currentAuthorAvatar = authorData?.profilePictureUrl || displayPost.authorAvatar;
  const currentVerificationType: VerificationType = authorData?.verificationType || displayPost.authorVerificationType || 'none';
  const isVerified = currentVerificationType !== 'none';
  const isFollowing = currentUserProfile?.followingIds?.includes(displayPost.authorId);
  const isFollowingMe = currentUserProfile?.followerIds?.includes(displayPost.authorId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <AnimatePresence>
          {showSupportAnim && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: -120, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2">
                <TimgadCoin size={64} className="animate-bounce" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex gap-1"
                >
                  <Sparkles size={24} className="text-accent" />
                  <Sparkles size={16} className="text-primary" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card ref={cardRef} className="border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-colors" onClick={() => setIsCommentsOpen(true)}>
          {displayPost.promoted && (
            <div className="flex items-center gap-1.5 text-[9px] text-accent font-bold px-4 pt-2 group">
              <Rocket size={10} className="fill-current animate-pulse" />
              <span className="uppercase tracking-widest">مروج • Sponsored</span>
            </div>
          )}
          
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 text-right">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="text-xs">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/post/${displayPost.id}`); toast({ description: "تم نسخ الرابط" }); }} className="gap-2 cursor-pointer"><LinkIcon size={12} /> نسخ الرابط</DropdownMenuItem>
                  
                  {isOwner && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsPromoteOpen(true); }} className="gap-2 cursor-pointer text-accent font-bold">
                      <Rocket size={12} /> ترويج المنشور
                    </DropdownMenuItem>
                  )}

                  {!isOwner && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReport(); }} className="gap-2 text-red-500 cursor-pointer"><AlertTriangle size={12} /> إبلاغ عن محتوى مخالف</DropdownMenuItem>}
                  {isOwner && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDocumentNonBlocking(doc(firestore!, 'posts', displayPost.id)); toast({ description: "تم الحذف" }); }} className="gap-2 text-destructive cursor-pointer"><Trash2 size={12} /> حذف المنشور</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-1">
                {isVerified && !isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-all border border-primary/10"
                      >
                        <Coffee size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="min-w-[160px] p-2">
                      <DropdownMenuLabel className="text-[10px] font-bold text-primary text-center pb-2 uppercase tracking-tighter">ادعم محتوى {currentAuthorName}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[1, 5, 10, 30, 50].map((amount) => (
                        <DropdownMenuItem 
                          key={amount} 
                          onClick={(e) => { e.stopPropagation(); handleSupport(amount); }}
                          className="flex justify-between items-center cursor-pointer py-2 px-3 hover:bg-primary/5 rounded-sm transition-colors"
                        >
                          <span className="text-xs font-bold text-primary">{amount} عملة تيمقاد</span>
                          <TimgadCoin size={20} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!isOwner && !isUserLoading && (
                  <Button 
                    size="sm" 
                    variant={isFollowing ? "outline" : "default"} 
                    className={cn(
                      "h-6 px-3 text-[9px] font-bold rounded-full transition-all gap-1.5",
                      isFollowing ? "border-primary/20 text-primary hover:bg-primary/5" : "bg-primary text-white hover:bg-primary/90"
                    )}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={10} />
                        متابع
                      </>
                    ) : isFollowingMe ? (
                      <>
                        <UserRoundPlus size={10} />
                        رد المتابعة
                      </>
                    ) : (
                      <>
                        <UserPlus size={10} />
                        متابعة
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <Link href={`/profile/${displayPost.authorId}`} className="flex flex-row gap-3 group items-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5 leading-tight justify-end">
                  <VerifiedBadge type={currentVerificationType} size={13} />
                  <span className="text-sm font-bold text-primary group-hover:underline">{currentAuthorName}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{displayPost.createdAt?.toDate ? formatDistanceToNow(displayPost.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'الآن'}</span>
              </div>
              <Avatar className="h-9 w-9 border border-muted/20 rounded-full bg-primary/5">
                <AvatarImage src={currentAuthorAvatar} />
                <AvatarFallback className="text-[10px] font-bold">{currentAuthorName?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
          </CardHeader>
          
          <CardContent className="px-4 py-1 text-right space-y-3">
            {displayPost.content && renderContent(displayPost.content)}

            {displayPost.poll && (
              <div className="bg-secondary/10 p-4 border border-primary/5 space-y-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-primary">{displayPost.poll.question}</span>
                  <div className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-full border border-primary/10">
                    <Users size={10} className="text-primary" />
                    <span className="text-[9px] font-bold text-primary">{displayPost.poll.totalVotes || 0} صوت</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {displayPost.poll.options.map((option, i) => {
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
            )}
            
            {displayPost.mediaUrls && displayPost.mediaUrls.length > 0 && (
              <div className="w-full mt-2 rounded-2xl overflow-hidden border border-muted/10 shadow-sm relative group/media">
                <div className="w-full bg-black/5 flex items-center justify-center overflow-hidden">
                  <img 
                    src={displayPost.mediaUrls[0]} 
                    alt="Post first media" 
                    className="w-full h-auto block" 
                    loading="lazy" 
                  />
                </div>

                {/* مؤشر وجود صور إضافية */}
                {displayPost.mediaUrls.length > 1 && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                      <ImageIcon size={10} />
                      <span>1 / {displayPost.mediaUrls.length}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 py-1 flex flex-row justify-between items-center h-10">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 rounded-full px-3 transition-all", likeData ? "text-red-500 bg-red-50/50" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); handleLike(); }} disabled={isLikeLoading}>
                <motion.div
                  animate={likeData ? { scale: [1, 1.4, 1.1], rotate: [0, 15, -15, 0] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={18} className={cn(likeData ? "fill-current" : "")} />
                </motion.div>
                <span className="text-[11px] font-bold">{displayPost.likesCount || 0}</span>
              </Button>
            </motion.div>

            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground gap-1.5 rounded-full px-3" onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}>
              <MessageCircle size={18} /><span className="text-[11px] font-bold">{displayPost.commentsCount || 0}</span>
            </Button>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 rounded-full px-3 transition-all", bookmarkData ? "text-accent bg-accent/5" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); handleBookmark(); }} disabled={isBookmarkLoading}>
                <motion.div
                  animate={bookmarkData ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Bookmark size={18} className={cn(bookmarkData ? "fill-current" : "")} />
                </motion.div>
              </Button>
            </motion.div>

            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground gap-1.5 rounded-full px-3" onClick={(e) => e.stopPropagation()}>
              <BarChart3 size={18} /><span className="text-[11px] font-bold">{displayPost.viewsCount || 0}</span>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Rocket className="text-accent" size={18} /> ترويج المنشور بالعملات
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between bg-primary/5 p-3 border border-primary/10 rounded-sm mb-4">
              <div className="flex flex-col text-right">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">رصيدك المتاح</span>
                <span className="text-sm font-bold text-primary">{isInfiniteAdmin ? '∞' : `${currentUserProfile?.coins || 0} عملة`}</span>
              </div>
              <TimgadCoin size={32} />
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center mb-4">اختر الباقة المناسبة لزيادة رقعة انتشار منشورك في تيمقاد.</p>
            
            {[
              { coins: 100, impressions: 4000, label: "باقة الانطلاق" },
              { coins: 200, impressions: 10000, label: "باقة التوسع" },
              { coins: 500, impressions: 30000, label: "باقة الهيمنة" },
            ].map((tier, i) => (
              <Button 
                key={i} 
                variant="outline" 
                className="w-full h-16 justify-between px-6 rounded-none hover:bg-primary/5 group border-muted/20"
                onClick={() => handlePromote(tier.impressions, tier.coins)}
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-primary">{tier.label}</span>
                  <span className="text-[10px] text-muted-foreground">{tier.impressions.toLocaleString()} مشاهدة مستهدفة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-accent group-hover:scale-110 transition-transform">{isInfiniteAdmin ? 'مجاني' : tier.coins}</span>
                  <TimgadCoin size={20} />
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <p className="text-[8px] text-muted-foreground text-center w-full italic">سيتم خصم العملات من رصيدك فوراً ويبدأ الترويج تلقائياً.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[95vh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">تفاصيل المنشور</DialogTitle>
          <CommentsDialog postId={displayPost.id} postAuthorId={displayPost.authorId} post={displayPost} onClose={() => setIsCommentsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
