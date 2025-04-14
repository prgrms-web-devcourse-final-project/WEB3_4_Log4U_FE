import { User } from '@root/types/user';
import { axiosInstance } from './axios.instance';

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

  static async getUser(nickname: string): Promise<User.IDetail> {
    try {
      const { data } = await axiosInstance.request<User.IDetail>({
        url: `/users/${nickname}`,
        method: 'GET',
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
