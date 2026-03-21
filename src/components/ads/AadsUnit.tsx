
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

/**
 * رابط الإعلانات الثاني المحدث لشبكة CPM المربحة
 */
export function AadsUnitSmall() {
  const adLink = "https://www.profitablecpmratenetwork.com/mq7q42ghq?key=359975fc44f3fd6f131913aca68bef30";
  
  return (
    <div className="flex justify-center my-2 overflow-hidden w-full">
      <a 
        href={adLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-[120px] h-[60px] bg-primary/10 border border-primary/20 rounded-md overflow-hidden relative group"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
          <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Sponsored</span>
          <span className="text-[10px] font-bold text-accent group-hover:underline">Visit Now</span>
        </div>
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </a>
    </div>
  );
}

export function AadsUnitInside() {
  return (
    <div className="flex justify-center my-4 overflow-hidden w-full border-y border-primary/5 py-4 bg-primary/[0.02]">
      <div id="frame" style={{ width: '120px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
        <iframe 
          data-aa='2431219' 
          src='https://ad.a-ads.com/2431219/?size=120x60'
          style={{ border: 0, padding: 0, width: '120px', height: '60px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    </div>
  );
}

/**
 * وحدة إعلانات البانر العريضة الجديدة (320x50)
 */
export function AadsUnitBanner() {
  return (
    <div className="flex justify-center my-4 overflow-hidden w-full">
      <div id="frame" style={{ width: '320px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
        <iframe 
          data-aa='2431236' 
          src='https://ad.a-ads.com/2431236/?size=320x50&background_color=7c1818&title_hover_color=7a6666&link_color=NaNNaNNaN'
          style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    </div>
  );
}
