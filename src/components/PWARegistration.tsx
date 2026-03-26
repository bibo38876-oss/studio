
'use client';

import { useEffect } from 'react';

/**
 * PWARegistration - يقوم بتسجيل الـ Service Worker الجديد الخاص بالنظام والإعلانات.
 */
export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // تسجيل ملف sw.js الجديد الذي يحتوي على إعدادات الإعلانات الجديدة
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Timgad Service Worker (Ads System) registered:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
