import { axiosInstance } from './axios.instance';
import { Diary } from '../types/diary';
import { Pagination } from '@root/types/pagination';
import { AxiosResponse } from 'axios';

// 다이어리 생성 API 호출 함수
export class DiaryService {
  private static CREATE_DIARY_API = '/diaries';
  private static UPDATE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static DELETE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static GET_DIARY_LIST_API = '/diaries/search';
  private static GET_MY_DIARY_LIST_API = (userId: number) => `/diaries/users/${userId}`;
  private static GET_DIARY_DETAIL_API = (id: number) => `/diaries/${id}`;

  static async createDiary(newDiary: Diary.CreateDto): Promise<void> {
    try {
      await axiosInstance.request<void, AxiosResponse<void>, Diary.CreateDto>({
        url: this.CREATE_DIARY_API,
        method: 'POST',
        data: newDiary,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error creating diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async updateDiary(id: string, updateDto: Diary.UpdateDto) {
    try {
      await axiosInstance.request<void, AxiosResponse<void>, Diary.UpdateDto>({
        url: this.UPDATE_DIARY_API(parseInt(id)),
        method: 'PATCH',
        data: updateDto,
      });
    } catch (error) {
      console.error('Error creating diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async getDiary(id: string): Promise<Diary.Detail> {
    try {
      const { data } = await axiosInstance.request<Diary.Detail>({
        url: this.GET_DIARY_DETAIL_API(parseInt(id)),
        method: 'GET',
      });

      return data;
    } catch (error) {
      console.error('Error fetching diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async deleteDiary(diaryId: string) {
    try {
      await axiosInstance.request<Diary.Detail>({
        url: this.DELETE_DIARY_API(parseInt(diaryId)),
        method: 'GET',
      });
    } catch (error) {
      console.error('Error deleting diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async getDiaries(params: Diary.GetListCursorDto) {
    try {
      return await axiosInstance
        .request<Pagination.IOffSet<Diary.Summary>>({
          url: this.GET_DIARY_LIST_API,
          method: 'GET',
          params,
        })
        .then(response => {
          return response.data;
        });
    } catch (e) {
      console.error('Error fetching diaries:', e);
      throw e; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async getMyDiaries(
    userId: number,
    options?: Pagination.CursorDto
  ): Promise<Pagination.ICursor<Diary.Summary>> {
    try {
      // 쿼리 파라미터 설정
      const params: Record<string, string> = {};

      if (options?.cursorId) {
        params.cursor = String(options.cursorId);
      }

      if (options?.size) {
        params.size = String(options.size);
      }

      return await axiosInstance
        .request<Pagination.ICursor<Diary.Summary>>({
          url: this.GET_MY_DIARY_LIST_API(userId),
          method: 'GET',
          params: params,
        })
        .then(response => {
          return response.data;
        });
    } catch (e) {
      console.error('Error fetching diaries:', e);
      throw e; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }
}
