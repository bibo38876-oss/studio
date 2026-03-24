
"use client"

import React, { useEffect, useRef } from 'react';

/**
 * مكون إعلانات الأداء العالي الجديد (300x250)
 * يتم حقن السكريبت برمجياً لضمان الظهور المستمر
 */
export function HighPerformanceAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // التحقق من عدم وجود محتوى مسبق لتجنب التكرار
    if (adRef.current && adRef.current.childNodes.length === 0) {
      const container = adRef.current;
      
      // السكريبت الأول: الإعدادات
      const confScript = document.createElement('script');
      confScript.type = 'text/javascript';
      confScript.innerHTML = `
        atOptions = {
          'key' : 'e94da501ef4b01acec6f8588b1253c96',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      // السكريبت الثاني: جلب الإعلان
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/e94da501ef4b01acec6f8588b1253c96/invoke.js';
      invokeScript.async = true;

      container.appendChild(confScript);
      container.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="flex justify-center my-6 overflow-hidden w-full min-h-[250px] bg-primary/[0.02] border-y border-primary/5 py-4">
      <div ref={adRef} className="shadow-sm"></div>
    </div>
  );
}

export const AadsUnitBanner = HighPerformanceAd;
export const AadsUnit = HighPerformanceAd;
export const AadsUnitSmall = HighPerformanceAd;
export const AadsUnitInside = HighPerformanceAd;

export default HighPerformanceAd;
