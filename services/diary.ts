import { axiosInstance } from "./axios.instance";
import { Diary } from "../types/diary";

// 다이어리 생성 API 호출 함수
export class DiaryService {
  private static CREATE_DIARY_API = "/diaries";
  private static GET_DIARY_LIST_API = "/diaries";
  private static GET_DIARY_DETAIL_API = (id: number) => `/diaries/${id}`;

  static async createDiary(newDiary: Diary.CreateDto): Promise<void> {
    console.log(process.env.NEXT_PUBLIC_API_BASE_URL, "API_BASE_URL");
    console.log("hi");
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
}
