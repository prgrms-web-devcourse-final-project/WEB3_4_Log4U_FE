'use client';

import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Diary } from '@root/types/diary';
import { DiaryService } from '@root/services/diary';

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
  const [mediaList, setMediaList] = useState<Diary.DiaryMedia[]>([]);

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
          if (data.mediaList) {
            setMediaList(data.mediaList);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    // Diary.CreateDto 형식에 맞게 데이터 구성
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
      mediaList: mediaList,
      hashtagList: tags,
      thumbnailUrl: mediaList.length > 0 ? mediaList[0].url : undefined,
    };

    console.log('formData', formData);
    try {
      await DiaryService.updateDiary(diaryId as string, formData);
      alert('다이어리 수정 완료');
      // 수정 후 상세 페이지로 리다이렉션
      router.push(`/diaries/${diaryId}`);
    } catch (error) {
      console.error(error);
      alert('다이어리 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTagsString = () => {
    return tags.map(tag => `#${tag}`).join(' ');
  };

  if (loading) {
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
          <select className='w-full border border-gray-300 rounded p-2'>
            <option value={`${location.sido} ${location.sigungu}`}>
              {location.sido} {location.sigungu}
            </option>
          </select>
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

      {/* 하단 버튼 영역 */}
      <div className='flex justify-between'>
        <button
          type='button'
          className='px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm'
          disabled={loading}
        >
          파일 첨부
        </button>
        <button
          type='submit'
          className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={loading}
        >
          {loading ? '저장 중...' : '완료'}
        </button>
      </div>
    </form>
  );
};

export default DiaryEditPage;
