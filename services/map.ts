import { axiosInstance } from './axios.instance';
import { Map } from '@root/types/map';

export class MapService {
  private static readonly GET_MY_MAP_CLUSTER_API = '/maps/diaries/my/cluster';
  private static readonly GET_MAP_CLUSTER_API = '/maps/diaries/cluster';
  private static readonly GET_MY_MAP_DIARIES_API = '/maps/diaries/my';
  private static readonly GET_MAP_DIARIES_API = '/maps/diaries';

  static async getMyMapCluster(query: Map.GetListQueryDto): Promise<Map.ISummary[]> {
    try {
      const response = await axiosInstance.get<Map.ISummary[]>(this.GET_MY_MAP_CLUSTER_API, {
        params: query,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching map cluster:', error);
      throw error;
    }
  }

  static async getMyMapDiaries(query: Map.GetListQueryDto): Promise<Map.IDiary.IDetail[]> {
    try {
      const response = await axiosInstance.get<Map.IDiary.IDetail[]>(this.GET_MY_MAP_DIARIES_API, {
        params: query,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching map diaries:', error);
      throw error;
    }
  }

  static async getMapDiaries(query: Map.GetListQueryDto): Promise<Map.IDiary.IDetail[]> {
    try {
      const response = await axiosInstance.get<Map.IDiary.IDetail[]>(this.GET_MAP_DIARIES_API, {
        params: query,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching map diaries:', error);
      throw error;
    }
  }

  static async getMapCluster(query: Map.GetListQueryDto): Promise<Map.ISummary[]> {
    try {
      const response = await axiosInstance.get<Map.ISummary[]>(this.GET_MAP_CLUSTER_API, {
        params: query,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching map cluster:', error);
      throw error;
    }
  }
}
