import { axiosInstance } from './axios.instance';
import { Pagination } from '@root/types/pagination';
import { User } from '@root/types/user';

export class FollowService {
  private static readonly FOLLOW_API = (nickname: string) => `/users/${nickname}/follow`;
  private static readonly FOLLOWERS_API = '/users/me/followers';
  private static readonly FOLLOWINGS_API = '/users/me/followings';

  static async follow(nickname: string): Promise<void> {
    try {
      await axiosInstance.post(this.FOLLOW_API(nickname));
    } catch (error) {
      console.error('팔로우 실패:', error);
      throw error;
    }
  }

  static async unfollow(nickname: string): Promise<void> {
    try {
      await axiosInstance.delete(this.FOLLOW_API(nickname));
    } catch (error) {
      console.error('언팔로우 실패:', error);
      throw error;
    }
  }

  static async getFollowers(): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.FOLLOWERS_API
      );
      return response.data;
    } catch (error) {
      console.error('팔로워 조회 실패:', error);
      throw error;
    }
  }

  static async getFollowings(): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.FOLLOWINGS_API
      );
      return response.data;
    } catch (error) {
      console.error('팔로잉 조회 실패:', error);
      throw error;
    }
  }
}
