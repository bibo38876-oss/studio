"use client"

import React, { useEffect, useRef } from 'react';

/**
 * مكون إعلانات الأداء العالي (300x250) - نسخة محسنة للهواتف.
 */
export function HighPerformanceAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // التأكد من حقن الإعلان مرة واحدة فقط ومنع تكرار الـ Scripts
    if (containerRef.current && containerRef.current.childNodes.length === 0) {
      const scriptId = `ad-script-${Math.random().toString(36).substr(2, 9)}`;
      
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        var atOptions = {
          'key' : 'e94da501ef4b01acec6f8588b1253c96',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.id = scriptId;
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/e94da501ef4b01acec6f8588b1253c96/invoke.js';
      invokeScript.async = true;

      containerRef.current.appendChild(configScript);
      containerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="flex justify-center my-4 overflow-hidden w-full min-h-[250px] bg-primary/[0.02] border-y border-primary/5 py-4 px-2">
      {/* حاوية ثابتة المقاس لضمان عدم حدوث CLS (إزاحة المحتوى) في الموبايل */}
      <div ref={containerRef} className="shadow-sm w-[300px] h-[250px] bg-white/50 flex items-center justify-center relative">
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground uppercase font-bold tracking-widest pointer-events-none opacity-20">Ad Unit 300x250</span>
      </div>
    </div>
  );
}

export const AadsUnitBanner = HighPerformanceAd;
export const AadsUnit = HighPerformanceAd;
export const AadsUnitSmall = HighPerformanceAd;
export const AadsUnitInside = HighPerformanceAd;

export default HighPerformanceAd;