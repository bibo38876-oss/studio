export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
  hashtags?: string[];
}

export const CURRENT_USER: User = {
  id: 'me',
  name: 'أحمد العتيبي',
  handle: '@ahmed_otb',
  avatar: 'https://picsum.photos/seed/me/200/200',
  bio: 'مهتم بالتقنية والتواصل الاجتماعي. أحب بناء المجتمعات.',
  followers: 1240,
  following: 580,
};

export const MOCK_USERS: User[] = [
  {
    id: 'user1',
    name: 'سارة خالد',
    handle: '@sara_k',
    avatar: 'https://picsum.photos/seed/user1/200/200',
    bio: 'كاتبة ومصورة فوتوغرافية.',
    followers: 850,
    following: 420,
  },
  {
    id: 'user2',
    name: 'محمد علي',
    handle: '@m_ali',
    avatar: 'https://picsum.photos/seed/user2/200/200',
    bio: 'مطور برمجيات وشغوف بالذكاء الاصطناعي.',
    followers: 2100,
    following: 110,
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post1',
    userId: 'user1',
    content: 'صباح الخير جميعاً! يوم جميل للبدء بمشروع جديد ☕️✨',
    timestamp: 'منذ ساعتين',
    likes: 42,
    hashtags: ['#صباح_الخير', '#بداية_جديدة'],
  },
  {
    id: 'post2',
    userId: 'user2',
    content: 'الذكاء الاصطناعي يغير طريقة تواصلنا بشكل مذهل. هل أنتم مستعدون للمستقبل؟',
    timestamp: 'منذ 5 ساعات',
    likes: 128,
    hashtags: ['#ذكاء_اصطناعي', '#تقنية'],
  },
];
