
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Plus, Trash2, Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface CreatePostProps {
  onSuccess?: () => void;
}

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (mediaUrls.length + files.length > imageLimit) {
      toast({ 
        variant: "destructive", 
        description: isVerified 
          ? "يمكنك رفع 3 صور كحد أقصى للحسابات الموثقة." 
          : "يمكنك رفع صورة واحدة فقط للحسابات العادية. وثق حسابك لرفع المزيد!" 
      });
      return;
    }
    setIsUploading(true);
    const newMediaUrls: string[] = [...mediaUrls];
    try {
      for (let i = 0; i < files.length; i++) {
        const compressedData = await compressImage(files[i], 1200, 1200, 0.7);
        newMediaUrls.push(compressedData);
      }
      setMediaUrls(newMediaUrls);
    } catch (error) {
      toast({ variant: "destructive", description: "فشل في معالجة بعض الصور." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handlePost = () => {
    if (!content.trim() && mediaUrls.length === 0 && !showPoll) return;
    if (content.length > charLimit) {
      toast({ variant: "destructive", description: `لقد تجاوزت الحد المسموح به (${charLimit} حرف).` });
      return;
    }
    if (!db || !user) return;

    // قيود الاستطلاع
    if (showPoll) {
      if (!isVerified) {
        toast({ variant: "destructive", description: "عذراً، ميزة الاستطلاعات متاحة للحسابات الموثقة فقط." });
        return;
      }

      // التحقق من مرور 24 ساعة
      if (profile?.lastPollCreatedAt) {
        const lastDate = new Date(profile.lastPollCreatedAt).getTime();
        const now = new Date().getTime();
        const hoursPassed = (now - lastDate) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          toast({ 
            variant: "destructive", 
            description: `يمكنك إنشاء استطلاع واحد كل 24 ساعة. تبقى لك حوالي ${Math.ceil(24 - hoursPassed)} ساعة.` 
          });
          return;
        }
      }

      if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
        toast({ variant: "destructive", description: "يرجى إكمال بيانات الاستطلاع." });
        return;
      }
    }

    const postData: any = {
      content: content.trim(),
      authorId: user.uid,
      authorName: profile?.username || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 0,
      hashtags: content.match(/#[^\s#]+/g) || [],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      mediaType: mediaUrls.length > 0 ? 'image' : null,
      email: user.email,
      authorVerificationType: profile?.verificationType || (isAdmin ? 'blue' : 'none')
    };

    if (showPoll) {
      postData.poll = {
        question: pollQuestion.trim(),
        options: pollOptions.map(opt => ({ text: opt.trim(), votes: 0 })),
        totalVotes: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // ينتهي بعد 24 ساعة
      };
      // تحديث وقت آخر استطلاع
      updateDocumentNonBlocking(doc(db, 'users', user.uid), {
        lastPollCreatedAt: new Date().toISOString()
      });
    }

    addDocumentNonBlocking(collection(db, 'posts'), postData);
    toast({ title: "تم النشر!", description: "تم نشر منشورك بنجاح." });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-background w-full h-full animate-in slide-in-from-bottom duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-20 h-10">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-7 w-7 rounded-full p-0">
          <X size={16} />
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[10px] text-primary">منشور جديد</span>
          <span className={`text-[8px] font-bold ${content.length > charLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {content.length} / {charLimit} حرف
          </span>
        </div>
        <Button 
          onClick={handlePost} 
          disabled={(!content.trim() && mediaUrls.length === 0 && !showPoll) || isUploading || content.length > charLimit} 
          className="h-7 bg-primary text-white px-5 rounded-full font-bold text-[10px]"
        >
          نشر
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 rounded-full border">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="ماذا يدور في ذهنك؟" 
              className={`min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-sm bg-transparent placeholder:text-muted-foreground/40 ${content.length > charLimit ? 'text-destructive' : ''}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {showPoll && (
          <div className="bg-secondary/20 p-4 border border-primary/10 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary">إنشاء استطلاع</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowPoll(false)}>
                <X size={12} />
              </Button>
            </div>
            <Input 
              placeholder="سؤال الاستطلاع..." 
              className="h-8 text-xs bg-background border-none rounded-none"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <div className="space-y-2">
              {pollOptions.map((option, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input 
                    placeholder={`خيار ${i + 1}`} 
                    className="h-8 text-[11px] bg-background border-none rounded-none"
                    value={option}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                      <Trash2 size={12} className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <Button variant="outline" size="sm" className="h-7 w-full text-[10px] rounded-none border-dashed border-primary/30" onClick={handleAddOption}>
                  + إضافة خيار
                </Button>
              )}
            </div>
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-full group bg-secondary/20 rounded-lg overflow-hidden border">
                <img src={url} alt="Preview" className="w-full h-auto block" />
                <button onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-full">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && <div className="flex items-center justify-center py-4 gap-2 text-[10px] text-muted-foreground"><Loader2 size={12} className="animate-spin" /> جاري التحضير...</div>}
      </div>

      <div className="border-t bg-background p-2 pb-safe">
        <input type="file" accept="image/*" multiple={isVerified} hidden ref={fileInputRef} onChange={handleFileChange} />
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" size="sm" className="flex-1 flex-col h-12 gap-1 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || mediaUrls.length >= imageLimit}
          >
            <ImageIcon size={18} />
            <span className="text-[8px]">معرض الصور ({mediaUrls.length}/{imageLimit})</span>
          </Button>
          
          <Button 
            variant="ghost" size="sm" className={`flex-1 flex-col h-12 gap-1 ${showPoll ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => {
              if (!isVerified) {
                toast({ description: "الاستطلاعات متاحة للحسابات الموثقة فقط." });
                return;
              }
              setShowPoll(!showPoll);
            }}
          >
            <BarChart2 size={18} />
            <span className="text-[8px]">استطلاع</span>
          </Button>

          <Button 
            variant="ghost" size="sm" className="flex-1 flex-col h-12 gap-1 text-muted-foreground"
            onClick={() => !content.includes('#') && setContent(content + ' #')}
          >
            <Hash size={18} />
            <span className="text-[8px]">وسم</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
