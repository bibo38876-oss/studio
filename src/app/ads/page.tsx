
"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, increment, serverTimestamp, orderBy } from 'firebase/firestore';
import { Loader2, ChevronRight, Play, Eye, Sparkles, DollarSign, Wallet, Plus, ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export default function AdsPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isProcessing, setIsPosting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adImage, setAdImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ads'), where('remainingClicks', '>', 0), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: ads, isLoading } = useCollection(adsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setAdImage(url);
      toast({ description: "تم رفع صورة الإعلان بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل رفع الصورة." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAd = async () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }

    if ((profile?.coins || 0) < 100) {
      toast({ variant: "destructive", title: "رصيدك غير كافٍ", description: "تحتاج إلى 100 عملة لنشر قصة إعلانية." });
      return;
    }

    if (!adTitle || !adLink || !adImage) {
      toast({ variant: "destructive", description: "يرجى ملء جميع الحقول المطلوبة." });
      return;
    }

    setIsPosting(true);
    try {
      updateDocumentNonBlocking(doc(firestore!, 'users', user.uid), {
        coins: increment(-100)
      });

      await addDocumentNonBlocking(collection(firestore!, 'ads'), {
        authorId: user.uid,
        title: adTitle,
        description: adDesc,
        link: adLink,
        imageUrl: adImage,
        totalClicks: 100,
        remainingClicks: 100,
        createdAt: serverTimestamp()
      });

      // تسجيل ربح المنصة (مبدئياً 100 عملة سيتم توزيعها)
      addDocumentNonBlocking(collection(firestore!, 'platform_revenue'), {
        type: 'ad_creation',
        amount: 100,
        fromUserId: user.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "تم النشر! 🚀", description: "إعلانك نشط الآن في سوق تيمقاد." });
      setIsCreateOpen(false);
      setAdTitle(''); setAdDesc(''); setAdLink(''); setAdImage(null);
    } catch (error) {
      toast({ variant: "destructive", description: "حدث خطأ أثناء النشر." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleAdClick = async (ad: any) => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }

    if (isProcessing) return;

    const clickRef = doc(firestore!, 'adClicks', `${ad.id}_${user.uid}`);
    
    setIsPosting(true);
    try {
      await setDocumentNonBlocking(clickRef, {
        userId: user.uid,
        adId: ad.id,
        clickedAt: serverTimestamp(),
        earned: 0.6
      }, { merge: false });

      updateDocumentNonBlocking(doc(firestore!, 'ads', ad.id), {
        remainingClicks: increment(-1)
      });

      // توزيع الأرباح: 60% للمستخدم، 40% للمنصة
      updateDocumentNonBlocking(doc(firestore!, 'users', user.uid), {
        coins: increment(0.6)
      });

      addDocumentNonBlocking(collection(firestore!, 'platform_revenue'), {
        type: 'ad_click_commission',
        amount: 0.4,
        fromAdId: ad.id,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "مبروك! 🎉", description: "حصلت على 0.6 عملة مقابل مشاهدة الإعلان." });
      window.open(ad.link, '_blank');
      setSelectedAd(null);
    } catch (error) {
      toast({ variant: "destructive", description: "لا يمكنك الربح من هذا الإعلان مجدداً." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0">
        <header className="flex items-center justify-between mb-8 sticky top-10 z-30 bg-background/80 backdrop-blur-md py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
              <ChevronRight size={20} />
            </Button>
            <div className="flex flex-col text-right">
              <h1 className="text-sm font-bold text-primary">سوق القصص والأرباح</h1>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">اربح 0.6 عملة عن كل مشاهدة</span>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 rounded-full bg-accent hover:bg-accent/90 text-white text-[10px] font-bold gap-1.5 shadow-lg shadow-accent/20">
                <Plus size={14} />
                انشر قصتك (100 عملة)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-primary">إنشاء قصة إعلانية (100 نقرة)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">عنوان الإعلان</label>
                  <Input placeholder="مثال: خصم 50% على خدماتنا" className="h-10 text-xs rounded-none bg-secondary/30 border-none" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">رابط المعلن</label>
                  <Input placeholder="https://example.com" className="h-10 text-xs rounded-none bg-secondary/30 border-none" value={adLink} onChange={(e) => setAdLink(e.target.value)} />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">صورة القصة</label>
                  <div className="h-32 bg-secondary/30 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    {adImage ? <img src={adImage} className="w-full h-full object-cover" alt="Preview" /> : <ImageIcon size={24} className="text-muted-foreground/40" />}
                  </div>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-10 rounded-full font-bold text-xs" onClick={handleCreateAd} disabled={isPosting || isUploading}>
                  {isPosting ? <Loader2 className="animate-spin" /> : "تأكيد والنشر الآن"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[9/16] bg-secondary/30 animate-pulse rounded-lg" />)}
          </div>
        ) : ads && ads.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {ads.map((ad: any) => (
              <Dialog key={ad.id}>
                <DialogTrigger asChild>
                  <div className="aspect-[9/16] bg-secondary/20 rounded-lg overflow-hidden relative cursor-pointer group" onClick={() => setSelectedAd(ad)}>
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-right">
                      <p className="text-[10px] font-bold text-white line-clamp-1">{ad.title}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[8px] font-bold text-green-400">0.6</span>
                        <TimgadCoin size={10} />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="p-0 overflow-hidden border-none max-w-sm">
                  <div className="relative aspect-[9/16] w-full">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-6 flex flex-col justify-end gap-4">
                      <div className="space-y-2 text-right text-white">
                        <h2 className="text-xl font-bold">{ad.title}</h2>
                        <p className="text-xs opacity-70">{ad.description}</p>
                      </div>
                      <Button className="w-full h-12 rounded-full bg-primary font-bold gap-2" onClick={() => handleAdClick(ad)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : <>انقر واربح 0.6 <TimgadCoin size={16} /></>}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 opacity-40">لا توجد قصص إعلانية حالياً.</div>
        )}
      </main>
    </div>
  );
}
