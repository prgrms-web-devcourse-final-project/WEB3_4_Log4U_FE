import { axiosInstance } from './axios.instance';
import { Pagination } from '@root/types/pagination';
import { User } from '@root/types/user';

export class FollowService {
  private static readonly FOLLOW_API = (nickname: string) => `/users/${nickname}/follow`;
  private static readonly FOLLOWERS_API = (nickname: string) => `/users/${nickname}/followers`;
  private static readonly FOLLOWINGS_API = (nickname: string) => `/users/${nickname}/followings`;
  private static readonly MY_FOLLOWERS_API = '/users/me/followers';
  private static readonly MY_FOLLOWINGS_API = '/users/me/followings';

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

  static async getMyFollowers(): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.MY_FOLLOWERS_API
      );
      return response.data;
    } catch (error) {
      console.error('팔로워 조회 실패:', error);
      throw error;
    }
  }

  static async getMyFollowings(): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.MY_FOLLOWINGS_API
      );
      return response.data;
    } catch (error) {
      console.error('팔로잉 조회 실패:', error);
      throw error;
    }
  }

  static async getFollowers(nickname: string): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.FOLLOWERS_API(nickname)
      );
      return response.data;
    } catch (error) {
      console.error('팔로워 조회 실패:', error);
      throw error;
    }
  }

  static async getFollowings(nickname: string): Promise<Pagination.ICursor<User.IFollowSummary>> {
    try {
      const response = await axiosInstance.get<Pagination.ICursor<User.IFollowSummary>>(
        this.FOLLOWINGS_API(nickname)
      );
      return response.data;
    } catch (error) {
      console.error('팔로잉 조회 실패:', error);
      throw error;
    }
  }
}
