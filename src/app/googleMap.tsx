'use client';

import React, { useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  profileUrl: string;
  count?: number;
  title?: string;
}

interface GoogleMapComponentProps {
  markers: MapMarker[];
  onZoomChanged?: (newZoom: number) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  initialZoom?: number;
}

export default function GoogleMapComponent({
  markers,
  onZoomChanged,
  onBoundsChanged,
  initialZoom = 11,
}: GoogleMapComponentProps) {
  // 맵 레퍼런스
  const mapRef = useRef<google.maps.Map | null>(null);

  // 구글 맵 API 로드
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '',
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

  // 맵 로드 완료 핸들러
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // 맵이 로드된 직후에 초기 바운드 정보 전달
      if (onBoundsChanged && map.getBounds()) {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            north: ne.lat(),
            east: ne.lng(),
            south: sw.lat(),
            west: sw.lng(),
          });
        }
      }
    },
    [onBoundsChanged]
  );

  // 맵 이동/줌 완료 후 핸들러 (idle 상태일 때)
  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;

    // 줌 레벨 정보 전달
    if (onZoomChanged) {
      const newZoom = mapRef.current.getZoom() || initialZoom;
      onZoomChanged(newZoom);
    }

    // 맵 경계 정보 전달
    if (onBoundsChanged) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChanged({
          north: ne.lat(),
          east: ne.lng(),
          south: sw.lat(),
          west: sw.lng(),
        });
      }
    }
  }, [onZoomChanged, onBoundsChanged, initialZoom]);

  // 마커 렌더링
  const renderMarkers = () => {
    return markers.map(marker => {
      // 클러스터 마커인 경우 (count 속성이 있는 경우)
      if (marker.count !== undefined) {
        return (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              url: marker.profileUrl,
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            label={{
              text: `${marker.count}`,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            title={marker.title}
          />
        );
      }

      // 일반 다이어리 마커
      return (
        <Marker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={{
            url: marker.profileUrl || '/diary-thumbnail-test.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          title={marker.title}
        />
      );
    });
  };

  // 로딩 중일 때
  if (!isLoaded)
    return (
      <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
        지도 로딩중...
      </div>
    );

  return (
    <div className={'h-[400px]'}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={initialZoom}
        onLoad={handleMapLoad}
        onIdle={handleIdle}
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
