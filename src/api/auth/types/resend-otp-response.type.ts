import { SignInResponse } from '@/api/auth/types/sign-in-response.type';

export type ResendOtpResponse = Pick<SignInResponse, 'id' | 'otpCode'>;
