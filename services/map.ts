import { axiosInstance } from './axios.instance';
import { Map } from '@root/types/map';

export class MapService {
  private static readonly GET_MY_MAP_CLUSTER_API = '/maps/my/diaries/clusters';
  private static readonly GET_MAP_CLUSTER_API = '/maps/diaries/cluster';
  private static readonly GET_MY_MAP_DIARIES_API = '/maps/my/diaries/marker';
  private static readonly GET_MAP_DIARIES_API = '/maps/diaries/marker';
  private static readonly GET_GEOLOCATION_API = '/maps/location';

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

  static async getGeolocation(latitude: number, longitude: number): Promise<Map.IGeolocation> {
    try {
      const { data } = await axiosInstance.request<Map.IGeolocation>({
        url: this.GET_GEOLOCATION_API,
        method: 'GET',
        params: {
          coords: `${longitude},${latitude}`,
          output: 'json',
        },
      });
      return data;
    } catch (e) {
      console.error('Error fetching diaries:', e);
      throw e; // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록 합니다.
    }
  }
}
