import { Pagination } from '@root/types/pagination';
import { axiosInstance } from './axios.instance';
import { Comment } from '@root/types/comment';

export class CommentService {
  static async getComments(
    diaryId: string,
    query: Comment.GetListCursorDto
  ): Promise<Pagination.ICursor<Comment.Summary>> {
    const response = await axiosInstance.get<Pagination.ICursor<Comment.Summary>>(
      `/comments/${diaryId}`,
      {
        params: query,
      }
    );
    return response.data;
  }

  static async createComment(diaryId: string, comment: string) {
    const response = await axiosInstance.post(`/comments/${diaryId}`, {
      comment: comment,
    });
    return response.data;
  }
}
