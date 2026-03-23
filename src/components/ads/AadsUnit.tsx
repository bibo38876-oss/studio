
"use client"

import React, { useEffect, useRef } from 'react';

/**
 * مكون إعلانات الأداء العالي الجديد (300x250)
 * يستبدل نظام AADS القديم في كافة أنحاء المنصة
 */
export function HighPerformanceAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // التأكد من عدم تكرار حقن السكريبت في نفس المكان
    if (adRef.current && adRef.current.childNodes.length === 0) {
      const script1 = document.createElement('script');
      script1.innerHTML = `
        atOptions = {
          'key' : 'e94da501ef4b01acec6f8588b1253c96',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const script2 = document.createElement('script');
      script2.src = 'https://www.highperformanceformat.com/e94da501ef4b01acec6f8588b1253c96/invoke.js';
      script2.async = true;

      adRef.current.appendChild(script1);
      adRef.current.appendChild(script2);
    }
  }, []);

  return (
    <div className="flex justify-center my-6 overflow-hidden w-full min-h-[250px] bg-primary/[0.02] border-y border-primary/5 py-4">
      <div id="ad-container" className="shadow-sm" ref={adRef}></div>
    </div>
  );
}

// تصدير كاسم بديل للتوافق مع الملفات القديمة التي تستخدم AadsUnitBanner
export const AadsUnitBanner = HighPerformanceAd;
export const AadsUnit = HighPerformanceAd;
export const AadsUnitSmall = HighPerformanceAd;
export const AadsUnitInside = HighPerformanceAd;

export default HighPerformanceAd;
