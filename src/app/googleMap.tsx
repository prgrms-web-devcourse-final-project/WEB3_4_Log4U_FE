'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  profileUrl: string;
  count?: number;
}

export default function GoogleMapComponent({ markers }: { markers: MapMarker[] }) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // 구글 맵 API 로드
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '', // 환경 변수에서 API 키 가져오기
  });

  // 맵 스타일
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  // 기본 센터 위치 (서울)
  const [center, setCenter] = useState({
    lat: 37.5665,
    lng: 126.978,
  });

  useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(position => {
      setCenter({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }, []);

  // 커스텀 마커 렌더링
  const renderCustomMarker = (marker: MapMarker) => (
    <div className='relative'>
      <div className='absolute -translate-x-1/2 -translate-y-full'>
        <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-white overflow-hidden'>
          {marker.count && (
            <span className='bg-black text-white font-bold rounded-full w-6 h-6 flex items-center justify-center absolute top-0 right-0 z-10'>
              {marker.count}
            </span>
          )}
          {/* <Image
            src={marker.profileUrl}
            alt='프로필'
            width={64}
            height={64}
            className='w-full h-full object-cover'
          /> */}
        </div>
      </div>
    </div>
  );

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
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => setSelectedMarker(marker)}
            // icon={{
            //   url: marker.profileUrl,
            //   scaledSize: new window.google.maps.Size(40, 40),
            // }}
          >
            <div>{renderCustomMarker(marker)}</div>
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
}
