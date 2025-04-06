import { axiosInstance } from "./axios.instance";
import { Diary } from "../types/diary";
import { Pagination } from "@root/types/pagination";

// 다이어리 생성 API 호출 함수
export class DiaryService {
  private static CREATE_DIARY_API = "/diaries";
  private static UPDATE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static DELETE_DIARY_API = (id: number) => `/diaries/${id}`;
  private static GET_DIARY_LIST_API = "/diaries";
  private static GET_DIARY_DETAIL_API = (id: number) => `/diaries/${id}`;

  static async createDiary(newDiary: Diary.CreateDto): Promise<void> {
    try {
      await axiosInstance.request<unknown, void, Diary.CreateDto>({
        url: this.CREATE_DIARY_API,
        method: "POST",
        data: newDiary,
      });
    } catch (error) {
      console.error("Error creating diary:", error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async updateDiary(id: string, updateDto: Diary.UpdateDto) {
    try {
      await axiosInstance.request<unknown, void, Diary.UpdateDto>({
        url: this.UPDATE_DIARY_API(parseInt(id)),
        method: "PATCH",
        data: updateDto,
      });
    } catch (error) {
      console.error("Error creating diary:", error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async getDiary(id: string): Promise<Diary.Detail> {
    try {
      const { data } = await axiosInstance.request<Diary.Detail>({
        url: this.GET_DIARY_DETAIL_API(parseInt(id)),
        method: "GET",
      });

      return data;
    } catch (error) {
      console.error("Error fetching diary:", error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async deleteDiary(diaryId: string) {
    try {
      await axiosInstance.request<Diary.Detail>({
        url: this.DELETE_DIARY_API(parseInt(diaryId)),
        method: "GET",
      });
    } catch (error) {
      console.error("Error deleting diary:", error);
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
          method: "GET",
          params,
        })
        .then((response) => {
          return response.data;
        });
    } catch (e) {
      console.error("Error fetching diaries:", e);
      throw e; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }
}
