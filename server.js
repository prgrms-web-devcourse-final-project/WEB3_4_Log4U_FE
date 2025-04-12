// server.js
import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';

const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// 인증서와 개인 키를 로드 (파일 경로는 실제 파일 위치에 맞게 수정)
const httpsOptions = {
  key: fs.readFileSync(
    './certificates/web.ec2-13-209-127-186.ap-northeast-2.compute.amazonaws.com+2-key.pem'
  ),
  cert: fs.readFileSync(
    './certificates/web.ec2-13-209-127-186.ap-northeast-2.compute.amazonaws.com+2.pem'
  ),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    // URL 파싱 (예: 쿼리스트링 등)
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
  });
});
