// services/axios.instance.ts 파일을 수정

import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키 포함 설정 (중요)
});

// 응답 인터셉터 설정
let isRefreshing = false;
let refreshSubscribers: ((error: unknown) => void)[] = [];

// 리프레시 후 실패한 요청들을 재시도
const onRefreshed = () => {
  refreshSubscribers.forEach(callback => callback(null));
  refreshSubscribers = [];
};

// 실패한 요청을 대기열에 추가
const addRefreshSubscriber = (callback: (error: unknown) => void) => {
  refreshSubscribers.push(callback);
};

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 401 에러이고 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 대기열에 추가
        return new Promise(resolve => {
          addRefreshSubscriber(() => {
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 리프레시 API 호출 - 쿠키에 저장된 리프레시 토큰 사용
        // 여기서는 별도의 인스턴스를 생성하여 무한 루프를 방지합니다
        const refreshAxios = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
          withCredentials: true,
        });

        await refreshAxios.post('/oauth2/token/reissue');

        // 대기 중인 요청들 처리
        onRefreshed();

        // 원래 요청 재시도
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        window.location.href = '/login'; // 로그인 페이지로 리다이렉트
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
