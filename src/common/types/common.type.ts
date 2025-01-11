import { Branded } from './types';

export type Uuid = Branded<string, 'Uuid'>;

export type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;
