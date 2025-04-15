// GoogleMapComponent.tsx
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

// 클러스터 마커 생성 함수
const createClusterIcon = (count: number, style: ClusterStyle): string => {
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
  onExpandMap?: () => void; // 지도 확장 요청 콜백
  isExpanded?: boolean; // 지도가 확장됐는지 여부
}

export default function GoogleMapComponent({
  markers,
  onZoomChanged,
  onBoundsChanged,
  onCenterChanged,
  initialZoom = 11,
  initialCenter,
  height = '300px',
  onExpandMap,
  isExpanded = false,
}: GoogleMapComponentProps) {
  // 맵 레퍼런스
  const mapRef = useRef<google.maps.Map | null>(null);

  // 지도 중심 좌표 상태
  const [center, setCenter] = useState({
    lat: initialCenter?.lat || 37.5665, // 서울 기본값 또는 전달받은 값
    lng: initialCenter?.lng || 126.978,
  });

  // 이벤트 처리 제어 상태와 ref
  const isMountedRef = useRef(false);
  const [isMapStable, setIsMapStable] = useState(false);
  const lastEventTimeRef = useRef<number>(0);
  const lastIdleTimeRef = useRef<number>(0);
  const lastBoundsUpdateTimeRef = useRef<number>(0);
  const lastZoomUpdateTimeRef = useRef<number>(0);

  // 최소 이벤트 간격 (ms)
  const MIN_EVENT_INTERVAL = 500;

  // 마커 아이콘 Cache
  const [markerIcons, setMarkerIcons] = useState<{ [key: string]: string }>({});

  // 구글 맵 API 로드
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '',
    // 필요한 라이브러리 명시
    libraries: [],
  });

  // 맵 옵션 메모이제이션
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      // 불필요한 이벤트 감소
      gestureHandling: 'cooperative',
    }),
    []
  );

  // 지도 컨테이너 스타일 메모이제이션
  const mapContainerStyle = useMemo(
    () => ({
      width: '100%',
      height: isExpanded ? 'calc(100vh - 100px)' : height,
      transition: 'height 0.3s ease',
    }),
    [isExpanded, height]
  );

  // 마커 아이콘 미리 로드 - 필요한 것만 로드하도록 최적화
  useEffect(() => {
    // 이미 로드된 프로필 URL 추적
    const loadedUrls = new Set(Object.keys(markerIcons));

    // 다이어리 마커만 필터링 (클러스터 마커 제외)
    const diaryMarkers = markers.filter(marker => !marker.count);

    // 로드해야 할 새 URL 목록 (아직 로드되지 않은 것만)
    const newUrls = diaryMarkers
      .filter(marker => marker.profileUrl && !loadedUrls.has(marker.profileUrl))
      .map(marker => marker.profileUrl);

    // 새로운 URL이 없으면 건너뜀
    if (newUrls.length === 0) return;

    let isMounted = true;

    const loadMarkerIcons = async () => {
      const iconsMap = { ...markerIcons };

      // 최대 5개씩만 병렬 처리 (성능 최적화)
      const batchSize = 5;
      for (let i = 0; i < newUrls.length; i += batchSize) {
        const batch = newUrls.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async url => {
            try {
              const base64Image = await ImageUtil.convertImageToBase64(url);
              iconsMap[url] = ImageUtil.createBase64MarkerIcon(base64Image);
            } catch (error) {
              console.error(`Failed to convert image:`, error);
            }
          })
        );

        // 컴포넌트가 언마운트되었으면 중단
        if (!isMounted) return;
      }

      if (isMounted) {
        setMarkerIcons(iconsMap);
      }
    };

    loadMarkerIcons();

    return () => {
      isMounted = false;
    };
  }, [markers, markerIcons]);

  // 지도 확장 시 맵 리사이즈 트리거
  useEffect(() => {
    if (mapRef.current && isMountedRef.current) {
      // 지도 크기 변경 후 지도 레이아웃 재조정
      const resizeTimer = setTimeout(() => {
        if (mapRef.current) {
          window.google?.maps?.event?.trigger(mapRef.current, 'resize');

          // 경계 정보 다시 가져오기
          const boundsTimer = setTimeout(() => {
            if (mapRef.current && onBoundsChanged) {
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
          }, 300);

          return () => clearTimeout(boundsTimer);
        }
      }, 300);

      return () => clearTimeout(resizeTimer);
    }
  }, [isExpanded, onBoundsChanged]);

  // 맵 로드 완료 핸들러
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // 맵이 준비되었음을 표시
      setTimeout(() => {
        isMountedRef.current = true;

        // 맵이 로드된 후 초기 바운드 정보를 지연 전달
        setTimeout(() => {
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

          // 맵이 안정화되었음을 표시
          setIsMapStable(true);
        }, 500);
      }, 200);
    },
    [onBoundsChanged]
  );

  // 이벤트 스로틀링 함수
  const throttleEvent = useCallback((callback: () => void) => {
    const now = Date.now();
    if (now - lastEventTimeRef.current > MIN_EVENT_INTERVAL) {
      lastEventTimeRef.current = now;
      callback();
    }
  }, []);

  // 줌 변경 처리 - 스로틀링 적용
  const handleZoomChanged = useCallback(() => {
    if (!mapRef.current || !isMapStable || !onZoomChanged) return;

    const now = Date.now();
    if (now - lastZoomUpdateTimeRef.current < MIN_EVENT_INTERVAL) return;
    lastZoomUpdateTimeRef.current = now;

    const newZoom = mapRef.current.getZoom() || initialZoom;
    const intZoom = Math.floor(newZoom);

    onZoomChanged(intZoom);
  }, [initialZoom, isMapStable, onZoomChanged]);

  // 맵 이동/줌 완료 후 핸들러 (idle 상태일 때)
  const handleIdle = useCallback(() => {
    if (!mapRef.current || !isMapStable) return;

    // 너무 빠른 연속 호출 방지
    const now = Date.now();
    if (now - lastIdleTimeRef.current < MIN_EVENT_INTERVAL) return;
    lastIdleTimeRef.current = now;

    throttleEvent(() => {
      if (!mapRef.current) return;

      // 중심 좌표 업데이트
      const newCenter = mapRef.current.getCenter();
      if (newCenter && onCenterChanged) {
        const updatedCenter = {
          lat: newCenter.lat(),
          lng: newCenter.lng(),
        };

        // 이전 중심점과 새 중심점이 너무 가까우면 업데이트 하지 않음
        if (
          Math.abs(updatedCenter.lat - center.lat) > 0.001 ||
          Math.abs(updatedCenter.lng - center.lng) > 0.001
        ) {
          setCenter(updatedCenter);
          onCenterChanged(updatedCenter);
        }
      }

      // 줌 레벨 변경 확인
      handleZoomChanged();

      // 맵 경계 정보 전달
      if (onBoundsChanged && mapRef.current) {
        const now = Date.now();
        if (now - lastBoundsUpdateTimeRef.current < MIN_EVENT_INTERVAL) return;
        lastBoundsUpdateTimeRef.current = now;

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
  }, [onBoundsChanged, onCenterChanged, throttleEvent, handleZoomChanged, isMapStable, center]);

  // 마커 렌더링
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

            // 클러스터 마커 클릭 핸들러를 메모이제이션
            const handleClusterClick = () => {
              if (marker.id && typeof marker.id === 'string' && marker.id.startsWith('diary_')) {
                const diaryId = marker.id.replace('diary_', '');
                if (!isNaN(Number(diaryId))) {
                  window.location.href = `/diaries/${diaryId}`;
                }
              }
            };

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
                onClick={handleClusterClick}
              />
            );
          }

          // Base64로 변환된 아이콘 사용 (없으면 원래 URL 사용)
          const iconUrl = markerIcons[marker.profileUrl] || marker.profileUrl;

          // 다이어리 마커 클릭 핸들러를 메모이제이션
          const handleDiaryClick = () => {
            window.location.href = `/diaries/${marker.id}`;
          };

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
              zIndex={10}
              onClick={handleDiaryClick}
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
    <div style={{ height: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={initialZoom}
        onLoad={handleMapLoad}
        onIdle={handleIdle}
        options={mapOptions}
      >
        {/* 마커들 렌더링 */}
        {renderedMarkers}
      </GoogleMap>

      {/* 확장 버튼 - 우측 상단에 배치 */}
      {onExpandMap && (
        <button
          onClick={onExpandMap}
          className='absolute top-2 right-2 bg-white p-2 rounded-full shadow-md z-10 hover:bg-gray-100 transition-colors'
          title={isExpanded ? '지도 축소' : '지도 확장'}
        >
          {isExpanded ? (
            // 축소 아이콘
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          ) : (
            // 확장 아이콘
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5'
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
