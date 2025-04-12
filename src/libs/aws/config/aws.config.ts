import { AwsConfig } from '@/libs/aws/config/aws.config.type';
import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import process from 'node:process';

export class EnvironmentVariablesValidator {
  @IsString()
  CLOUDCUBE_BUCKET: string;

  @IsString()
  CLOUDCUBE_ACCESS_KEY: string;

  @IsString()
  CLOUDCUBE_SECRET_KEY: string;

  @IsString()
  CLOUDCUBE_REGION: string;

  @IsString()
  CLOUDCUBE_URL: string;
}

export default registerAs<AwsConfig>('aws', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    cloudCubeBucket: process.env.CLOUDCUBE_BUCKET,
    cloudCubeAccessKey: process.env.CLOUDCUBE_ACCESS_KEY,
    cloudCubeSecretKey: process.env.CLOUDCUBE_SECRET_KEY,
    cloudCubeRegion: process.env.CLOUDCUBE_REGION,
    cloudCubeUrl: process.env.CLOUDCUBE_URL,
  };
});
