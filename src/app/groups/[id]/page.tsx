
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, Users, MoreVertical, Trash2, UserPlus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { AadsUnitBanner } from '@/components/ads/AadsUnit';

export default function GroupChatPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();
  const [message, setMessage] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchInvite, setSearchInvite] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groups', id);
  }, [firestore, id]);

  const { data: group, isLoading: isGroupLoading } = useDoc(groupRef);

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: currentUserProfile } = useDoc(currentUserRef);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !currentUserProfile?.followingIds || currentUserProfile.followingIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('id', 'in', currentUserProfile.followingIds.slice(0, 10)));
  }, [firestore, currentUserProfile?.followingIds]);

  const { data: followingUsers } = useCollection(followingQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'groups', id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, id]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  const isCreator = user && group && user.uid === group.creatorId;
  const isMember = user && group && (group.members || []).includes(user.uid);

  useEffect(() => {
    // الانتظار حتى يتم تحميل بيانات المستخدم والمجموعة قبل اتخاذ قرار الخروج
    if (isUserLoading || isGroupLoading) return;

    if (!group) {
      router.push('/groups');
      return;
    }

    if (!isMember) {
      toast({ variant: "destructive", description: "ليس لديك صلاحية لدخول هذه المجموعة." });
      router.push('/groups');
    }
  }, [group, isGroupLoading, isUserLoading, isMember, router, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }
    if (!message.trim() || !firestore || !id) return;

    const content = message.trim().substring(0, 150);
    setMessage('');

    addDocumentNonBlocking(collection(firestore, 'groups', id, 'messages'), {
      content: content,
      senderId: user.uid,
      senderName: currentUserProfile?.username || user.displayName || 'مستخدم تواصل',
      senderAvatar: currentUserProfile?.profilePictureUrl || '',
      senderEmail: user.email,
      senderVerificationType: currentUserProfile?.verificationType || (user.email === 'adelbenmaza8@gmail.com' ? 'blue' : 'none'),
      createdAt: serverTimestamp(),
    });
  };

  const handleInviteUser = (targetUser: any) => {
    if (!firestore || !id || !group) return;

    if ((group.members?.length || 0) >= 100) {
      toast({ variant: "destructive", description: "عذراً، المجموعة ممتلئة (الحد الأقصى 100 عضو)." });
      return;
    }

    if (group.members?.includes(targetUser.id)) {
      toast({ description: "المستخدم عضو بالفعل في المجموعة." });
      return;
    }

    const inviteRef = doc(firestore, 'users', targetUser.id, 'groupInvites', id);
    setDocumentNonBlocking(inviteRef, {
      groupId: id,
      groupName: group.name,
      invitedBy: currentUserProfile?.username || user?.displayName || 'مستخدم تواصل',
      invitedById: user?.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      currentMembersCount: group.members?.length || 0
    }, { merge: true });

    toast({ description: `تم إرسال دعوة لـ ${targetUser.username}` });
  };

  const handleDeleteGroup = () => {
    if (!firestore || !id || !isCreator) return;
    deleteDocumentNonBlocking(doc(firestore, 'groups', id));
    toast({ title: "تم الحذف", description: "تم حذف المجموعة نهائياً." });
    router.push('/groups');
  };

  if (isGroupLoading || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-40 bg-background/80 backdrop-blur-md border-b flex items-center justify-between p-2 h-10 w-full max-w-[500px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <Users size={14} />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-bold text-primary leading-tight truncate">{group?.name}</span>
              <span className="text-[8px] text-muted-foreground">{group?.members?.length || 0}/100 عضو</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isCreator && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/5" onClick={() => setIsInviteOpen(true)}>
                <UserPlus size={16} />
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold">دعوة المتابعين</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="ابحث بين متابعيك..." 
                      className="h-9 pr-9 rounded-none bg-secondary/30 border-none text-xs"
                      value={searchInvite}
                      onChange={(e) => setSearchInvite(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y">
                    {followingUsers?.filter(u => u.username.toLowerCase().includes(searchInvite.toLowerCase())).map((fUser: any) => (
                      <div key={fUser.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={fUser.profilePictureUrl} />
                            <AvatarFallback>{fUser.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1">
                            <VerifiedBadge type={fUser.verificationType || 'none'} size={12} />
                            <span className="text-xs font-bold text-primary">{fUser.username}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[9px] rounded-full" onClick={() => handleInviteUser(fUser)}>
                          دعوة
                        </Button>
                      </div>
                    ))}
                    {(!followingUsers || followingUsers.length === 0) && (
                      <p className="text-[10px] text-center text-muted-foreground py-10">يجب أن تتابع أشخاصاً أولاً لتتمكن من دعوتهم.</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isCreator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical size={16} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 size={14} />
                  حذف المجموعة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <main 
        className="flex-1 overflow-y-auto pt-24 pb-20 px-4 container max-w-[500px] mx-auto flex flex-col gap-4 scroll-smooth" 
        ref={scrollRef}
      >
        <AadsUnitBanner />
        
        {isMessagesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2 max-w-[90%] ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7 mt-auto shrink-0 border">
                    <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                    <AvatarFallback className="text-[8px]">{msg.senderName?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1 mb-0.5 ml-1">
                      <VerifiedBadge type={msg.senderVerificationType || 'none'} size={10} />
                      <span className="text-[8px] font-bold text-primary">{msg.senderName}</span>
                    </div>
                  )}
                  <div className={`px-3 py-1.5 text-xs leading-relaxed shadow-sm break-words ${isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-card border text-foreground rounded-r-xl rounded-tl-xl'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[7px] text-muted-foreground mt-1 px-1">
                    {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar }) : 'الآن'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-[10px] text-muted-foreground font-medium">ابدأ الدردشة في هذه المجموعة!</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 bg-background border-t p-2 w-full max-w-[500px] h-12">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-full group focus-within:bg-secondary transition-colors">
          <div className="flex-1 relative flex items-center">
            <Input 
              placeholder="اكتب رسالة (150 حرفاً)..." 
              className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0 placeholder:text-muted-foreground/50"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              maxLength={150}
            />
            {message.length > 120 && (
              <span className="absolute left-0 text-[8px] text-primary/50 font-bold">
                {150 - message.length}
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full transition-all duration-300 ${message.trim() ? 'text-primary scale-110' : 'text-muted-foreground opacity-50'}`}
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">هل أنت متأكد من حذف المجموعة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف المجموعة وجميع الرسائل بداخلها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-full text-xs h-9">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              className="flex-1 rounded-full text-xs h-9 bg-destructive text-white hover:bg-destructive/90"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
