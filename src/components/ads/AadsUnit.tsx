
"use client"

import React from 'react';

/**
 * HighPerformanceAd - تم إيقاف الوحدات المباشرة (300x250) من الواجهة بناءً على طلب المستخدم.
 * تم استبدالها بنظام الإعلانات الخلفي (Service Worker) لزيادة الأداء ونظافة التصميم.
 * تبقى المكونات موجودة كـ Empty Components لمنع أخطاء الاستيراد في الصفحات الأخرى.
 */
export function HighPerformanceAd() {
  // لا يعرض شيئاً في الواجهة، الإعلانات تعمل الآن عبر sw.js
  return null;
}

export const AadsUnitBanner = () => null;
export const AadsUnit = () => null;
export const AadsUnitSmall = () => null;
export const AadsUnitInside = () => null;

export default HighPerformanceAd;
