import { Pagination } from '@root/types/pagination';
import { axiosInstance } from './axios.instance';
import { Comment } from '@root/types/comment';
import { AxiosResponse } from 'axios';

export class CommentService {
  private static readonly GET_COMMENT_API = (diaryId: string) => `/comments/${diaryId}`;
  private static readonly CREATE_COMMENT_API = `/comments`;
  private static readonly DELETE_COMMENT_API = (commentId: string) => `/comments/${commentId}`;

  static async getComments(
    diaryId: string,
    query: Comment.GetListCursorDto
  ): Promise<Pagination.ICursor<Comment.Summary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<Comment.Summary>>(
        CommentService.GET_COMMENT_API(diaryId),
        {
          params: query,
        }
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async createComment(diaryId: string, content: string) {
    try {
      const response = await axiosInstance.post<
        Comment.Detail,
        AxiosResponse<Comment.Detail>,
        Comment.CreateDto
      >(CommentService.CREATE_COMMENT_API, {
        diaryId: Number(diaryId),
        content,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async deleteComment(commentId: string) {
    try {
      const response = await axiosInstance.delete<void, AxiosResponse<void>>(
        CommentService.DELETE_COMMENT_API(commentId)
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
