import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [HealthModule, AuthModule, HomeModule, SessionModule],
})
export class ApiModule {}
