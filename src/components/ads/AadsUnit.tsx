
"use client"

import React, { useEffect, useRef } from 'react';

/**
 * HighPerformanceAd - نظام الإعلانات الاستراتيجي المطور لـ تيمقاد (nap5k.com)
 * يستخدم تقنية Iframe Isolation لضمان ظهور الإعلانات المتعددة بانتظام واستقرار.
 * المعرف المعتمد: 10791722
 */
export function HighPerformanceAd() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        // حقن السكريبت داخل بيئة معزولة لضمان عدم تداخل الإعلانات
        doc.write(`
          <html>
            <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;">
              <div id="ad-container"></div>
              <script>
                (function(s){
                  s.dataset.zone='10791722';
                  s.src='https://nap5k.com/tag.min.js';
                })(document.getElementById('ad-container').appendChild(document.createElement('script')));
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-4 bg-secondary/5 border-y border-muted/5 my-2 overflow-hidden min-h-[280px] items-center">
      <iframe
        ref={iframeRef}
        title="Timgad Advertisement"
        width="300"
        height="250"
        frameBorder="0"
        scrolling="no"
        className="overflow-hidden shadow-sm bg-white/50"
      />
    </div>
  );
}

export const AadsUnitBanner = () => <HighPerformanceAd />;
export const AadsUnit = () => <HighPerformanceAd />;
export const AadsUnitSmall = () => <HighPerformanceAd />;
export const AadsUnitInside = () => <HighPerformanceAd />;

export default HighPerformanceAd;
