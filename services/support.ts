import { Support } from '@root/types/support';
import { AxiosResponse } from 'axios';
import { axiosInstance } from './axios.instance';
import { Pagination } from '@root/types/pagination';

export class SupportService {
  private static readonly CREATE_SUPPORT_API = '/supports';
  private static readonly GET_MY_SUPPORTS_API = '/supports';
  private static readonly GET_MY_SUPPORT_API = (supportId: number) => `/supports/${supportId}`;

  static async createSupport(support: Support.CreateDto): Promise<Support.IDetail> {
    const response = await axiosInstance.post<Support.IDetail, AxiosResponse<Support.IDetail>>(
      this.CREATE_SUPPORT_API,
      support
    );

    return response.data;
  }

  static async getSupport(supportId: number): Promise<Support.IDetail> {
    const response = await axiosInstance.get<Support.IDetail, AxiosResponse<Support.IDetail>>(
      this.GET_MY_SUPPORT_API(supportId)
    );

    return response.data;
  }

  static async getSupports(): Promise<Pagination.IOffSet<Support.ISummary>> {
    const response = await axiosInstance.get<Pagination.IOffSet<Support.ISummary>>(
      this.GET_MY_SUPPORTS_API
    );

    return response.data;
  }
}
