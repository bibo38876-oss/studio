
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, MoreVertical, Trash2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentsDialogProps {
  postId: string;
  postAuthorId: string;
  post?: any;
  onClose: () => void;
}

export default function CommentsDialog({ postId, postAuthorId, post, onClose }: CommentsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user || isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user, isAnonymous]);
  const { data: profile } = useDoc(userRef);

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

    const content = commentText.trim();
    setCommentText('');

    const commentData = {
      authorId: user.uid,
      authorName: profile?.username || user.displayName || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      content: content,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), commentData);
    
    updateDoc(doc(firestore, 'posts', postId), {
      commentsCount: increment(1)
    });

    if (user.uid !== postAuthorId) {
      addDocumentNonBlocking(collection(firestore, 'users', postAuthorId, 'notifications'), {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: profile?.username || user.displayName || 'مستخدم تواصل',
        fromAvatar: profile?.profilePictureUrl || '',
        postId: postId,
        createdAt: serverTimestamp(),
        read: false
      });
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

  const allMedia = post?.mediaUrls || (post?.mediaUrl ? [post.mediaUrl] : []);

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-left-2 duration-300">
      <div className="flex items-center gap-4 p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-20 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-secondary transition-colors">
          <ChevronRight size={20} />
        </Button>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-primary leading-tight">المنشور</span>
          <span className="text-[8px] text-muted-foreground">عرض التفاصيل والتعليقات</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 scroll-smooth">
        {post && (
          <div className="pb-4 border-b bg-muted/5">
            <div className="flex gap-3 p-4">
              <Avatar className="h-10 w-10 border border-muted/20 rounded-full">
                <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-primary leading-tight">{post.authorName}</span>
                <span className="text-[10px] text-muted-foreground">@{post.email?.split('@')[0] || 'مستخدم'}</span>
              </div>
            </div>
            {post.content && (
              <p className="px-4 pb-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap tracking-tight">
                {post.content}
              </p>
            )}
            {allMedia.length > 0 && (
              <div className="w-full bg-black/5">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-0">
                    {allMedia.map((url: string, index: number) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="relative w-full flex items-center justify-center bg-black/5">
                          <img 
                            src={url} 
                            alt={`Post detail ${index + 1}`} 
                            className="w-full h-auto block"
                            style={{ maxHeight: 'none', width: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}
          </div>
        )}

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
                    <span className="text-[11px] font-bold text-primary">{comment.authorName}</span>
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
                            <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive gap-2">
                              <Trash2 size={12} />
                              حذف التعليق
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={handleReportComment} className="gap-2">
                              <AlertTriangle size={12} />
                              إبلاغ
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/30 p-2 rounded-none">{comment.content}</p>
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
          <Input 
            placeholder={isAnonymous ? "سجل الدخول للتعليق..." : "اكتب تعليقاً..."}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0 placeholder:text-muted-foreground/50"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            readOnly={isAnonymous}
            onClick={() => isAnonymous && router.push('/login')}
          />
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
