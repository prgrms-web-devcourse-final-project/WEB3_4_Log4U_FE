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
