
"use client"

import React from 'react';

/**
 * مكون إعلانات AADS الموحد لمنصة تيمقاد
 */
export default function AadsUnit() {
  return (
    <div className="flex justify-center my-4 overflow-hidden w-full">
      <div id="frame" style={{ width: '120px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
        <iframe 
          data-aa='2431176' 
          src='https://ad.a-ads.com/2431176/?size=120x600&background_color=724444'
          style={{ border: 0, padding: 0, width: '120px', height: '600px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    </div>
  );
}

export function AadsUnitSmall() {
  return (
    <div className="flex justify-center my-2 overflow-hidden w-full">
      <div id="frame" style={{ width: '120px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
        <iframe 
          data-aa='2431181' 
          src='https://ad.a-ads.com/2431181/?size=120x60'
          style={{ border: 0, padding: 0, width: '120px', height: '60px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    </div>
  );
}
