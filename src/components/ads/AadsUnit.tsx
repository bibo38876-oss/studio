
"use client"

import React, { useEffect, useRef } from 'react';

/**
 * HighPerformanceAd - نظام الإعلانات الاستراتيجي الجديد لـ تيمقاد (nap5k.com)
 * يتم حقن الإعلانات برمجياً في أماكن ظهور المكون لضمان التفاعل العالي.
 */
export function HighPerformanceAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current) {
      // إزالة أي محتوى سابق لمنع التكرار
      adRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      (function(s: any){
        s.dataset.zone = '10787535';
        s.src = 'https://nap5k.com/tag.min.js';
      })(adRef.current.appendChild(script));
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-4 bg-secondary/5 border-y border-muted/5 my-2 overflow-hidden min-h-[250px] items-center">
      <div ref={adRef} className="ad-slot-container scale-95 md:scale-100" />
    </div>
  );
}

export const AadsUnitBanner = () => <HighPerformanceAd />;
export const AadsUnit = () => <HighPerformanceAd />;
export const AadsUnitSmall = () => <HighPerformanceAd />;
export const AadsUnitInside = () => <HighPerformanceAd />;

export default HighPerformanceAd;
