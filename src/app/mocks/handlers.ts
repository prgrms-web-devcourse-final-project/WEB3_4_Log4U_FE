import { http, HttpResponse } from 'msw';
import { mockUserDetail } from './resolvers';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log('NEXT_PUBLIC_API_BASE_URL', NEXT_PUBLIC_API_BASE_URL);

export const handlers = [
  http.get(`${NEXT_PUBLIC_API_BASE_URL}/users/me`, mockUserDetail),
  http.get(`${NEXT_PUBLIC_API_BASE_URL}/api/example`, () => {
    return HttpResponse.json({ message: 'Mocked response' });
  }),
];
