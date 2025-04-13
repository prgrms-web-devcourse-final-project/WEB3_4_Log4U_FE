import { axiosInstance } from './axios.instance';

export interface PresignedUrlResponse {
  presignedUrl: string;
  accessUrl: string;
  mediaId: number;
}

export class MediaService {
  private static PRESIGNED_URL_API = '/media/presigned-url';

  /**
   * 백엔드에서 S3 presigned URL을 가져옵니다.
   * @param filename 파일 이름
   * @param contentType 파일 타입 (MIME 타입)
   * @param size 파일 크기 (바이트)
   * @returns presigned URL, 접근 가능한 파일 URL, 미디어 ID
   */
  static async getPresignedUrl(
    filename: string,
    contentType: string,
    size: number
  ): Promise<PresignedUrlResponse> {
    try {
      const { data } = await axiosInstance.request<PresignedUrlResponse>({
        url: this.PRESIGNED_URL_API,
        method: 'POST',
        data: {
          filename,
          contentType,
          size,
        },
      });

      console.log(data);
      return data;
    } catch (error) {
      console.error('Presigned URL 가져오기 오류:', error);
      throw error;
    }
  }

  /**
   * S3에 파일을 업로드합니다. (XMLHttpRequest 사용)
   * @param presignedUrl S3 presigned URL
   * @param file 업로드할 파일
   * @param fileId 파일 식별자 (진행률 추적용)
   * @param contentType 파일 타입 (MIME 타입)
   * @param onProgress 진행 상태 콜백 함수 (0-100)
   */
  static async uploadFileToS3(
    presignedUrl: string,
    file: File,
    fileId: string,
    contentType: string,
    onProgress?: (fileId: string, progress: number) => void
  ): Promise<void> {
    try {
      // XMLHttpRequest를 사용하여 업로드 진행 상태 추적
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 업로드 진행 이벤트 리스너
        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(fileId, percentComplete);
          }
        });

        // 업로드 완료 이벤트 리스너
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) onProgress(fileId, 100);
            resolve();
          } else {
            reject(new Error(`S3 업로드 실패: ${xhr.status} ${xhr.statusText}`));
          }
        });

        // 오류 이벤트 리스너
        xhr.addEventListener('error', () => {
          reject(new Error('S3 업로드 중 네트워크 오류가 발생했습니다.'));
        });

        // 업로드 취소 이벤트 리스너
        xhr.addEventListener('abort', () => {
          reject(new Error('S3 업로드가 취소되었습니다.'));
        });

        // 요청 설정 및 전송
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.send(file);
      });
    } catch (error) {
      console.error('S3 업로드 오류:', error);
      throw error;
    }
  }
}
