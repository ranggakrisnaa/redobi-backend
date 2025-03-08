export type RedisConfig = {
  host?: string;
  port: number;
  password?: string;
  tlsEnabled: boolean;
  url?: string;
  retryStrategy: (times: number) => number;
};
