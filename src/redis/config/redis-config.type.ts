export type RedisConfig = {
  host?: string;
  port: number;
  password?: string;
  tlsEnabled: boolean;
<<<<<<< HEAD
=======
  url?: string;
  retryStrategy: (times: number) => number;
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f
};
