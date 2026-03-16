
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, Users, MoreVertical, Trash2 } from 'lucide-react';
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

export default function GroupChatPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [message, setMessage] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groups', id);
  }, [firestore, id]);

  const { data: group, isLoading: isGroupLoading } = useDoc(groupRef);

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

    const content = message.trim();
    setMessage('');

    addDocumentNonBlocking(collection(firestore, 'groups', id, 'messages'), {
      content: content,
      senderId: user.uid,
      senderName: user.displayName || 'مستخدم تواصل',
      createdAt: serverTimestamp(),
    });
  };

  const handleDeleteGroup = () => {
    if (!firestore || !id || !isCreator) return;
    
    deleteDocumentNonBlocking(doc(firestore, 'groups', id));
    toast({
      title: "تم الحذف",
      description: "تم حذف المجموعة نهائياً.",
    });
    router.push('/groups');
  };

  if (isGroupLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="fixed top-7 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b flex items-center justify-between p-2 h-10 container max-w-xl mx-auto">
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
              <span className="text-[8px] text-muted-foreground">دردشة جماعية</span>
            </div>
          </div>
        </div>

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

      <main 
        className="flex-1 overflow-y-auto pt-20 pb-20 px-4 container max-w-xl mx-auto flex flex-col gap-3 scroll-smooth" 
        ref={scrollRef}
      >
        {isMessagesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'self-end' : 'self-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                {!isMe && <span className="text-[8px] text-muted-foreground mb-0.5 ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-2 text-xs leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-card border text-foreground rounded-r-xl rounded-tl-xl'}`}>
                  {msg.content}
                </div>
                <span className="text-[7px] text-muted-foreground mt-1 px-1">
                  {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar }) : 'الآن'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-[10px] text-muted-foreground font-medium">ابدأ الدردشة في هذه المجموعة!</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-2 container max-w-xl mx-auto h-12">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-full group focus-within:bg-secondary transition-colors">
          <Input 
            placeholder="اكتب رسالة..." 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full placeholder:text-muted-foreground/50"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
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
