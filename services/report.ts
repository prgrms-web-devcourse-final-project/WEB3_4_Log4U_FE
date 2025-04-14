import { AxiosResponse } from 'axios';
import { axiosInstance } from './axios.instance';
import { Report } from '@root/types/report';

export class ReportService {
  private static readonly DIARY_REPORT_API = (diaryId: string) => `/reports/diaries/${diaryId}`;
  private static readonly COMMENT_REPORT_API = (commentId: string) =>
    `/reports/comments/${commentId}`;

  static async reportDiary(diaryId: string, body: Report.CreateDto) {
    const response = await axiosInstance.post<void, AxiosResponse<void>, Report.CreateDto>(
      ReportService.DIARY_REPORT_API(diaryId),
      body
    );
    return response.data;
  }

  static async reportComment(commentId: string, body: Report.CreateDto) {
    const response = await axiosInstance.post<void, AxiosResponse<void>, Report.CreateDto>(
      ReportService.COMMENT_REPORT_API(commentId),
      body
    );
    return response.data;
  }
}
