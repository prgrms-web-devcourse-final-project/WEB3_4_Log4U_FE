export namespace ImageUtil {
  export function randomPicture(width: number, height: number): string {
    return `https://picsum.photos/${width}/${height}`;
  }

  // 이미지 URL을 Base64로 변환하는 함수
  export const convertImageToBase64 = async (imageUrl: string) => {
    try {
      // 이미지를 가져옵니다
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Blob을 Base64로 변환
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('이미지 변환 중 오류 발생:', error);
      // 오류 발생 시 기본 이미지 반환 (선택사항)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }
  };

  // Base64 이미지를 사용한 커스텀 마커 생성 함수
  export const createBase64MarkerIcon = (base64Image: string) => {
    // SVG 마커 템플릿
    const svg = `
    <svg width="40" height="54" viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- 핀 형태 배경 -->
      <path fill="#FFFFFF" stroke="#DDDDDD" stroke-width="2" d="M20,2 C9.07,2 0.5,10.57 0.5,21.5 C0.5,34.67 12.99,43.67 20,52 C27.01,43.67 39.5,34.67 39.5,21.5 C39.5,10.57 30.93,2 20,2 Z" />
      
      <!-- 클리핑 패스 (이미지를 원형으로 자르기 위함) -->
      <defs>
        <clipPath id="circleClip">
          <circle cx="20" cy="21" r="15" />
        </clipPath>
      </defs>
      
      <!-- 원형으로 잘린 이미지 -->
      <image clip-path="url(#circleClip)" x="5" y="6" width="30" height="30" xlink:href="${base64Image}" />
      
      <!-- 이미지 테두리 -->
      <circle cx="20" cy="21" r="15" fill="none" stroke="#FFFFFF" stroke-width="2" />
    </svg>
    `;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };
}
