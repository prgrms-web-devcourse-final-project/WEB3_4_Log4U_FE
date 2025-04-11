'use client';

import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Diary } from '@root/types/diary';
import { DiaryService } from '@root/services/diary';

const DiaryEditPage: FC = () => {
  const params = useParams();
  const { diaryId } = params;

  // 초기값: 오늘 날짜(YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(today);
  const [weather, setWeather] = useState<Diary.WeatherType>(Diary.WeatherType.SUNNY);
  const [time, setTime] = useState<string>('18:00');
  const [tags, setTags] = useState<string>('#일상 #추억');
  const [visibility, setVisibility] = useState<Diary.Visibility>(Diary.Visibility.PUBLIC);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    error: string | null;
  }>({
    latitude: null,
    longitude: null,
    error: null,
  });

  // Path variable인 diaryId가 존재하면, 해당 다이어리 정보를 조회해서 기본값으로 설정
  useEffect(() => {
    if (diaryId) {
      // diaryId가 query parameter로 들어오므로 string으로 캐스팅
      DiaryService.getDiary(diaryId as string)
        .then(data => {
          // 백엔드에서 전달받은 data의 필드명과 구조에 맞게 수정하세요.
          // setDate(data.date);
          setWeather(data.weatherInfo);
          // setTime(data.time);
          // setTags(data.tags);
          setVisibility(data.visibility);
          setTitle(data.title);
          setContent(data.content);
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            error: null,
          });
        })
        .catch(error => {
          console.error('Failed to load diary', error);
          // 에러 발생 시 에러 처리 로직 추가 가능 (예: 알림, 리다이렉션 등)
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
    setTags(e.target.value);
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

    // 다이어리 수정에 필요한 DTO는 프로젝트 규칙에 맞게 수정합니다.
    const formData: Diary.CreateDto = {
      content: content,
      latitude: location.latitude!,
      longitude: location.longitude!,
      mediaList: [], // 파일 첨부 기능이 있다면 처리
      title: title,
      visibility: visibility,
      weatherInfo: weather,
      // @todo: 추후 수정 필요.
      thumbnailUrl: '',
    };

    console.log('formData', formData);
    try {
      await DiaryService.updateDiary(diaryId as string, formData);
      alert('다이어리 수정 완료');
      // 수정 후 원하는 페이지로 리다이렉션
    } catch (error) {
      console.error(error);
      alert('서버 오류');
    }
  };

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
            <option value='서울특별시 강남구'>서울특별시 강남구</option>
            <option value='서울특별시 종로구'>서울특별시 종로구</option>
            <option value='부산광역시 해운대구'>부산광역시 해운대구</option>
          </select>
        </div>
        <div>
          <label className='block mb-1'>태그</label>
          <input
            type='text'
            value={tags}
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
          <option value='전체'>전체</option>
          <option value='비공개'>비공개</option>
          <option value='팔로워만'>팔로워만</option>
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
      />

      {/* 작성 영역 */}
      <div className='mb-2 font-medium'>작성</div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder='작성...'
        className='w-full border border-gray-300 rounded p-2 mb-6 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
      />

      {/* 하단 버튼 영역 */}
      <div className='flex justify-between'>
        <button
          type='button'
          className='px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm'
        >
          파일 첨부
        </button>
        <button
          type='submit'
          className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm'
        >
          완료
        </button>
      </div>
    </form>
  );
};

export default DiaryEditPage;
