import { AwsService } from '@/libs/aws/aws.service';
import awsConfig from '@/libs/aws/config/aws.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {}
