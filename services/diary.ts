import { axiosInstance } from './axios.instance';
import { Diary } from '../types/diary';
import { Pagination } from '@root/types/pagination';

// 다이어리 생성 API 호출 함수
export class DiaryService {
  private static CREATE_DIARY_API = '/diaries';
  private static UPDATE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static DELETE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static GET_DIARY_LIST_API = '/diaries';
  private static GET_DIARY_DETAIL_API = (id: number) => `/diaries/${id}`;

  static async createDiary(newDiary: Diary.CreateDto): Promise<void> {
    try {
      console.log('Creating diary:', newDiary);

      // 만약 파일 첨부가 있다면 FormData로 변환해서 처리
      if (newDiary.mediaList && newDiary.mediaList.length > 0) {
        const formData = new FormData();

        // 다이어리 데이터를 JSON으로 변환하여 추가
        const diaryDataWithoutMedia = { ...newDiary, mediaList: undefined };
        formData.append(
          'diary',
          new Blob([JSON.stringify(diaryDataWithoutMedia)], { type: 'application/json' })
        );

        // 파일 추가
        newDiary.mediaList.forEach(media => {
          // 이미 URL이 있는 경우 파일 객체로 변환 (클라이언트 측에서만 사용)
          if (media.url && media.url.startsWith('blob:')) {
            // URL에서 파일 가져오기 로직이 필요함 (여기서는 구현하지 않음)
            // 실제 구현 시 fetch 등을 사용하여 blob URL에서 파일을 가져와야 함
          }

          // 실제 API에 맞게 조정 필요
          // formData.append('files', file);
        });

        await axiosInstance.request({
          url: this.CREATE_DIARY_API,
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // 일반 JSON 요청
        await axiosInstance.request<unknown, void, Diary.CreateDto>({
          url: this.CREATE_DIARY_API,
          method: 'POST',
          data: newDiary,
        });
      }
    } catch (error) {
      console.error('Error creating diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async updateDiary(id: string, updateDto: Diary.UpdateDto) {
    try {
      await axiosInstance.request<unknown, void, Diary.UpdateDto>({
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

  static async getDiaries(params: {
    size: string;
    visibility: string;
    page: string;
    sort: string;
  }) {
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
}
