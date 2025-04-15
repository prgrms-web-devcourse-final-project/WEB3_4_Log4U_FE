import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  profileUrl: string;
  count?: number;
  title?: string;
}

// 이미지 URL을 Base64로 변환하는 함수
const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // 이미지를 가져옵니다
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Blob을 Base64로 변환
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('이미지 변환 중 오류 발생:', error);
    // 오류 발생 시 기본 이미지 반환 (선택사항)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
};

// Base64 이미지를 사용한 커스텀 마커 생성 함수
const createBase64MarkerIcon = (base64Image: string): string => {
  // SVG 마커 템플릿
  const svg = `
    <svg width="40" height="54" viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- 핀 형태 배경 -->
      <path fill="#FFFFFF" stroke="#DDDDDD" stroke-width="2" d="M20,2 C9.07,2 0.5,10.57 0.5,21.5 C0.5,34.67 12.99,43.67 20,52 C27.01,43.67 39.5,34.67 39.5,21.5 C39.5,10.57 30.93,2 20,2 Z" />
      
      <!-- 클리핑 패스 (이미지를 원형으로 자르기 위함) -->
      <defs>
        <clipPath id="circleClip">
          <circle cx="20" cy="21" r="15" />
        </clipPath>
      </defs>
      
      <!-- 원형으로 잘린 이미지 -->
      <image clip-path="url(#circleClip)" x="5" y="6" width="30" height="30" xlink:href="${base64Image}" />
      
      <!-- 이미지 테두리 -->
      <circle cx="20" cy="21" r="15" fill="none" stroke="#FFFFFF" stroke-width="2" />
    </svg>
  `;

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
};

