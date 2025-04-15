'use client';

import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Diary } from '@root/types/diary';
import { DiaryService } from '@root/services/diary';
import { MediaService } from '@root/services/media';
import { v4 } from 'uuid';
import { MapService } from '@root/services/map';

const DiaryEditPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { diaryId } = params;

  // 초기값: 오늘 날짜(YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(today);
  const [weather, setWeather] = useState<Diary.WeatherType>(Diary.WeatherType.SUNNY);
  const [time, setTime] = useState<string>('18:00');
  const [tags, setTags] = useState<string[]>(['일상', '추억']);
  const [visibility, setVisibility] = useState<Diary.Visibility>(Diary.Visibility.PUBLIC);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    sido: string;
    sigungu: string;
    eupmyeondong: string;
  }>({
    latitude: 37.5665,
    longitude: 126.978,
    sido: '서울특별시',
    sigungu: '강남구',
    eupmyeondong: '역삼동',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<Diary.DiaryMedia.MutateDto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Path variable인 diaryId가 존재하면, 해당 다이어리 정보를 조회해서 기본값으로 설정
  useEffect(() => {
    if (diaryId) {
      setLoading(true);
      // diaryId가 query parameter로 들어오므로 string으로 캐스팅
      DiaryService.getDiary(diaryId as string)
        .then(data => {
          // 백엔드에서 전달받은 데이터로 상태 설정
          setWeather(data.weatherInfo);
          setVisibility(data.visibility);
          setTitle(data.title);
          setContent(data.content);

          // 날짜 설정 (API에서 제공하는 형식에 따라 조정 필요)
          if (data.createdAt) {
            const createdDate = new Date(data.createdAt);
            setDate(createdDate.toISOString().split('T')[0]);
          }

          // 위치 정보 설정
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            sido: data.sido || '서울특별시',
            sigungu: data.sigungu || '강남구',
            eupmyeondong: data.dongmyun || '역삼동',
          });

          // 미디어 리스트 설정
          if (data.mediaList && data.mediaList.length > 0) {
            // DiaryMedia를 MutateDto로 변환
            const convertedMediaList = data.mediaList.map(media => {
              const mutateMedia: Diary.DiaryMedia.MutateDto = {
                mediaId: media.mediaId,
                originalName: `file-${media.mediaId}`, // 기존 파일은 실제 originalName이 없으므로 임의 생성
                storedName: `stored-${media.mediaId}`, // 기존 파일은 실제 storedName이 없으므로 임의 생성
                contentType: media.contentType,
                size: 0, // 기존 파일은 실제 size 정보가 없으므로 0으로 설정
                url: media.fileUrl, // fileUrl을 url로 매핑
                orderIndex: media.orderIndex,
              };
              return mutateMedia;
            });
            setMediaList(convertedMediaList);
          }

          // 해시태그 설정 (API에서 제공하는 형식에 따라 조정 필요)
          // setTags(['일상', '추억']);
        })
        .catch(error => {
          console.error('Failed to load diary', error);
          alert('다이어리를 불러오는데 실패했습니다.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [diaryId]);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleWeatherChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (Diary.isWeatherType(e.target.value)) {
      setWeather(e.target.value);
    } else {
      throw Error(e.target.value + ' is not a valid weather type');
    }
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 태그 문자열을 배열로 변환 (예: "#일상 #추억" -> ["일상", "추억"])
    const tagText = e.target.value;
    const tagArray = tagText
      .split(' ')
      .map(tag => (tag.startsWith('#') ? tag.substring(1) : tag))
      .filter(tag => tag.trim() !== '');

    setTags(tagArray);
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

  // S3에 파일 업로드 핸들러
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setLoading(true);
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

        // 새로 첨부하는 파일만 presignedUrl 발급 및 업로드
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

        // UUID와 구분자를 제외한 원본 파일명 추출
        const storedName = v4() + '-' + originalName;

        // 3. DiaryMedia.MutateDto 형태로 미디어 아이템 생성
        const mediaItem: Diary.DiaryMedia.MutateDto = {
          mediaId,
          originalName, // 원본 파일명
          storedName, // UUID 추가된 저장 파일명
          contentType, // 파일 타입 (MIME 타입)
          size, // 파일 크기
          url: accessUrl, // S3 접근 URL
          orderIndex, // 정렬 순서
        };

        newMediaItems.push(mediaItem);
      }

      // 모든 업로드가 성공하면 상태 업데이트 (기존 mediaList에 추가)
      setMediaList(prev => [...prev, ...newMediaItems]);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
      setErrorMessage('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
      setLoading(false);
      // 파일 선택 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // UpdateDto는 mediaList가 MutateDto[] 타입을 요구하므로 변환 불필요
    const formData: Diary.UpdateDto = {
      title: title,
      content: content,
      diaryDate: `${date}T${time}:00`, // 날짜와 시간 조합
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        sido: location.sido,
        sigungu: location.sigungu,
        eupmyeondong: location.eupmyeondong,
      },
      weatherInfo: weather,
      visibility: visibility,
      mediaList: mediaList, // MutateDto[] 타입 그대로 사용
      hashtagList: tags,
      thumbnailUrl: mediaList.length > 0 ? mediaList[0].url : undefined,
    };

    try {
      await DiaryService.updateDiary(diaryId as string, formData);
      alert('다이어리 수정 완료');
      // 수정 후 상세 페이지로 리다이렉션
      router.push(`/diaries/${diaryId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage('다이어리 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTagsString = () => {
    return tags.map(tag => `#${tag}`).join(' ');
  };

  // 위치 정보 새로고침 함수 추가
  const refreshLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
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
        setLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
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

  if (loading && !isUploading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

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
          value={date}
          onChange={handleDateChange}
          className='mx-auto border border-gray-300 rounded p-2'
        />
      </div>

      {/* 날씨 & 시간 선택 */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='flex flex-col items-center'>
          <label className='mb-1'>날씨</label>
          <select
            value={weather}
            onChange={handleWeatherChange}
            className='border border-gray-300 rounded p-2'
          >
            <option value={Diary.WeatherType.SUNNY}>☀️ 맑음</option>
            <option value={Diary.WeatherType.CLOUDY}>☁️ 흐림</option>
            <option value={Diary.WeatherType.RAINY}>🌧️ 비</option>
            <option value={Diary.WeatherType.SNOWY}>❄️ 눈</option>
          </select>
        </div>
        <div className='flex flex-col items-center'>
          <label className='mb-1'>시간</label>
          <input
            type='time'
            value={time}
            onChange={handleTimeChange}
            className='border border-gray-300 rounded p-2'
          />
        </div>
      </div>

      {/* 위치 & 태그 선택 */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <label className='block mb-1'>위치</label>
          <div className='flex items-center gap-2'>
            <div className='w-full'>
              <div className='p-2 bg-gray-50 border border-gray-300 rounded'>
                <p className='text-gray-700 font-medium text-sm'>
                  {location.sido} {location.sigungu} {location.eupmyeondong}
                </p>
                {locationError && <p className='text-xs text-red-500 mt-1'>{locationError}</p>}
              </div>
            </div>
            <button
              type='button'
              onClick={refreshLocation}
              className='text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 whitespace-nowrap flex-shrink-0'
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <span className='inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin'></span>
              ) : (
                '위치 갱신'
              )}
            </button>
          </div>
        </div>
        <div>
          <label className='block mb-1'>태그</label>
          <input
            type='text'
            value={getTagsString()}
            onChange={handleTagsChange}
            placeholder='#일상 #추억'
            className='w-full border border-gray-300 rounded p-2'
          />
        </div>
      </div>

      {/* 공개대상 선택 */}
      <div className='mb-6'>
        <label className='block mb-1'>공개대상</label>
        <select
          value={visibility}
          onChange={handleVisibilityChange}
          className='w-full border border-gray-300 rounded p-2'
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
        placeholder='제목'
        className='w-full border border-gray-300 rounded p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500'
        required
      />

      {/* 작성 영역 */}
      <div className='mb-2 font-medium'>작성</div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder='작성...'
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
          className={`px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm cursor-pointer flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
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
            disabled={loading}
          />
        </label>
        <button
          type='submit'
          className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:bg-blue-300 flex items-center'
          disabled={loading}
        >
          {loading && !isUploading ? (
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
              저장 중...
            </>
          ) : (
            '완료'
          )}
        </button>
      </div>
    </form>
  );
};

export default DiaryEditPage;
