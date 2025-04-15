'use client';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface MapMarker {
  id: string | number;
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
  // 지도 중심 좌표 상태 추가
  const [center, setCenter] = useState({
    lat: 37.5665, // 서울 기본값
    lng: 126.978,
  });

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

    // 중심 좌표 업데이트
    const newCenter = mapRef.current.getCenter();
    if (newCenter) {
      setCenter({
        lat: newCenter.lat(),
        lng: newCenter.lng(),
      });
    }

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
    return markers
      .filter(marker => marker.lat && marker.lng)
      .map(marker => {
        // 클러스터 마커인 경우 (count 속성이 있는 경우)
        if (marker.count !== undefined) {
          // 클러스터 크기에 따라 스타일 조정
          const getClusterStyle = (count: number) => {
            if (count < 10) {
              return {
                scale: 50,
                fontColor: 'white',
                fontSize: '14px',
                bgColor: '#3B82F6', // 파란색
                borderColor: '#2563EB',
                zIndex: 10,
              };
            } else if (count < 50) {
              return {
                scale: 55,
                fontColor: 'white',
                fontSize: '15px',
                bgColor: '#10B981', // 초록색
                borderColor: '#059669',
                zIndex: 20,
              };
            } else {
              return {
                scale: 60,
                fontColor: 'white',
                fontSize: '16px',
                bgColor: '#F59E0B', // 주황색
                borderColor: '#D97706',
                zIndex: 30,
              };
            }
          };

          const style = getClusterStyle(marker.count);

          // 클러스터 스타일 타입 정의
          interface ClusterStyle {
            scale: number;
            fontColor: string;
            fontSize: string;
            bgColor: string;
            borderColor: string;
            zIndex: number;
          }

          // SVG 원형 클러스터 생성
          const createClusterIcon = (count: number, style: ClusterStyle) => {
            // SVG 원형 마커 생성
            const svg = `
            <svg width="${style.scale}" height="${style.scale}" viewBox="0 0 ${style.scale} ${style.scale}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${style.scale / 2}" cy="${style.scale / 2}" r="${style.scale / 2 - 2}" fill="${style.bgColor}" stroke="${style.borderColor}" stroke-width="2"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="${style.fontColor}" 
                    font-family="Arial, sans-serif" font-weight="bold" font-size="${style.fontSize}">
                ${count}
              </text>
            </svg>
          `;

            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
          };

          return (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={{
                url: createClusterIcon(marker.count, style),
                scaledSize: new window.google.maps.Size(style.scale, style.scale),
                anchor: new window.google.maps.Point(style.scale / 2, style.scale / 2),
              }}
              title={marker.title}
              zIndex={style.zIndex}
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
