export namespace Support {
  export const Type = {
    TECHNICAL_ISSUE: 'TECHNICAL_ISSUE',
    ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
    PAYMENT_ISSUE: 'PAYMENT_ISSUE',
    FEATURE_REQUEST: 'FEATURE_REQUEST',
    BILLING_ISSUE: 'BILLING_ISSUE',
    SECURITY_CONCERN: 'SECURITY_CONCERN',
    ETC: 'ETC',
  } as const;
  export type Type = (typeof Type)[keyof typeof Type];

  export const TypeMap = {
    [Support.Type.TECHNICAL_ISSUE]: '기술적 문제',
    [Support.Type.ACCOUNT_ISSUE]: '계정 문제',
    [Support.Type.PAYMENT_ISSUE]: '결제 문제',
    [Support.Type.FEATURE_REQUEST]: '기능 요청',
    [Support.Type.BILLING_ISSUE]: '청구 문제',
    [Support.Type.SECURITY_CONCERN]: '보안 문제',
    [Support.Type.ETC]: '기타',
  } as const;
  export type TypeMap = (typeof TypeMap)[keyof typeof TypeMap];

  export interface ISummary {
    id: number;

    supportType: Type;

    title: string;

    createdAt: string;

    answered: boolean;
  }

  export interface IDetail extends Omit<ISummary, 'answered'> {
    content: string;

    answerContent: string;

    answeredAt: string;
  }

  export class CreateDto {
    supportType!: Type;

    title!: string;

    content!: string;
  }
}
