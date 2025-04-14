'use client';

// pages/diaryCreate.tsx
import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { Diary } from '../../../../types/diary';
import { DiaryService } from '../../../../services/diary';
import { MediaService } from '../../../../services/media';
import { useRouter } from 'next/navigation';
import { v4 } from 'uuid';
import { MapService } from '../../../../services/map';

const DiaryCreatePage: FC = () => {
  const router = useRouter();
  // 초기값: 오늘 날짜(YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [diaryDate, setDiaryDate] = useState<string>(today);
  const [weather, setWeather] = useState<Diary.WeatherType>(Diary.WeatherType.SUNNY);
  const [visibility, setVisibility] = useState<Diary.Visibility>(Diary.Visibility.PUBLIC);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('');
  const [location, setLocation] = useState<Diary.Location>({
    latitude: 37.5665,
    longitude: 126.978,
    sido: '서울특별시',
    sigungu: '중구',
    eupmyeondong: '세종로',
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<Diary.DiaryMedia.MutateDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDiaryDate(e.target.value);
  };

  const handleWeatherChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (Diary.isWeatherType(e.target.value)) {
      setWeather(e.target.value);
    } else {
      throw Error(e.target.value + ' is not a valid weather type');
    }
  };

  const handleHashtagsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHashtags(e.target.value);
  };

  const handleVisibilityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (Diary.isVisibility(e.target.value)) {
      setVisibility(e.target.value);
    } else {
      throw Error(e.target.value + ' is not a valid visibility');
    }
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // 위치 정보 새로고침
  const refreshLocation = async () => {
    console.log('refreshLocation');
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      // 안전한 출처 확인 (localhost, 127.0.0.1, 또는 특정 EC2 도메인)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        // MapService를 사용하여 위치 정보 가져오기
        const geoData = await MapService.getGeolocation(lat, lng);

        if (geoData && geoData.results && geoData.results.length > 0) {
          const result = geoData.results[0];
          const sido = result.region.area1?.name || '알 수 없음';
          const sigungu = result.region.area2?.name || '알 수 없음';
          const eupmyeondong = result.region.area3?.name || '알 수 없음';

          setLocation({
            latitude: lat,
            longitude: lng,
            sido: sido,
            sigungu: sigungu,
            eupmyeondong: eupmyeondong,
          });
        } else {
          throw new Error('위치 정보를 찾을 수 없습니다.');
        }
      } catch (geoError) {
        console.error('역지오코딩 오류:', geoError);
        setLocation({
          latitude: lat,
          longitude: lng,
          sido: '알 수 없음',
          sigungu: '알 수 없음',
          eupmyeondong: '알 수 없음',
        });
        setLocationError('주소 정보를 가져오는데 실패했습니다. 위치 좌표만 기록됩니다.');
      }
    } catch (error) {
      console.error('위치 정보 가져오기 실패:', error);
      if (error instanceof Error) {
        setLocationError(
          error.message || '위치 정보를 가져오는데 실패했습니다. 권한을 확인해주세요.'
        );
      } else {
        setLocationError('위치 정보를 가져오는데 실패했습니다. 권한을 확인해주세요.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 수동으로 위치 정보 입력 핸들러
  const handleManualLocationChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'sido' | 'sigungu' | 'eupmyeondong'
  ) => {
    setLocation(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // S3에 파일 업로드 핸들러
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsSubmitting(true);
    setIsUploading(true);
    setErrorMessage('');
    const files = Array.from(e.target.files);
    const newMediaItems: Diary.DiaryMedia.MutateDto[] = [];

    // 진행 상태 초기화
    const initialProgress: { [key: string]: number } = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);

    try {
      // 각 파일에 대해 순차적으로 처리
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const originalName = file.name;
        const contentType = file.type;
        const size = file.size;
        const orderIndex = mediaList.length + i;
        const fileId = `${Date.now()}-${i}-${originalName}`;

        // 1. 백엔드에서 presigned URL 요청
        const { presignedUrl, accessUrl, mediaId } = await MediaService.getPresignedUrl(
          originalName,
          contentType,
          size
        );

        // 2. S3에 파일 업로드 (진행 상태 추적)
        await MediaService.uploadFileToS3(
          presignedUrl,
          file,
          fileId,
          contentType,
          (fileId, progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: progress,
            }));
          }
        );

        console.log(accessUrl);
        // 3. 미디어 아이템 생성
        const mediaItem: Diary.DiaryMedia.MutateDto = {
          mediaId,
          originalName,
          storedName: v4() + '-' + originalName,
          contentType,
          size,
          url: accessUrl,
          orderIndex,
        };

        newMediaItems.push(mediaItem);
      }

      // 모든 업로드가 성공하면 상태 업데이트
      setMediaList(prev => [...prev, ...newMediaItems]);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
      setErrorMessage('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
      // 파일 선택 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 해시태그 처리 (# 제거 및 공백 제거)
      const hashtagList = hashtags
        .split('#')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const formData: Diary.CreateDto = {
        title,
        content,
        diaryDate,
        location,
        weatherInfo: weather,
        visibility,
        mediaList,
        hashtagList,
      };

      await DiaryService.createDiary(formData);
      // 성공 시 다이어리 목록 페이지로 이동
      router.push('/');
    } catch (error) {
      console.error('다이어리 생성 중 오류 발생:', error);
      setErrorMessage('다이어리 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 컴포넌트 마운트 시 위치 정보 가져오기
  useEffect(() => {
    // 안전한 출처 확인 업데이트
    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ec2-13-209-127-186.ap-northeast-2.compute.amazonaws.com');

    if (!isSecure) {
      setLocationError(
        '보안 연결(HTTPS)이 아니어서 위치 정보를 자동으로 가져올 수 없습니다. 수동으로 입력해주세요.'
      );
      return;
    }

    refreshLocation().catch(err => {
      console.error('자동 위치 정보 가져오기 실패:', err);
    });
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-md mx-auto my-8 border border-gray-300 rounded p-4 bg-white'
    >
      {errorMessage && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {errorMessage}
        </div>
      )}

      {/* 날짜 선택 */}
      <div className='text-center mb-6'>
        <label className='block text-lg font-semibold mb-2'>날짜</label>
        <input
          type='date'
          value={diaryDate}
          onChange={handleDateChange}
          className='mx-auto border border-gray-300 rounded p-2'
          required
        />
      </div>

      {/* 날씨 선택 */}
      <div className='mb-4'>
        <label className='block mb-1'>날씨</label>
        <select
          value={weather}
          onChange={handleWeatherChange}
          className='w-full border border-gray-300 rounded p-2'
          required
        >
          <option value={Diary.WeatherType.SUNNY}>☀️ 맑음</option>
          <option value={Diary.WeatherType.CLOUDY}>☁️ 흐림</option>
          <option value={Diary.WeatherType.RAINY}>🌧️ 비</option>
          <option value={Diary.WeatherType.SNOWY}>❄️ 눈</option>
        </select>
      </div>

      {/* 위치 정보 표시 */}
      <div className='mb-4'>
        <div className='flex justify-between items-center mb-1'>
          <label className='block'>현재 위치</label>
          <button
            type='button'
            onClick={refreshLocation}
            className='text-xs text-blue-500 hover:text-blue-700'
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? '갱신 중...' : '위치 갱신'}
          </button>
        </div>

        {locationError ? (
          <div>
            <div className='p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-2'>
              {locationError}
              <div className='mt-1'>
                <button
                  type='button'
                  onClick={refreshLocation}
                  className='text-xs text-blue-500 hover:text-blue-700 mr-2'
                >
                  다시 시도
                </button>
              </div>
            </div>

            {/* 수동 위치 입력 폼 */}
            <div className='p-2 border border-gray-200 rounded'>
              <p className='text-sm font-medium mb-2'>위치 정보 직접 입력</p>
              <div className='grid grid-cols-1 gap-2'>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>시/도</label>
                  <input
                    type='text'
                    value={location.sido}
                    onChange={e => handleManualLocationChange(e, 'sido')}
                    className='w-full border border-gray-300 rounded p-1 text-sm'
                    placeholder='예: 서울특별시'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>시/군/구</label>
                  <input
                    type='text'
                    value={location.sigungu}
                    onChange={e => handleManualLocationChange(e, 'sigungu')}
                    className='w-full border border-gray-300 rounded p-1 text-sm'
                    placeholder='예: 강남구'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>읍/면/동</label>
                  <input
                    type='text'
                    value={location.eupmyeondong}
                    onChange={e => handleManualLocationChange(e, 'eupmyeondong')}
                    className='w-full border border-gray-300 rounded p-1 text-sm'
                    placeholder='예: 역삼동'
                  />
                </div>
              </div>
            </div>
          </div>
        ) : isLoadingLocation ? (
          <div className='p-2 bg-gray-50 border border-gray-200 rounded'>
            <p className='text-gray-500 text-sm'>위치 정보를 가져오는 중...</p>
          </div>
        ) : (
          <div className='p-2 bg-gray-50 border border-gray-200 rounded'>
            <p className='text-gray-700 font-medium'>
              {location.sido} {location.sigungu} {location.eupmyeondong}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              위도: {location.latitude.toFixed(6)}, 경도: {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* 해시태그 입력 */}
      <div className='mb-4'>
        <label className='block mb-1'>해시태그</label>
        <input
          type='text'
          value={hashtags}
          onChange={handleHashtagsChange}
          placeholder='#여행 #맛집'
          className='w-full border border-gray-300 rounded p-2'
        />
        <div className='text-xs text-gray-500 mt-1'>해시태그는 #으로 구분하여 입력해주세요.</div>
      </div>

      {/* 공개대상 선택 */}
      <div className='mb-6'>
        <label className='block mb-1'>공개대상</label>
        <select
          value={visibility}
          onChange={handleVisibilityChange}
          className='w-full border border-gray-300 rounded p-2'
          required
        >
          <option value={Diary.Visibility.PUBLIC}>전체 공개</option>
          <option value={Diary.Visibility.PRIVATE}>비공개</option>
          <option value={Diary.Visibility.FOLLOWER}>팔로워만</option>
        </select>
      </div>

      {/* 제목 입력 */}
      <div className='mb-2 font-medium'>제목</div>
      <input
        type='text'
        value={title}
        onChange={handleTitleChange}
        placeholder='제목을 입력하세요'
        className='w-full border border-gray-300 rounded p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500'
        required
      />

      {/* 내용 입력 */}
      <div className='mb-2 font-medium'>내용</div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder='내용을 입력하세요...'
        className='w-full border border-gray-300 rounded p-2 mb-6 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
        required
      />

      {/* 미디어 목록 표시 */}
      {mediaList.length > 0 && (
        <div className='mb-4'>
          <div className='font-medium mb-2'>첨부된 파일 ({mediaList.length})</div>
          <div className='grid grid-cols-3 gap-2'>
            {mediaList.map((media, index) => (
              <div key={index} className='border rounded p-1 relative'>
                {media.contentType.startsWith('image/') ? (
                  <img
                    src={media.url}
                    alt={media.originalName}
                    className='w-full h-20 object-cover'
                  />
                ) : (
                  <div className='w-full h-20 bg-gray-100 flex flex-col items-center justify-center text-xs text-center p-1'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-8 w-8 text-gray-400 mb-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                      />
                    </svg>
                    {media.originalName}
                  </div>
                )}
                <button
                  type='button'
                  onClick={() => setMediaList(mediaList.filter((_, i) => i !== index))}
                  className='absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'
                  aria-label='파일 삭제'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 진행 상태 표시 */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className='mb-4 border rounded p-3 bg-gray-50'>
          <div className='font-medium mb-2 text-sm'>파일 업로드 중...</div>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className='mb-2'>
              <div className='flex justify-between text-xs mb-1'>
                <span className='truncate'>{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-500 h-2 rounded-full'
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 하단 버튼 영역 */}
      <div className='flex justify-between'>
        <label
          className={`px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm cursor-pointer flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              업로드 중...
            </>
          ) : (
            <>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4 mr-1'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              파일 첨부
            </>
          )}
          <input
            type='file'
            onChange={handleFileUpload}
            multiple
            className='hidden'
            accept='image/*,video/*'
            disabled={isSubmitting}
          />
        </label>
        <button
          type='submit'
          disabled={isSubmitting}
          className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:bg-blue-300 flex items-center'
        >
          {isSubmitting ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              처리 중...
            </>
          ) : (
            '작성 완료'
          )}
        </button>
      </div>
    </form>
  );
};

export default DiaryCreatePage;
