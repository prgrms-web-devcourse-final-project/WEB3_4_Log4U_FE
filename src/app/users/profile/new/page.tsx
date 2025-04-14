'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@root/services/user';
import { MediaService } from '@root/services/media';
import { User } from '@root/types/user';
import Image from 'next/image';

export default function ProfileSetupPage() {
  const router = useRouter();

  // 상태 관리
  const [nickname, setNickname] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 유효성 검사 상태
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 중복 닉네임 체크 함수
  const checkNickname = async () => {
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요');
      setNicknameAvailable(false);
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setNicknameError('닉네임은 2~20자 사이여야 합니다');
      setNicknameAvailable(false);
      return;
    }

    try {
      setNicknameChecking(true);
      const result = await UserService.validateNickname(nickname);

      if (result.available) {
        setNicknameError('');
        setNicknameAvailable(true);
      } else {
        setNicknameError('이미 사용 중인 닉네임입니다');
        setNicknameAvailable(false);
      }
    } catch (error) {
      console.error('닉네임 확인 중 오류 발생:', error);
      setNicknameError('닉네임 확인 중 오류가 발생했습니다');
      setNicknameAvailable(false);
    } finally {
      setNicknameChecking(false);
    }
  };

  // 이미지 업로드 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 이미지 타입 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 미리보기 설정
    const reader = new FileReader();
    reader.onload = event => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 이미지 업로드 시작
    uploadImage(file);
  };

  // S3에 이미지 업로드
  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Presigned URL 획득
      const presignedData = await MediaService.getPresignedUrl(file.name, file.type, file.size);

      // S3에 파일 업로드
      await MediaService.uploadFileToS3(
        presignedData.presignedUrl,
        file,
        'profile-image',
        file.type,
        (_, progress) => {
          setUploadProgress(progress);
        }
      );

      // 업로드 완료 후 S3 URL 설정
      setProfileImage(presignedData.accessUrl);
    } catch (error) {
      console.error('이미지 업로드 중 오류 발생:', error);
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  // 프로필 생성 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 유효성 검사
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    if (!nicknameAvailable) {
      alert('닉네임 중복 확인을 진행해주세요');
      return;
    }

    if (!profileImage) {
      alert('프로필 이미지를 업로드해주세요');
      return;
    }

    try {
      setIsSubmitting(true);

      // 프로필 생성 API 호출
      const profileData: User.CreateProfileDto = {
        nickname: nickname.trim(),
        statusMessage: statusMessage.trim(),
        profileImage: profileImage,
      };

      await UserService.createProfile(profileData);

      // 프로필 생성 완료 후 홈으로 이동
      alert('프로필 설정이 완료되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('프로필 생성 중 오류 발생:', error);
      alert('프로필 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 닉네임 입력 변경 시 중복 확인 상태 초기화
  useEffect(() => {
    setNicknameAvailable(false);
    if (nickname.trim()) {
      setNicknameError('');
    }
  }, [nickname]);

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden'>
        <div className='bg-indigo-600 px-6 py-4'>
          <h2 className='text-xl font-bold text-white text-center'>프로필 설정</h2>
          <p className='text-indigo-200 text-center mt-1'>Log4U에서 사용할 프로필을 설정해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-8 space-y-6'>
          {/* 프로필 이미지 업로드 */}
          <div className='flex flex-col items-center'>
            <div
              className='w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer relative overflow-hidden group'
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <>
                  <Image src={previewImage} alt='프로필 미리보기' fill className='object-cover' />
                  <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center'>
                    <span className='text-white opacity-0 group-hover:opacity-100'>변경하기</span>
                  </div>
                </>
              ) : (
                <div className='text-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-10 w-10 text-gray-400 mx-auto'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                  <p className='text-xs text-gray-500 mt-1'>이미지 추가</p>
                </div>
              )}

              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageChange}
                accept='image/*'
                className='hidden'
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className='mt-2 w-full max-w-xs'>
                <div className='w-full bg-gray-200 rounded-full h-2.5'>
                  <div
                    className='bg-indigo-600 h-2.5 rounded-full transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className='text-xs text-gray-500 text-center mt-1'>
                  {uploadProgress < 100 ? '업로드 중...' : '업로드 완료!'}
                </p>
              </div>
            )}
          </div>

          {/* 닉네임 입력 */}
          <div>
            <div className='flex justify-between items-end mb-1'>
              <label htmlFor='nickname' className='block text-sm font-medium text-gray-700'>
                닉네임
              </label>
              <span className='text-xs text-gray-500'>2~20자 이내</span>
            </div>
            <div className='relative rounded-md shadow-sm'>
              <input
                type='text'
                id='nickname'
                name='nickname'
                className={`block w-full px-4 py-3 rounded-md border ${
                  nicknameError
                    ? 'border-red-300'
                    : nicknameAvailable
                      ? 'border-green-300'
                      : 'border-gray-300'
                } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder='사용할 닉네임을 입력해주세요'
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                required
              />
              <div className='absolute inset-y-0 right-0 flex items-center'>
                <button
                  type='button'
                  className='h-full px-3 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed'
                  onClick={checkNickname}
                  disabled={!nickname.trim() || nicknameChecking}
                >
                  {nicknameChecking ? (
                    <svg
                      className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                  ) : (
                    '중복 확인'
                  )}
                </button>
              </div>
            </div>
            {nicknameError && <p className='mt-1 text-sm text-red-600'>{nicknameError}</p>}
            {nicknameAvailable && (
              <p className='mt-1 text-sm text-green-600'>사용 가능한 닉네임입니다!</p>
            )}
          </div>

          {/* 상태 메시지 입력 */}
          <div>
            <div className='flex justify-between items-end mb-1'>
              <label htmlFor='statusMessage' className='block text-sm font-medium text-gray-700'>
                상태 메시지
              </label>
              <span className='text-xs text-gray-500'>{statusMessage.length}/150자</span>
            </div>
            <textarea
              id='statusMessage'
              name='statusMessage'
              rows={3}
              className='block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none'
              placeholder='자신을 표현하는 상태 메시지를 작성해보세요'
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              maxLength={150}
            />
          </div>

          {/* 제출 버튼 */}
          <div>
            <button
              type='submit'
              className='w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors'
              disabled={isSubmitting || isUploading || !nicknameAvailable || !profileImage}
            >
              {isSubmitting ? (
                <div className='flex items-center justify-center'>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-5 w-5 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  처리 중...
                </div>
              ) : (
                '프로필 설정 완료'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
