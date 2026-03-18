
"use client"

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Hash, Trash2, Loader2, BarChart2, PlusCircle, Info, Camera, Sparkles, ChevronRight } from 'lucide-react';
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
  const [pollOptions, setPollOptions] = useState([
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' }
  ]);
  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionImageRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const isAdmin = profile?.email === ADMIN_EMAIL;
  const isVerified = profile?.verificationType === 'blue' || profile?.verificationType === 'gold' || isAdmin;
  
  const charLimit = isVerified ? 1500 : 400;
  const imageLimit = isVerified ? 3 : 1;

  const pollStatus = (() => {
    if (!showPoll) return { cost: 0, isFree: true };
    if (isAdmin) return { cost: 0, isFree: true, label: 'إدارة تيمقاد' };
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

  const handleOptionImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isVerified) return;

    setUploadingOptionIdx(index);
    try {
      const url = await uploadImageToCloudinary(file);
      const newOptions = [...pollOptions];
      newOptions[index].imageUrl = url;
      setPollOptions(newOptions);
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل الرفع", description: error.message });
    } finally {
      setUploadingOptionIdx(null);
    }
  };

  const addOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, { text: '', imageUrl: '' }]);
    } else {
      toast({ description: "الحد الأقصى هو 4 خيارات." });
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updateOptionText = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index].text = value;
    setPollOptions(newOptions);
  };

  const handlePost = async () => {
    if (isPosting) return;
    if (!content.trim() && mediaUrls.length === 0 && !showPoll) return;
    if (content.length > charLimit) return toast({ variant: "destructive", description: `تجاوزت الحد (${charLimit} حرف).` });
    if (!db || !user) return;

    if (showPoll) {
      if (!isAdmin && !pollStatus.isFree && (profile?.coins || 0) < pollStatus.cost) {
        return toast({ variant: "destructive", title: "رصيد غير كافٍ", description: `تحتاج إلى ${pollStatus.cost} عملات لهذا الاستطلاع.` });
      }
      if (!pollQuestion.trim() || pollOptions.some(opt => !opt.text.trim())) return toast({ variant: "destructive", description: "يرجى كتابة السؤال وجميع الخيارات." });
    }

    setIsPosting(true);
    try {
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
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
        email: user.email, 
        authorVerificationType: profile?.verificationType || (isAdmin ? 'blue' : 'none')
      };

      if (showPoll) {
        postData.poll = { 
          question: pollQuestion.trim(), 
          options: pollOptions.map(opt => ({ 
            text: opt.text.trim(), 
            imageUrl: opt.imageUrl || '', 
            votes: 0 
          })), 
          totalVotes: 0, 
          expiresAt: new Date(Date.now() + 86400000).toISOString() 
        };
        
        if (!isAdmin) {
          if (!pollStatus.isFree) updateDocumentNonBlocking(doc(db, 'users', user.uid), { coins: increment(-pollStatus.cost) });
          else if (isVerified) updateDocumentNonBlocking(doc(db, 'users', user.uid), { lastPollCreatedAt: new Date().toISOString() });
        }
      }

      await addDocumentNonBlocking(collection(db, 'posts'), postData);
      toast({ title: "تم النشر بنجاح في تيمقاد!" });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل النشر", description: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden text-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1 border-b h-10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-7 w-7 p-0 rounded-full hover:bg-secondary">
          {showPoll ? <ChevronRight size={18} /> : <X size={18} />}
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[10px] text-primary uppercase tracking-widest text-center leading-none">
            {showPoll ? 'استطلاع ملكي' : 'منشور جديد'}
          </span>
          <span className={cn("text-[7px] font-bold mt-0.5", content.length > charLimit * 0.9 ? "text-destructive" : "text-muted-foreground")}>
            {content.length} / {charLimit}
          </span>
        </div>
        <Button 
          onClick={handlePost} 
          disabled={isUploading || isPosting || (content.length === 0 && mediaUrls.length === 0 && !showPoll)} 
          className="h-7 bg-primary text-white px-4 rounded-full font-bold text-[10px] shadow-sm hover:bg-primary/90 transition-all"
        >
          {isPosting ? <Loader2 className="h-3 w-3 animate-spin" /> : (showPoll ? 'إطلاق' : 'نشر')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {!showPoll ? (
          <>
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 border border-primary/10">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback className="font-bold text-md">{profile?.username?.[0] || 'ت'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-1">
                <Textarea 
                  placeholder="ماذا يدور في ذهنك يا بطل تيمقاد؟" 
                  className="min-h-[120px] resize-none border-none p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/40 leading-relaxed text-right font-medium" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  autoFocus 
                />
              </div>
            </div>

            {/* Media Preview */}
            <div className="grid grid-cols-1 gap-3">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-white shadow-md">
                  <img src={url} alt="Preview" className="w-full h-auto object-cover max-h-[300px]" />
                  <button 
                    onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} 
                    className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-all backdrop-blur-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Poll Cost Info */}
            <div className="bg-primary/5 p-3 border border-primary/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-primary">استطلاع تيمقاد</h3>
                  <p className="text-[8px] text-muted-foreground">اجعل مجتمعك يقرر بذكاء.</p>
                </div>
              </div>
              <Badge variant={pollStatus.isFree ? "secondary" : "default"} className="h-6 px-3 rounded-full font-bold text-[8px]">
                {pollStatus.label}
              </Badge>
            </div>

            {/* Question Section */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase mr-1 tracking-widest">سؤال الاستطلاع</label>
              <Textarea 
                placeholder="اطرح تساؤلك العظيم هنا..." 
                className="min-h-[80px] bg-secondary/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-xl p-3 text-xs font-bold text-right resize-none transition-all"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>

            {/* Options Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">خيارات الإجابة</label>
                <span className="text-[8px] text-muted-foreground opacity-60">{pollOptions.length} / 4</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {pollOptions.map((option, i) => (
                  <div key={i} className="group relative bg-secondary/20 rounded-xl p-2.5 border border-transparent focus-within:border-primary/20 transition-all flex items-center gap-2">
                    <div className="flex-1">
                      <Input 
                        placeholder={`الخيار ${i + 1}`}
                        className="h-8 border-none bg-transparent focus-visible:ring-0 text-xs font-bold pr-0 text-right"
                        value={option.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                      />
                    </div>

                    {/* Option Image Upload - For Verified Only */}
                    {isVerified && (
                      <div className="shrink-0 flex items-center gap-1.5">
                        {option.imageUrl ? (
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white shadow-sm">
                            <img src={option.imageUrl} className="w-full h-full object-cover" alt="Option" />
                            <button 
                              onClick={() => {
                                const newOpts = [...pollOptions];
                                newOpts[i].imageUrl = '';
                                setPollOptions(newOpts);
                              }}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-lg bg-background shadow-sm text-muted-foreground hover:text-primary transition-all"
                            onClick={() => optionImageRefs.current[i]?.click()}
                            disabled={uploadingOptionIdx !== null}
                          >
                            {uploadingOptionIdx === i ? <Loader2 size={14} className="animate-spin" /> : <Camera size={16} />}
                          </Button>
                        )}
                        <input 
                          type="file" 
                          hidden 
                          accept="image/*"
                          ref={(el) => { optionImageRefs.current[i] = el }}
                          onChange={(e) => handleOptionImageChange(i, e)}
                        />
                      </div>
                    )}

                    {pollOptions.length > 2 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full"
                        onClick={() => removeOption(i)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 4 && (
                <Button 
                  variant="outline" 
                  className="w-full h-10 border border-dashed border-primary/20 rounded-xl font-bold text-[10px] gap-2 text-primary hover:bg-primary/5 transition-all"
                  onClick={addOption}
                >
                  <PlusCircle size={14} />
                  إضافة خيار
                </Button>
              )}
            </div>

            <div className="py-6 text-center">
              <p className="text-[8px] text-muted-foreground italic flex items-center justify-center gap-1.5">
                <Info size={12} className="text-primary/40" />
                الموثقون يمكنهم إضافة صور للخيارات لزيادة جاذبية الاستطلاع.
              </p>
            </div>
          </motion.div>
        )}

        {isUploading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 bg-primary/5 rounded-2xl border border-dashed border-primary/20 animate-pulse">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">جاري الرفع...</span>
          </div>
        )}
      </div>

      {/* Footer Toolbar */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {!showPoll ? (
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <Button 
              variant="secondary" 
              className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px] group transition-all"
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading || isPosting}
            >
              <ImageIcon size={16} className="text-primary" />
              <span>الصور</span>
            </Button>
            
            <Button 
              variant="secondary" 
              className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px] group transition-all"
              onClick={() => setShowPoll(true)}
              disabled={isPosting}
            >
              <BarChart2 size={16} className="text-accent" />
              <span>استطلاع</span>
            </Button>
            
            <Button 
              variant="secondary" 
              className="h-9 w-9 rounded-xl p-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
              disabled={isPosting}
              onClick={() => {
                const hash = ' #';
                if (!content.endsWith(hash)) setContent(content + hash);
              }}
            >
              <Hash size={18} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <Button 
              variant="secondary" 
              className="flex-1 h-9 rounded-xl font-bold text-[10px] gap-2"
              onClick={() => setShowPoll(false)}
              disabled={isPosting}
            >
              <Sparkles size={14} className="text-primary" />
              العودة للمنشور العادي
            </Button>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          multiple={isVerified} 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
}
