import { User } from '@root/types/user';
import { axiosInstance } from './axios.instance';
import { AxiosResponse } from 'axios';

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

  static async validateNickname(nickname: string): Promise<{ available: boolean }> {
    try {
      const { data } = await axiosInstance.get<{ available: boolean }>(
        `/users/validation/${nickname}`
      );
      return data;
    } catch (error) {
      console.error('Error checking nickname:', error);
      throw error;
    }
  }

  static async createProfile(body: User.CreateProfileDto) {
    try {
      await axiosInstance.post<void, AxiosResponse<void>, User.CreateProfileDto>(
        '/users/profile/make',
        body
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  static async updateProfile(body: User.UpdateProfileDto) {
    try {
      await axiosInstance.put<void, AxiosResponse<void>, User.UpdateProfileDto>('/users/me', body);
    } catch (error) {
      console.error('Error updating profile:', error);
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
