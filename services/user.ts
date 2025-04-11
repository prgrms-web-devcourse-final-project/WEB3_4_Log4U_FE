import { axiosInstance } from './axios.instance';

export class UserService {
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
