import { GoogleMap, Marker } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import { ImageUtil } from '@root/utils/image.util';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  profileUrl: string;
  count?: number;
  title?: string;
}
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
  height?: string;
}

export default function GoogleMapComponent({
  markers,
  onZoomChanged,
  onBoundsChanged,
  onCenterChanged,
  initialZoom = 11,
  initialCenter,
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
            const base64Image = await ImageUtil.convertImageToBase64(marker.profileUrl);

            // 변환된 Base64 이미지로 마커 아이콘 생성
            iconsMap[marker.profileUrl] = ImageUtil.createBase64MarkerIcon(base64Image);
          } catch (error) {
            console.error(`Failed to convert image for marker ${marker.id}:`, error);
          }
        }
      }

      setMarkerIcons(iconsMap);
    };

    loadMarkerIcons();
  }, [markers]);

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
  const throttleEvent = useCallback((callback: () => void) => {
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
              clickable={true}
              zIndex={10}
              onClick={() => {
                window.location.href = `/diaries/${marker.id}`;
              }}
            />
          );
        } catch (error) {
          console.error('Marker rendering error:', error);
          return null;
        }
      })
      .filter(Boolean); // null 값 필터링
  }, [markers, markerIcons]);

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
      </GoogleMap>
    </div>
  );
}
