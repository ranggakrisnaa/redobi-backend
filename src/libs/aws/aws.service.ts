import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsService {
  private s3: S3Client;
  private readonly bucket: string;
  private readonly cubeUrl: string;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.get('aws');

    this.bucket = awsConfig.cloudCubeBucket;
    this.cubeUrl = awsConfig.cloudCubeUrl;

    this.s3 = new S3Client({
      region: awsConfig.cloudCubeRegion,
      credentials: {
        accessKeyId: awsConfig.cloudCubeAccessKey,
        secretAccessKey: awsConfig.cloudCubeSecretKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const prefix = this.cubeUrl.split('.com/')[1];
    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `${prefix}/${fileName}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      return `${this.cubeUrl}/${fileName}`;
    } catch (error) {
      if (error instanceof Error) throw error;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  public extractKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1);
  }
}
