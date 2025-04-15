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
    <div className='min-h-screen bg-gradient-to-br from-[#f5f0e6] to-[#dad7cd] py-10 px-4'>
      <form
        onSubmit={handleSubmit}
        className='max-w-2xl mx-auto rounded-xl shadow-xl overflow-hidden bg-white transition-all duration-300 hover:shadow-2xl'
      >
        {/* 헤더 섹션 */}
        <div className='relative bg-gradient-to-r from-[#6c584c] to-[#a4161a] p-8 text-white'>
          <h1 className='text-3xl font-bold mb-2'>새 다이어리 작성</h1>
          <p className='opacity-80'>오늘의 특별한 순간을 기록해보세요</p>

          {/* 날짜 선택 - 헤더에 배치 */}
          <div className='mt-6 inline-block bg-white/20 backdrop-blur-sm rounded-lg p-3 pr-5'>
            <label className='block text-sm font-medium mb-1 text-white/90'>날짜</label>
            <input
              type='date'
              value={diaryDate}
              onChange={handleDateChange}
              className='bg-transparent border border-white/30 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-full'
              required
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className='bg-red-100 border-l-4 border-[#a4161a] text-[#a4161a] p-4 m-6 rounded shadow-sm animate-pulse'>
            <div className='flex items-center'>
              <svg
                className='h-6 w-6 mr-3 text-[#a4161a]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className='p-8'>
          {/* 주요 컨텐츠 섹션 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* 왼쪽 섹션 - 기본 정보 */}
            <div>
              {/* 날씨 선택 */}
              <div className='mb-6'>
                <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>날씨</label>
                <div className='relative'>
                  <select
                    value={weather}
                    onChange={handleWeatherChange}
                    className='appearance-none block w-full px-4 py-3 border border-[#dad7cd] rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent bg-white'
                    required
                  >
                    <option value={Diary.WeatherType.SUNNY}>☀️ 맑음</option>
                    <option value={Diary.WeatherType.CLOUDY}>☁️ 흐림</option>
                    <option value={Diary.WeatherType.RAINY}>🌧️ 비</option>
                    <option value={Diary.WeatherType.SNOWY}>❄️ 눈</option>
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6c584c]'>
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 위치 정보 표시 */}
              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-[#3c3c3c] text-sm font-semibold'>현재 위치</label>
                  <button
                    type='button'
                    onClick={refreshLocation}
                    className='flex items-center text-xs text-[#6c584c] hover:text-[#a4161a] transition-colors duration-200'
                    disabled={isLoadingLocation}
                  >
                    <svg
                      className={`h-4 w-4 mr-1 ${isLoadingLocation ? 'animate-spin' : ''}`}
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      />
                    </svg>
                    {isLoadingLocation ? '갱신 중...' : '위치 갱신'}
                  </button>
                </div>

                {locationError ? (
                  <div className='transition-all duration-300'>
                    <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-[#a4161a] text-sm mb-3'>
                      {locationError}
                      <div className='mt-2'>
                        <button
                          type='button'
                          onClick={refreshLocation}
                          className='text-xs bg-white px-3 py-1 rounded-md border border-red-300 hover:bg-red-50 transition-colors duration-200'
                        >
                          다시 시도
                        </button>
                      </div>
                    </div>

                    {/* 수동 위치 입력 폼 */}
                    <div className='p-4 border border-[#dad7cd] rounded-lg shadow-sm bg-white'>
                      <p className='text-sm font-medium mb-3 text-[#3c3c3c]'>위치 정보 직접 입력</p>
                      <div className='space-y-3'>
                        <div>
                          <label className='block text-xs text-[#6c584c] mb-1'>시/도</label>
                          <input
                            type='text'
                            value={location.sido}
                            onChange={e => handleManualLocationChange(e, 'sido')}
                            className='w-full border border-[#dad7cd] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
                            placeholder='예: 서울특별시'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-[#6c584c] mb-1'>시/군/구</label>
                          <input
                            type='text'
                            value={location.sigungu}
                            onChange={e => handleManualLocationChange(e, 'sigungu')}
                            className='w-full border border-[#dad7cd] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
                            placeholder='예: 강남구'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-[#6c584c] mb-1'>읍/면/동</label>
                          <input
                            type='text'
                            value={location.eupmyeondong}
                            onChange={e => handleManualLocationChange(e, 'eupmyeondong')}
                            className='w-full border border-[#dad7cd] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
                            placeholder='예: 역삼동'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isLoadingLocation ? (
                  <div className='p-4 border border-[#dad7cd] rounded-lg flex items-center space-x-3'>
                    <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#6c584c]'></div>
                    <p className='text-[#3c3c3c] text-sm'>위치 정보를 가져오는 중...</p>
                  </div>
                ) : (
                  <div className='p-4 border border-[#dad7cd] rounded-lg shadow-sm bg-white transition-all duration-300 hover:shadow-md'>
                    <div className='flex items-start'>
                      <svg
                        className='h-5 w-5 text-[#6c584c] mr-2 mt-0.5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                      <div>
                        <p className='text-[#3c3c3c] font-medium'>
                          {location.sido} {location.sigungu} {location.eupmyeondong}
                        </p>
                        <p className='text-xs text-[#6c584c] mt-1'>
                          위도: {location.latitude.toFixed(6)}, 경도:{' '}
                          {location.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 공개대상 선택 */}
              <div className='mb-6'>
                <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>공개대상</label>
                <div className='relative'>
                  <select
                    value={visibility}
                    onChange={handleVisibilityChange}
                    className='appearance-none block w-full px-4 py-3 border border-[#dad7cd] rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent bg-white'
                    required
                  >
                    <option value={Diary.Visibility.PUBLIC}>👥 전체 공개</option>
                    <option value={Diary.Visibility.PRIVATE}>🔒 비공개</option>
                    <option value={Diary.Visibility.FOLLOWER}>👫 팔로워만</option>
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6c584c]'>
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 섹션 - 해시태그 및 첨부파일 */}
            <div>
              {/* 해시태그 입력 */}
              <div className='mb-6'>
                <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>해시태그</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      className='h-5 w-5 text-[#6c584c]'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                      />
                    </svg>
                  </div>
                  <input
                    type='text'
                    value={hashtags}
                    onChange={handleHashtagsChange}
                    placeholder='#여행 #맛집'
                    className='pl-10 w-full border border-[#dad7cd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
                  />
                </div>
                <div className='text-xs text-[#6c584c] mt-2 flex items-center'>
                  <svg
                    className='h-4 w-4 mr-1 text-[#6c584c]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  해시태그는 #으로 구분하여 입력해주세요.
                </div>
              </div>

              {/* 미디어 업로드 영역 */}
              <div className='mb-6'>
                <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>
                  미디어 첨부
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 
                    ${isSubmitting ? 'bg-gray-100 opacity-70' : 'hover:bg-[#f5f0e6] hover:border-[#6c584c]'}`}
                  onClick={() => !isSubmitting && document.getElementById('file-upload')?.click()}
                >
                  <input
                    id='file-upload'
                    type='file'
                    onChange={handleFileUpload}
                    multiple
                    className='hidden'
                    accept='image/*,video/*'
                    disabled={isSubmitting}
                  />
                  <svg
                    className='mx-auto h-12 w-12 text-[#6c584c]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='1.5'
                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  <p className='mt-2 text-sm text-[#3c3c3c]'>
                    클릭하여 이미지나 동영상을 업로드하세요
                  </p>
                  <p className='mt-1 text-xs text-[#6c584c]'>PNG, JPG, GIF, MP4 등</p>
                </div>
              </div>
            </div>
          </div>

          {/* 업로드 진행 상태 표시 */}
          {isUploading && Object.keys(uploadProgress).length > 0 && (
            <div className='my-6 border rounded-lg p-4 bg-white shadow-sm'>
              <div className='flex items-center mb-2'>
                <svg
                  className='animate-spin h-5 w-5 mr-2 text-[#6c584c]'
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
                <span className='font-medium text-[#3c3c3c]'>파일 업로드 중...</span>
              </div>
              <div className='space-y-3'>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName}>
                    <div className='flex justify-between text-xs mb-1'>
                      <span className='truncate max-w-xs'>{fileName}</span>
                      <span className='font-medium'>{progress}%</span>
                    </div>
                    <div className='w-full bg-[#f5f0e6] rounded-full h-2 overflow-hidden'>
                      <div
                        className='bg-[#6c584c] h-2 rounded-full transition-all duration-300 ease-out'
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미디어 목록 표시 */}
          {mediaList.length > 0 && (
            <div className='my-6'>
              <div className='font-medium mb-3 text-[#3c3c3c] flex items-center'>
                <svg
                  className='h-5 w-5 mr-2 text-[#6c584c]'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                첨부된 파일 ({mediaList.length})
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                {mediaList.map((media, index) => (
                  <div
                    key={index}
                    className='relative group rounded-lg overflow-hidden shadow-sm border border-[#dad7cd] transition-all duration-200 hover:shadow-md'
                  >
                    {media.contentType.startsWith('image/') ? (
                      <img
                        src={media.url}
                        alt={media.originalName}
                        className='w-full h-24 object-cover'
                      />
                    ) : (
                      <div className='w-full h-24 bg-[#f5f0e6] flex flex-col items-center justify-center p-2'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-8 w-8 text-[#6c584c] mb-1'
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
                        <span className='text-xs text-center truncate w-full'>
                          {media.originalName}
                        </span>
                      </div>
                    )}
                    <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200'></div>
                    <button
                      type='button'
                      onClick={() => setMediaList(mediaList.filter((_, i) => i !== index))}
                      className='absolute top-1 right-1 bg-[#a4161a] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                      aria-label='파일 삭제'
                    >
                      ×
                    </button>
                    <div className='text-xs truncate px-2 py-1 bg-white text-[#3c3c3c]'>
                      {media.originalName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 제목 입력 */}
          <div className='mt-8 mb-4'>
            <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>제목</label>
            <input
              type='text'
              value={title}
              onChange={handleTitleChange}
              placeholder='제목을 입력하세요'
              className='w-full border border-[#dad7cd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
              required
            />
          </div>

          {/* 내용 입력 */}
          <div className='mb-8'>
            <label className='block text-[#3c3c3c] text-sm font-semibold mb-2'>내용</label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder='오늘의 특별한 순간을 기록해보세요...'
              className='w-full border border-[#dad7cd] rounded-lg p-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:border-transparent'
              required
            ></textarea>
          </div>

          {/* 하단 버튼 영역 */}
          <div className='flex justify-end space-x-4 mt-10'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-5 py-2.5 bg-[#dad7cd] text-[#3c3c3c] rounded-lg hover:bg-[#c9c6bc] transition-colors duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:ring-offset-2'
            >
              취소
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-5 py-2.5 bg-gradient-to-r from-[#6c584c] to-[#a4161a] text-white rounded-lg font-medium text-sm transition-all duration-200 
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-[#5a4a40] hover:to-[#8a1118] shadow-md hover:shadow-lg'} 
                focus:outline-none focus:ring-2 focus:ring-[#6c584c] focus:ring-offset-2`}
            >
              {isSubmitting ? (
                <div className='flex items-center'>
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
                </div>
              ) : (
                <div className='flex items-center'>
                  <svg
                    className='mr-1.5 h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  작성 완료
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiaryCreatePage;
