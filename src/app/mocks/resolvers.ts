import { HttpResponse } from 'msw';

export const mockUserDetail = ({ request, params, cookies }) => {
  //   const data = await request.json();
  //   const { user_id } = params;
  //   const { session } = cookies;

  return HttpResponse.json({
    user_id: '123',
    user_name: 'User Name',
  });
};
