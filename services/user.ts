import { Pagination } from '@root/types/pagination';
import { axiosInstance } from './axios.instance';
import { User } from '@root/types/user';

export class UserService {
  private static GET_ME_API = '/users/me';

  static async getMe(): Promise<User.Me> {
    try {
      const { data } = await axiosInstance.request<User.Me>({
        url: this.GET_ME_API,
        method: 'GET',
      });

      return data;
    } catch (error) {
      console.error('Error fetching diary:', error);
      throw error; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }

  static async getUsers(nickname?: string): Promise<Pagination.ICursor<User.ISummary>> {
    try {
      const { data } = await axiosInstance.request<Pagination.ICursor<User.ISummary>>({
        url: '/users',
        method: 'GET',
        params: {
          nickname,
        },
      });

      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      const response = await axiosInstance.post('/oauth2/logout');
      return response.data;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  }
}
