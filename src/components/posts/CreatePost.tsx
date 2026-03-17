
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Trash2, Loader2, BarChart2, PlusCircle, MinusCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  const isAdmin = profile?.email === ADMIN_EMAIL;
  const isVerified = profile?.verificationType === 'blue' || profile?.verificationType === 'gold' || isAdmin;
  
  const charLimit = isVerified ? 1500 : 400;
  const imageLimit = isVerified ? 3 : 1;

  const pollStatus = (() => {
    if (!showPoll) return { cost: 0, isFree: true };
    if (isInfiniteAdmin) return { cost: 0, isFree: true, label: 'إدارة تيمقاد' };
    if (isVerified) {
      const lastPollDate = profile?.lastPollCreatedAt ? new Date(profile.lastPollCreatedAt).getTime() : 0;
      const now = new Date().getTime();
      const hoursPassed = (now - lastPollDate) / (1000 * 60 * 60);
      if (hoursPassed >= 24) return { cost: 0, isFree: true, label: 'استطلاع مجاني يومي' };
      return { cost: 2, isFree: false, label: 'تكلفة: 2 عملة' };
    }
    return { cost: 3, isFree: false, label: 'تكلفة: 3 عملات' };
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

  const addOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    } else {
      toast({ description: "الحد الأقصى هو 4 خيارات." });
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handlePost = () => {
    if (!content.trim() && mediaUrls.length === 0 && !showPoll) return;
    if (content.length > charLimit) return toast({ variant: "destructive", description: `تجاوزت الحد (${charLimit} حرف).` });
    if (!db || !user) return;

    if (showPoll) {
      if (!isInfiniteAdmin && !pollStatus.isFree && (profile?.coins || 0) < pollStatus.cost) {
        return toast({ variant: "destructive", title: "الرصيد لا يكفي", description: `تحتاج إلى ${pollStatus.cost} عملات لهذا الاستطلاع.` });
      }
      if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) return toast({ variant: "destructive", description: "يرجى كتابة السؤال وجميع الخيارات." });
    }

    const postData: any = {
      content: content.trim(), 
      authorId: user.uid, 
      authorName: profile?.username || 'مستكشف تيمقاد',
      authorAvatar: profile?.profilePictureUrl || '', 
      createdAt: serverTimestamp(),
      likesCount: 0, 
      commentsCount: 0, 
      repostsCount: 0, 
      viewsCount: 0,
      hashtags: content.match(/#[^\s#]+/g) || [], 
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      email: user.email, 
      authorVerificationType: profile?.verificationType || (isAdmin ? 'blue' : 'none')
    };

    if (showPoll) {
      postData.poll = { 
        question: pollQuestion.trim(), 
        options: pollOptions.map(opt => ({ text: opt.trim(), votes: 0 })), 
        totalVotes: 0, 
        expiresAt: new Date(Date.now() + 86400000).toISOString() 
      };
      
      if (!isInfiniteAdmin) {
        if (!pollStatus.isFree) updateDocumentNonBlocking(doc(db, 'users', user.uid), { coins: increment(-pollStatus.cost) });
        else if (isVerified) updateDocumentNonBlocking(doc(db, 'users', user.uid), { lastPollCreatedAt: new Date().toISOString() });
      }
    }

    addDocumentNonBlocking(collection(db, 'posts'), postData);
    toast({ title: "تم النشر بنجاح في تيمقاد!" });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden text-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b h-12 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-8 w-8 p-0 rounded-full hover:bg-secondary">
          <X size={18} />
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[11px] text-primary uppercase tracking-wider">منشور جديد</span>
          <span className={cn("text-[8px] font-bold", content.length > charLimit * 0.9 ? "text-destructive" : "text-muted-foreground")}>
            {content.length} / {charLimit}
          </span>
        </div>
        <Button 
          onClick={handlePost} 
          disabled={isUploading || (content.length === 0 && mediaUrls.length === 0 && !showPoll)} 
          className="h-8 bg-primary text-white px-6 rounded-full font-bold text-[11px] shadow-sm hover:bg-primary/90 transition-all"
        >
          نشر
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border border-muted/20">
            <AvatarImage src={profile?.profilePictureUrl} />
            <AvatarFallback className="font-bold">{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <Textarea 
              placeholder="ماذا يدور في ذهنك يا بطل تيمقاد؟" 
              className="min-h-[120px] resize-none border-none p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 leading-relaxed" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              autoFocus 
            />
          </div>
        </div>

        {/* Dynamic Poll Section */}
        <AnimatePresence>
          {showPoll && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden shadow-inner">
                <div className="bg-primary/10 p-3 flex justify-between items-center border-b border-primary/10">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">استطلاع رأي تيمقاد</span>
                  </div>
                  <Badge variant={pollStatus.isFree ? "secondary" : "default"} className="text-[8px] h-5 rounded-full px-2 bg-primary/20 text-primary border-none">
                    {pollStatus.label}
                  </Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground mr-1">السؤال</label>
                    <Input 
                      placeholder="عن ماذا تود أن تسأل؟" 
                      className="h-10 text-xs bg-background border-none shadow-sm rounded-lg" 
                      value={pollQuestion} 
                      onChange={(e) => setPollQuestion(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-muted-foreground mr-1">الخيارات</label>
                    {pollOptions.map((option, i) => (
                      <div key={i} className="flex gap-2 items-center group">
                        <div className="flex-1 relative">
                          <Input 
                            placeholder={`الخيار ${i + 1}`} 
                            className="h-9 text-[11px] bg-background border-none shadow-sm pr-8 rounded-lg" 
                            value={option} 
                            onChange={(e) => updateOption(i, e.target.value)} 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-primary/30">
                            {i + 1}
                          </span>
                        </div>
                        {pollOptions.length > 2 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/5 rounded-full"
                            onClick={() => removeOption(i)}
                          >
                            <MinusCircle size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 4 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full h-9 border-2 border-dashed border-primary/10 text-primary hover:bg-primary/5 rounded-lg text-[10px] font-bold gap-2"
                      onClick={addOption}
                    >
                      <PlusCircle size={14} />
                      إضافة خيار إضافي
                    </Button>
                  )}
                </div>
                
                <div className="bg-secondary/30 p-2 text-center border-t border-primary/5">
                  <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-1">
                    <Info size={10} />
                    ينتهي الاستطلاع تلقائياً بعد 24 ساعة من نشره.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Preview */}
        <div className="grid grid-cols-1 gap-3">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border shadow-sm">
              <img src={url} alt="Preview" className="w-full h-auto object-cover max-h-[300px]" />
              <button 
                onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} 
                className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-all backdrop-blur-sm"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {isUploading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 bg-secondary/20 rounded-xl border border-dashed animate-pulse">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">جاري رفع وسائط تيمقاد...</span>
          </div>
        )}
      </div>

      {/* Footer Toolbar */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-2 pb-safe">
        <input 
          type="file" 
          accept="image/*" 
          multiple={isVerified} 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 flex-col h-14 gap-1 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl"
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
          >
            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <span className="text-[8px] font-bold uppercase">الصور</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "flex-1 flex-col h-14 gap-1 transition-all rounded-xl",
              showPoll ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            )} 
            onClick={() => setShowPoll(!showPoll)}
          >
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", showPoll ? "bg-primary/10" : "bg-primary/5")}>
              <BarChart2 size={18} />
            </div>
            <span className="text-[8px] font-bold uppercase">استطلاع</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 flex-col h-14 gap-1 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl"
            onClick={() => {
              const hash = ' #';
              if (!content.endsWith(hash)) setContent(content + hash);
            }}
          >
            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
              <Hash size={18} />
            </div>
            <span className="text-[8px] font-bold uppercase">وسم</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
