
"use client"

import React from 'react';

/**
 * HighPerformanceAd - مكون إعلانات الأداء العالي (300x250).
 * يستخدم تقنية srcDoc لضمان عزل السكريبتات وظهور الإعلانات بانتظام في القوائم الطويلة دون تعارض.
 */
export function HighPerformanceAd() {
  return (
    <div className="flex justify-center my-6 overflow-hidden w-full min-h-[250px] bg-primary/[0.01] py-2 border-y border-primary/5">
      <iframe
        title="Timgad Ad Unit"
        width="300"
        height="250"
        frameBorder="0"
        scrolling="no"
        className="shadow-sm bg-white/50"
        srcDoc={`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 250px; overflow: hidden; }
              </style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : 'e94da501ef4b01acec6f8588b1253c96',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="https://www.highperformanceformat.com/e94da501ef4b01acec6f8588b1253c96/invoke.js"></script>
            </body>
          </html>
        `}
      />
    </div>
  );
}

export const AadsUnitBanner = HighPerformanceAd;
export const AadsUnit = HighPerformanceAd;
export const AadsUnitSmall = HighPerformanceAd;
export const AadsUnitInside = HighPerformanceAd;

export default HighPerformanceAd;
