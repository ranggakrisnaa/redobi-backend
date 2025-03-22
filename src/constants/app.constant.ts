export const IS_PUBLIC = 'isPublic';
export const IS_AUTH_OPTIONAL = 'isAuthOptional';

export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum LogService {
  CONSOLE = 'console',
  GOOGLE_LOGGING = 'google_logging',
  AWS_CLOUDWATCH = 'aws_cloudwatch',
}

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

// Redact value of these paths from logs
export const loggingRedactPaths = [
  'req.headers.authorization',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.email',
  'req.body.password',
  'req.body.oldPassword',
];

export const DEFAULT = {
  IMAGE_PATH: process.env.APP_IMAGE_PATH,
  IMAGE_DEFAULT:
    'https://res.cloudinary.com/dbuyqvhts/image/upload/v1742657109/uploads/hl8ttu0ry2rosdr9sjb4.png',
};

export const INITIAL_VALUE = {
  STRING: '',
  NUMBER: 0,
  FALSE: false,
};

export const DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_CURRENT_PAGE = 1;
export const SYSTEM_USER_ID = 'system';
