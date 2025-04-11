'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Google 지도 API가 로드된 후 호출할 함수
  function initMap() {
    if (mapRef.current && window.google) {
      new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // 예시: 샌프란시스코
        zoom: 12,
      });
      setMapLoaded(true);
    }
  }

  useEffect(() => {
    // API가 로드된 경우를 대비해 callback 호출
    if (mapLoaded) initMap();
  }, [mapLoaded]);

  return (
    <div className={'my-15 grow-1'}>
      {/* Google Maps API 스크립트 로드 */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&callback=initMap`}
        strategy='lazyOnload'
        onLoad={() => {
          // window에 initMap을 노출해서 스크립트 콜백으로 사용할 수 있게 함
          (window as any).initMap = initMap;
          setMapLoaded(true);
        }}
      />
      <div ref={mapRef} className='w-xl h-[400px]' />
    </div>
  );
}
