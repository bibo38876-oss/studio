
"use client"

import React, { useEffect, useRef } from 'react';

/**
 * HighPerformanceAd - نظام الإعلانات الجديد (nap5k.com)
 * يقوم بحقن السكريبت برمجياً في مكان الوحدة لضمان أقصى استفادة.
 */
export function HighPerformanceAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current) {
      const script = document.createElement('script');
      // استخدام المنطق المطلوب من المستخدم للحقن
      (function(s: any){
        s.dataset.zone = '10787535';
        s.src = 'https://nap5k.com/tag.min.js';
      })(adRef.current.appendChild(document.createElement('script')));
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-2 bg-secondary/5 border-y border-muted/5 my-1 overflow-hidden min-h-[50px]">
      <div ref={adRef} className="ad-slot-container" />
    </div>
  );
}

export const AadsUnitBanner = () => <HighPerformanceAd />;
export const AadsUnit = () => <HighPerformanceAd />;
export const AadsUnitSmall = () => <HighPerformanceAd />;
export const AadsUnitInside = () => <HighPerformanceAd />;

export default HighPerformanceAd;
