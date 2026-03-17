
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Trash2, Loader2, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  const isAdmin = profile?.email === 'adelbenmaza8@gmail.com';
  const isVerified = profile?.verificationType === 'blue' || profile?.verificationType === 'gold' || isAdmin;
  
  const charLimit = isVerified ? 1500 : 400;
  const imageLimit = isVerified ? 3 : 1;

  const pollStatus = (() => {
    if (!showPoll) return { cost: 0, isFree: true };
    if (isVerified) {
      const lastPollDate = profile?.lastPollCreatedAt ? new Date(profile.lastPollCreatedAt).getTime() : 0;
      const now = new Date().getTime();
      const hoursPassed = (now - lastPollDate) / (1000 * 60 * 60);
      if (hoursPassed >= 24) return { cost: 0, isFree: true };
      return { cost: 2, isFree: false };
    }
    return { cost: 3, isFree: false };
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (mediaUrls.length + files.length > imageLimit) {
      toast({ variant: "destructive", description: isVerified ? "3 صور كحد أقصى للموثقين." : "صورة واحدة كحد أقصى للمستكشفين." });
      return;
    }
    setIsUploading(true);
    try {
      const newUrls = [...mediaUrls];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToCloudinary(files[i]);
        newUrls.push(url);
      }
      setMediaUrls(newUrls);
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ في الرفع", description: error.message });
    } finally { setIsUploading(false); }
  };

  const handlePost = () => {
    if (!content.trim() && mediaUrls.length === 0 && !showPoll) return;
    if (content.length > charLimit) return toast({ variant: "destructive", description: `تجاوزت الحد (${charLimit} حرف).` });
    if (!db || !user) return;

    if (showPoll) {
      if (!pollStatus.isFree && (profile?.coins || 0) < pollStatus.cost) {
        return toast({ variant: "destructive", title: "الرصيد لا يكفي", description: `تحتاج إلى ${pollStatus.cost} عملات.` });
      }
      if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) return toast({ variant: "destructive", description: "أكمل بيانات الاستطلاع." });
    }

    const postData: any = {
      content: content.trim(), authorId: user.uid, authorName: profile?.username || 'مستكشف تيمقاد',
      authorAvatar: profile?.profilePictureUrl || '', createdAt: serverTimestamp(),
      likesCount: 0, commentsCount: 0, repostsCount: 0, viewsCount: 0,
      hashtags: content.match(/#[^\s#]+/g) || [], mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      email: user.email, authorVerificationType: profile?.verificationType || (isAdmin ? 'blue' : 'none')
    };

    if (showPoll) {
      postData.poll = { question: pollQuestion.trim(), options: pollOptions.map(opt => ({ text: opt.trim(), votes: 0 })), totalVotes: 0, expiresAt: new Date(Date.now() + 86400000).toISOString() };
      if (!pollStatus.isFree) updateDocumentNonBlocking(doc(db, 'users', user.uid), { coins: increment(-pollStatus.cost) });
      else if (isVerified) updateDocumentNonBlocking(doc(db, 'users', user.uid), { lastPollCreatedAt: new Date().toISOString() });
    }

    addDocumentNonBlocking(collection(db, 'posts'), postData);
    toast({ title: "تم النشر!" });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b h-10">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-7 w-7 p-0"><X size={16} /></Button>
        <div className="flex flex-col items-center"><span className="font-bold text-[10px] text-primary">منشور جديد</span><span className="text-[8px]">{content.length}/{charLimit}</span></div>
        <Button onClick={handlePost} disabled={isUploading} className="h-7 bg-primary text-white px-5 rounded-full font-bold text-[10px]">نشر</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9"><AvatarImage src={profile?.profilePictureUrl} /><AvatarFallback>{profile?.username?.[0]}</AvatarFallback></Avatar>
          <Textarea placeholder="ماذا يدور في ذهنك؟" className="min-h-[100px] resize-none border-none p-0 text-sm" value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
        </div>
        {showPoll && (
          <div className="bg-primary/5 p-4 border border-primary/10 space-y-3">
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold">{pollStatus.isFree ? 'استطلاع مجاني' : `التكلفة: ${pollStatus.cost} عملات`}</span><Button variant="ghost" size="icon" onClick={() => setShowPoll(false)}><X size={12} /></Button></div>
            <Input placeholder="سؤال الاستطلاع..." className="h-8 text-xs bg-background" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
            {pollOptions.map((option, i) => (
              <div key={i} className="flex gap-2"><Input placeholder={`خيار ${i + 1}`} className="h-8 text-[11px] bg-background" value={option} onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} /></div>
            ))}
          </div>
        )}
        {mediaUrls.map((url, i) => (
          <div key={i} className="relative group bg-secondary/20 rounded-lg overflow-hidden border">
            <img src={url} alt="Preview" className="w-full h-auto" />
            <button onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-full"><X size={14} /></button>
          </div>
        ))}
        {isUploading && <div className="flex items-center justify-center py-4 gap-2 text-[10px] text-muted-foreground animate-pulse"><Loader2 size={12} className="animate-spin" /> جاري الرفع...</div>}
      </div>
      <div className="border-t p-2">
        <input type="file" accept="image/*" multiple={isVerified} hidden ref={fileInputRef} onChange={handleFileChange} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex-1 flex-col h-12 gap-1" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><ImageIcon size={18} /><span className="text-[8px]">معرض الصور</span></Button>
          <Button variant="ghost" size="sm" className={`flex-1 flex-col h-12 gap-1 ${showPoll ? 'text-primary' : ''}`} onClick={() => setShowPoll(!showPoll)}><BarChart2 size={18} /><span className="text-[8px]">استطلاع</span></Button>
          <Button variant="ghost" size="sm" className="flex-1 flex-col h-12 gap-1" onClick={() => setContent(content + ' #')}><Hash size={18} /><span className="text-[8px]">وسم</span></Button>
        </div>
      </div>
    </div>
  );
}
