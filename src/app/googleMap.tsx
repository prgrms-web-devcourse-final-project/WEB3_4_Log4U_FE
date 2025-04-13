'use client';

import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  profileUrl: string;
  count?: number;
  title?: string;
}

export default function GoogleMapComponent({ markers }: { markers: MapMarker[] }) {
  // 선택된 마커 관련 기능 제거 (사용되지 않음)

  // 구글 맵 API 로드
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '', // 환경 변수에서 API 키 가져오기
  });

  // 지도 컨테이너 스타일
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  // 지도 중심 좌표 (서울)
  const center = {
    lat: 37.5665,
    lng: 126.978,
  };

  // 마커 렌더링
  const renderMarkers = () => {
    return markers.map(marker => (
      <Marker
        key={marker.id}
        position={{ lat: marker.lat, lng: marker.lng }}
        icon={{
          url: marker.profileUrl || '/diary-thumbnail-test.png',
          scaledSize: new window.google.maps.Size(40, 40),
        }}
      />
    ));
  };

  // 로딩 중일 때
  if (!isLoaded)
    return (
      <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
        지도 로딩중...
      </div>
    );

  return (
    <div className={'h-[250px]'}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {renderMarkers()}
      </GoogleMap>
    </div>
  );
}
