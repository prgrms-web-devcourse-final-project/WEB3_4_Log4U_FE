import { http, HttpResponse } from 'msw';

// 기본 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 페이지네이션 타입 정의
namespace Pagination {
  export interface OffsetMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  }

  export interface IOffSet<T> {
    list: T[];
    pageInfo: OffsetMeta;
  }
}

// Presigned URL 응답 타입 정의
interface PresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
  mediaId: number;
}

// 모의 사용자 데이터
const mockUser = {
  id: 1,
  name: '테스트 사용자',
  email: 'test@example.com',
  profileImage: 'https://example.com/profile.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 모의 다이어리 미디어 데이터
const mockMedia = [
  {
    mediaId: 1,
    originalName: 'image1.jpg',
    contentType: 'image/jpeg',
    size: 12345,
    url: 'https://example.com/image1.jpg',
    orderIndex: 0,
  },
  {
    mediaId: 2,
    originalName: 'video1.mp4',
    contentType: 'video/mp4',
    size: 54321,
    url: 'https://example.com/video1.mp4',
    orderIndex: 1,
  },
];

// 모의 다이어리 데이터
const mockDiaries = [
  {
    id: 1,
    userId: 1,
    title: '오늘의 일기',
    content: '오늘은 날씨가 좋아서 산책을 다녀왔습니다.',
    weather: '맑음',
    temperature: 23,
    visibility: 'PUBLIC',
    mediaList: [mockMedia[0]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: '비오는 날의 기록',
    content: '비가 와서 집에서 책을 읽었습니다.',
    weather: '비',
    temperature: 18,
    visibility: 'PRIVATE',
    mediaList: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 다이어리 생성 요청 타입 정의
interface DiaryCreateRequest {
  title: string;
  content: string;
  weather: string;
  temperature: number;
  visibility: string;
  mediaList: Array<{
    mediaId: number;
    originalName: string;
    contentType: string;
    size: number;
    url: string;
    orderIndex: number;
  }>;
}

// Presigned URL 요청 타입 정의
interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export const handlers = [
  // 사용자 정보 조회
  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // 다이어리 목록 조회 (페이징)
  http.get(`${API_BASE_URL}/diaries`, ({ request }) => {
    const url = new URL(request.url);
    const size = url.searchParams.get('size') || '10';
    const page = url.searchParams.get('page') || '0';

    const response: Pagination.IOffSet<(typeof mockDiaries)[0]> = {
      list: mockDiaries,
      pageInfo: {
        page: parseInt(page),
        size: parseInt(size),
        totalElements: mockDiaries.length,
        totalPages: Math.ceil(mockDiaries.length / parseInt(size)),
        hasNext: false,
      },
    };

    return HttpResponse.json(response);
  }),

  // 사용자별 다이어리 목록 조회
  http.get(`${API_BASE_URL}/diaries/users/:userId`, ({ params }) => {
    const userDiaries = mockDiaries.filter(d => d.userId === Number(params.userId));

    const response: Pagination.IOffSet<(typeof mockDiaries)[0]> = {
      list: userDiaries,
      pageInfo: {
        page: 0,
        size: 10,
        totalElements: userDiaries.length,
        totalPages: Math.ceil(userDiaries.length / 10),
        hasNext: false,
      },
    };

    return HttpResponse.json(response);
  }),

  // 다이어리 상세 조회
  http.get(`${API_BASE_URL}/diaries/:diaryId`, ({ params }) => {
    const diary = mockDiaries.find(d => d.id === Number(params.diaryId));

    if (!diary) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(diary);
  }),

  // 다이어리 생성
  http.post(`${API_BASE_URL}/diaries`, async ({ request }) => {
    const requestData = (await request.json()) as DiaryCreateRequest;

    const newDiary = {
      id: mockDiaries.length + 1,
      userId: mockUser.id,
      title: requestData.title,
      content: requestData.content,
      weather: requestData.weather,
      temperature: requestData.temperature,
      visibility: requestData.visibility,
      mediaList: requestData.mediaList || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDiaries.push(newDiary);

    return HttpResponse.json(newDiary);
  }),

  // S3 Presigned URL 발급
  http.post(`${API_BASE_URL}/media/presinged-url`, async ({ request }) => {
    const requestData = (await request.json()) as PresignedUrlRequest;

    const mediaId = Math.floor(Math.random() * 10000);

    const response: PresignedUrlResponse = {
      presignedUrl: `https://example-bucket.s3.amazonaws.com/${requestData.fileName}`,
      fileUrl: `https://cdn.example.com/${requestData.fileName}`,
      mediaId: mediaId,
    };

    return HttpResponse.json(response);
  }),

  // 로그아웃
  http.post(`${API_BASE_URL}/oauth2/logout`, () => {
    return HttpResponse.json({ success: true });
  }),
];
