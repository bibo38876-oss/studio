
"use client"

import { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, where, doc, arrayUnion, arrayRemove, limit, updateDoc } from 'firebase/firestore';
import { Loader2, Plus, MessageSquare, Users, ChevronLeft, Check, X, Bell, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { motion } from 'framer-motion';

export default function GroupsPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  // جلب المجموعات
  const myGroupsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'groups'), where('creatorId', '==', user.uid));
  }, [firestore, user]);

  const joinedGroupsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'groups'), where('members', 'array-contains', user.uid));
  }, [firestore, user]);

  const invitesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'groupInvites'), where('status', '==', 'pending'));
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(30));
  }, [firestore]);

  const { data: myGroups, isLoading: isMyGroupsLoading } = useCollection(myGroupsQuery);
  const { data: joinedGroups, isLoading: isJoinedLoading } = useCollection(joinedGroupsQuery);
  const { data: invites, isLoading: isInvitesLoading } = useCollection(invitesQuery);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  const hasGroup = myGroups && myGroups.length > 0;

  // خوارزمية الاقتراحات العادلة والذكية
  const suggestedUsers = useMemo(() => {
    if (!allUsers || !user) return [];
    
    const others = allUsers.filter(u => u.id !== user.uid);
    const adminAccount = others.find(u => u.email === ADMIN_EMAIL);
    const restOfUsers = others.filter(u => u.email !== ADMIN_EMAIL);
    
    // خلط بقية المستخدمين لضمان العدالة في الظهور وتكافؤ فرص المتابعة
    const shuffledRest = [...restOfUsers].sort(() => Math.random() - 0.5);
    
    const result = adminAccount ? [adminAccount, ...shuffledRest] : shuffledRest;
    return result.slice(0, 10);
  }, [allUsers, user?.uid]);

  const handleCreateGroup = () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }
    if (hasGroup) {
      toast({ variant: "destructive", description: "يمكنك إنشاء مجموعة واحدة فقط." });
      return;
    }
    if (!groupName.trim() || !firestore) return;

    addDocumentNonBlocking(collection(firestore, 'groups'), {
      name: groupName.trim(),
      description: groupDesc.trim(),
      creatorId: user.uid,
      createdAt: serverTimestamp(),
      members: [user.uid],
      membersCount: 1
    });

    setIsCreateOpen(false);
    setGroupName('');
    setGroupDesc('');
    toast({ description: "تم إنشاء مجموعتك بنجاح." });
  };

  const handleFollow = (targetId: string, isFollowing: boolean) => {
    if (!firestore || !user) return;
    const curUserRef = doc(firestore, 'users', user.uid);
    const targetUserRef = doc(firestore, 'users', targetId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(user.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(user.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetId, 'notifications'), {
        type: 'follow',
        fromUserId: user.uid,
        fromUsername: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b flex justify-between items-center">
          <h1 className="text-sm font-bold text-primary">مجموعات الدردشة</h1>
          {!hasGroup && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 px-3">
                  <Plus size={12} />
                  إنشاء مجموعتي
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold">إنشاء مجموعة (واحدة فقط)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">اسم المجموعة</label>
                    <Input 
                      value={groupName} 
                      onChange={(e) => setGroupName(e.target.value)} 
                      placeholder="مثال: نقاشات تقنية"
                      className="h-9 rounded-none bg-secondary/30 border-none text-xs" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">الوصف</label>
                    <Input 
                      value={groupDesc} 
                      onChange={(e) => setGroupDesc(e.target.value)} 
                      placeholder="عن ماذا تتحدث هذه المجموعة؟"
                      className="h-9 rounded-none bg-secondary/30 border-none text-xs" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full rounded-full font-bold text-xs h-9" onClick={handleCreateGroup}>إنشاء الآن</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {invites && invites.length > 0 && (
          <div className="p-4 bg-primary/5 border-b">
            <h2 className="text-[10px] font-bold text-primary mb-3 flex items-center gap-1.5">
              <Bell size={12} />
              دعوات انضمام معلقة
            </h2>
            <div className="space-y-2">
              {invites.map((invite: any) => (
                <Card key={invite.id} className="border-none shadow-none rounded-none bg-card">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">{invite.groupName}</span>
                      <span className="text-[8px] text-muted-foreground">دعوة من: {invite.invitedBy}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-green-50 text-green-600 hover:bg-green-100" onClick={() => updateDocumentNonBlocking(doc(firestore!, 'groups', invite.groupId), { members: arrayUnion(user!.uid), membersCount: (invite.currentMembersCount || 0) + 1 })}>
                        <Check size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-red-50 text-red-600 hover:bg-red-100" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'users', user!.uid, 'groupInvites', invite.id))}>
                        <X size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* قسم الاقتراحات العادلة والذكية */}
        {!isUsersLoading && suggestedUsers.length > 0 && (
          <div className="bg-card border-b py-6 px-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                <h2 className="text-xs font-bold text-primary uppercase tracking-tight">اكتشف أشخاصاً جدد</h2>
              </div>
              <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest">خوارزمية العدالة الذكية</span>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth">
              {suggestedUsers.map((u) => {
                const isFollowing = currentUserProfile?.followingIds?.includes(u.id);
                const isManagement = u.email === ADMIN_EMAIL;
                
                return (
                  <motion.div 
                    key={u.id} 
                    whileHover={{ y: -2 }}
                    className="flex flex-col items-center gap-2 min-w-[110px] p-3 bg-secondary/20 rounded-none border border-transparent hover:border-primary/10 transition-all group"
                  >
                    <Link href={`/profile/${u.id}`} className="relative">
                      <Avatar className="h-14 w-14 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage src={u.profilePictureUrl} />
                        <AvatarFallback className="font-bold text-lg">{u.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedBadge type={isManagement ? 'blue' : (u.verificationType || 'none')} size={14} />
                      </div>
                    </Link>
                    <div className="flex flex-col items-center text-center gap-0.5">
                      <span className="text-[10px] font-bold text-primary truncate max-w-[90px]">{u.username}</span>
                      <span className="text-[7px] text-muted-foreground truncate max-w-[90px]">@{u.email?.split('@')[0]}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isFollowing ? "outline" : "default"} 
                      className="h-6 w-full text-[8px] font-bold rounded-full px-0 gap-1"
                      onClick={() => handleFollow(u.id, !!isFollowing)}
                    >
                      {isFollowing ? <UserCheck size={10} /> : <UserPlus size={10} />}
                      {isFollowing ? 'متابع' : 'متابعة'}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {(isMyGroupsLoading || isJoinedLoading) ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-muted">
            {hasGroup && myGroups?.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-none flex items-center justify-center text-primary border border-primary/20">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary group-hover:underline">{group.name}</span>
                      <span className="text-[7px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">مجموعتي</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{group.description || 'لا يوجد وصف.'}</span>
                    <span className="text-[8px] text-muted-foreground mt-1">{group.membersCount || 0}/100 عضو</span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-muted-foreground/30" />
              </Link>
            ))}

            {joinedGroups?.filter(g => g.creatorId !== user?.uid).map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-secondary rounded-none flex items-center justify-center text-muted-foreground">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary group-hover:underline">{group.name}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{group.description || 'لا يوجد وصف.'}</span>
                    <span className="text-[8px] text-muted-foreground mt-1">{group.membersCount || 0}/100 عضو</span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-muted-foreground/30" />
              </Link>
            ))}

            {(!hasGroup && (!joinedGroups || joinedGroups.length === 0)) && (
              <div className="text-center py-32 px-10 flex flex-col items-center">
                <MessageSquare size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-xs font-bold">لا توجد مجموعات بعد.</p>
                <p className="text-[9px] text-muted-foreground mt-1">أنشئ مجموعتك الخاصة وابدأ بدعوة أصدقائك.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
