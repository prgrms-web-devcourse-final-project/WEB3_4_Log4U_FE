async function initMocks() {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 다른 방식으로 모킹 설정
    try {
      const { server } = await import('./server');
      server.listen({ onUnhandledRequest: 'bypass' });
      console.log('MSW 서버가 설정되었습니다.');
    } catch (error) {
      console.error('MSW 서버 초기화 실패:', error);
    }
  } else {
    // 브라우저 환경에서는 워커 사용
    try {
      const { worker } = await import('./browser');
      worker.start({ onUnhandledRequest: 'bypass' });
      console.log('MSW 브라우저 워커가 설정되었습니다.');
    } catch (error) {
      console.error('MSW 브라우저 초기화 실패:', error);
    }
  }
}

// 개발 환경에서만 MSW 초기화
if (process.env.NODE_ENV === 'development') {
  initMocks().catch(error => {
    console.error('MSW 초기화 실패:', error);
  });
}

export {};
