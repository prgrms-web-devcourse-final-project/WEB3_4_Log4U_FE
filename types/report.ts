export namespace Report {
  export const Type = {
    INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
    FALSE_INFORMATION: 'FALSE_INFORMATION',
    SPAM: 'SPAM',
    COPYRIGHT_INFRINGEMENT: 'COPYRIGHT_INFRINGEMENT',
    PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
    ETC: 'ETC',
  } as const;
  export type Type = (typeof Type)[keyof typeof Type];

  export const TypeLabel = {
    [Type.INAPPROPRIATE_CONTENT]: '부적절한 내용',
    [Type.FALSE_INFORMATION]: '허위 정보',
    [Type.SPAM]: '스팸성 내용',
    [Type.COPYRIGHT_INFRINGEMENT]: '저작권 침해',
    [Type.PRIVACY_VIOLATION]: '개인정보 침해',
    [Type.ETC]: '기타',
  } as const;
  export type TypeLabel = (typeof TypeLabel)[keyof typeof TypeLabel];

  export class CreateDto {
    reportType!: Type;
    content!: string;
  }

  export interface Summary {}

  export interface Detail {}
}
