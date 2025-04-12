import { Like } from '@root/types/like';
import { AxiosResponse } from 'axios';
import { axiosInstance } from './axios.instance';

export class LikeService {
  private static readonly CREATE_LIKE_API = `/likes`;

  private static readonly DELETE_LIKE_API = (diaryId: number) => `/likes/${diaryId}`;

  static async createLike(diaryId: number): Promise<Like.Detail> {
    const response = await axiosInstance.post<
      Like.Detail,
      AxiosResponse<Like.Detail>,
      Like.CreateDto
    >(LikeService.CREATE_LIKE_API, {
      diaryId,
    });

    return response.data;
  }

  static async deleteLike(diaryId: number): Promise<Like.Detail> {
    const response = await axiosInstance.delete<Like.Detail>(LikeService.DELETE_LIKE_API(diaryId));

    return response.data;
  }
}