// 클러스터 마커 생성 함수 (기존 함수 유지)
const createClusterIcon = (count: number, style: ClusterStyle): string => {
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

interface ClusterStyle {
  scale: number;
  fontColor: string;
  fontSize: string;
  bgColor: string;
  borderColor: string;
  zIndex: number;
}

interface GoogleMapComponentProps {
  markers: MapMarker[];
  onZoomChanged?: (newZoom: number) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  initialZoom?: number;
  initialCenter?: { lat: number; lng: number };
  pathColor?: string;
  height?: string;
}

export default function GoogleMapComponent({
  markers,
  onZoomChanged,
  onBoundsChanged,
  onCenterChanged,
  initialZoom = 11,
  initialCenter,
  pathColor = '#FF5353',
  height = '300px',
}: GoogleMapComponentProps & {
  initialCenter?: { lat: number; lng: number };
}) {
  console.log(markers, 'markers!!!!!!');

  // 맵 레퍼런스
  const mapRef = useRef<google.maps.Map | null>(null);

  // 지도 중심 좌표 상태 추가 - 초기값을 props에서 받을 수 있도록 수정
  const [center, setCenter] = useState({
    lat: initialCenter?.lat || 37.5665, // 서울 기본값 또는 전달받은 값
    lng: initialCenter?.lng || 126.978,
  });

  // 현재 중심 좌표를 부모 컴포넌트에 전달
  const centerChangedRef = useRef(false);

  // 사용자 위치 상태 추가
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // 경로 표시용 정렬된 마커 배열
  const [sortedMarkers, setSortedMarkers] = useState<(MapMarker & { distance?: number })[]>([]);
  // 현재 줌 레벨 상태 추가
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  // 최근에 이벤트가 처리된 시간 저장
  const lastEventTimeRef = useRef<number>(0);

  // 마커 아이콘 Cache 추가
  const [markerIcons, setMarkerIcons] = useState<{ [key: string]: string }>({});

  // 구글 맵 API 로드
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '',
  });

  // 지도 컨테이너 스타일
  const mapContainerStyle = {
    width: '100%',
    height: height,
  };

  // 마커 아이콘 미리 로드
  useEffect(() => {
    const loadMarkerIcons = async () => {
      if (!markers || markers.length === 0) return;

      const iconsMap: { [key: string]: string } = {};

      for (const marker of markers) {
        if (marker.profileUrl && !marker.count) {
          // 이미 로드된 아이콘이 있으면 건너뜁니다
          if (iconsMap[marker.profileUrl]) continue;

          try {
            // 이미지를 Base64로 변환
            const base64Image = await convertImageToBase64(marker.profileUrl);

            // 변환된 Base64 이미지로 마커 아이콘 생성
            iconsMap[marker.profileUrl] = createBase64MarkerIcon(base64Image);
          } catch (error) {
            console.error(`Failed to convert image for marker ${marker.id}:`, error);
          }
        }
      }

      setMarkerIcons(iconsMap);
    };

    loadMarkerIcons();
  }, [markers]);

  // 컴포넌트 마운트 시 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        error => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 마커들을 현재 위치에서 가까운 순서대로 정렬
  useEffect(() => {
    if (!userLocation || !markers || markers.length === 0) {
      setSortedMarkers([]);
      return;
    }

    // 다이어리 마커만 필터링 (클러스터가 아닌 마커)
    const diaryMarkers = markers.filter(marker => !marker.count);
    if (diaryMarkers.length === 0) {
      setSortedMarkers([]);
      return;
    }

    // 거리 계산 함수 (하버사인 공식)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // 지구 반지름 (km)
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    // 현재 위치에서 각 마커까지의 거리 계산
    const markersWithDistance = diaryMarkers.map(marker => ({
      ...marker,
      distance: calculateDistance(userLocation.lat, userLocation.lng, marker.lat, marker.lng),
    }));

    // 거리순으로 정렬
    const sorted = [...markersWithDistance].sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // 경로를 그릴 마커 설정 (최대 10개까지만)
    setSortedMarkers(sorted.slice(0, 10));
  }, [markers, userLocation]);

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

  // 이벤트 스로틀링 함수
  const throttleEvent = useCallback((callback: Function) => {
    const now = Date.now();
    // 마지막 이벤트로부터 300ms 이상 지났을 때만 처리
    if (now - lastEventTimeRef.current > 300) {
      lastEventTimeRef.current = now;
      callback();
    }
  }, []);

  // 맵 이동/줌 완료 후 핸들러 (idle 상태일 때) - 수정
  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;

    throttleEvent(() => {
      // 중심 좌표 업데이트
      const newCenter = mapRef.current?.getCenter();
      if (newCenter) {
        const updatedCenter = {
          lat: newCenter.lat(),
          lng: newCenter.lng(),
        };
        setCenter(updatedCenter);

        // 첫 로드 이후에만 중심 변경 이벤트 발생
        if (centerChangedRef.current && onCenterChanged) {
          onCenterChanged(updatedCenter);
        } else {
          centerChangedRef.current = true;
        }
      }

      // 줌 레벨 정보 전달 - 줌 레벨이 변경된 경우에만
      if (onZoomChanged) {
        const newZoom = mapRef.current?.getZoom() || initialZoom;
        // 정수 부분만 비교하여 실질적인 변경 시에만 업데이트
        if (Math.floor(newZoom) !== Math.floor(currentZoom)) {
          setCurrentZoom(newZoom); // 현재 줌 레벨 업데이트
          onZoomChanged(newZoom);
        }
      }

      // 맵 경계 정보 전달
      if (onBoundsChanged && mapRef.current) {
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
    });
  }, [onZoomChanged, onBoundsChanged, onCenterChanged, initialZoom, currentZoom, throttleEvent]);

  // 경로 포인트 생성 (사용자 위치 + 정렬된 마커들)
  const pathPoints = useMemo(() => {
    return userLocation && sortedMarkers.length > 0
      ? [
          userLocation, // 시작점 (사용자 위치)
          ...sortedMarkers.map(marker => ({ lat: marker.lat, lng: marker.lng })), // 가까운 마커들
        ]
      : [];
  }, [userLocation, sortedMarkers]);

  // 마커 렌더링 - 렌더링마다 불필요한 로그 제거
  const renderedMarkers = useMemo(() => {
    if (!markers || markers.length === 0) {
      return null;
    }

    return markers
      .map(marker => {
        try {
          // 좌표 확인
          if (!marker || !marker.lat || !marker.lng) {
            return null;
          }

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

            return (
              <Marker
                key={`cluster-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url: createClusterIcon(marker.count, style),
                  scaledSize: new window.google.maps.Size(style.scale, style.scale),
                  anchor: new window.google.maps.Point(style.scale / 2, style.scale / 2),
                }}
                title={marker.title}
                zIndex={style.zIndex}
                onClick={() => {
                  if (
                    marker.id &&
                    typeof marker.id === 'string' &&
                    marker.id.startsWith('diary_')
                  ) {
                    const diaryId = marker.id.replace('diary_', '');
                    if (!isNaN(Number(diaryId))) {
                      window.location.href = `/diaries/${diaryId}`;
                    }
                  }
                }}
              />
            );
          }

          // 정렬된 마커 경로에 포함된 마커인지 확인
          const isInPath = sortedMarkers.some(m => m.id === marker.id);

          // Base64로 변환된 아이콘 사용 (없으면 원래 URL 사용)
          const iconUrl = markerIcons[marker.profileUrl] || marker.profileUrl;

          return (
            <Marker
              key={`diary-${marker.id}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.title}
              icon={{
                url: iconUrl,
                scaledSize: new window.google.maps.Size(40, 54),
                anchor: new window.google.maps.Point(20, 52),
              }}
              zIndex={isInPath ? 100 : 10}
              onClick={() => {
                if (marker.id && typeof marker.id === 'string' && marker.id.startsWith('diary_')) {
                  const diaryId = marker.id.replace('diary_', '');
                  if (!isNaN(Number(diaryId))) {
                    window.location.href = `/diaries/${diaryId}`;
                  }
                }
              }}
            />
          );
        } catch (error) {
          console.error('Marker rendering error:', error);
          return null;
        }
      })
      .filter(Boolean); // null 값 필터링
  }, [markers, sortedMarkers, markerIcons]);

  // 로딩 중일 때
  if (!isLoaded)
    return (
      <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
        지도 로딩중...
      </div>
    );

  return (
    <div style={{ height: '100%' }}>
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
        {/* 마커들 렌더링 - 함수 호출 대신 메모이제이션된 값 사용 */}
        {renderedMarkers}

        {/* 사용자 위치 마커 (있을 경우) */}
        {userLocation && (
          <Marker
            position={userLocation}
            title='내 위치'
            zIndex={1000} // 가장 위에 표시
          />
        )}

        {/* 가까운 마커들을 연결하는 경로 (클러스터링 사용 시 표시하지 않음) */}
        {pathPoints.length > 1 && !markers.some(marker => marker.count !== undefined) && (
          <Polyline
            path={pathPoints}
            options={{
              strokeColor: pathColor,
              strokeOpacity: 0.8,
              strokeWeight: 3,
              icons: [
                {
                  icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                  },
                  offset: '0',
                  repeat: '100px',
                },
              ],
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
